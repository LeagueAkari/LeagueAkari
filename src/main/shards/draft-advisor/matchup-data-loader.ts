import type { ChampionDataPosition, ChampionDataQuery } from '@shared/data-adapter/champion-data'
import type { Qq101HttpApiAxiosHelper, Qq101RiftQuery } from '@shared/http-api-axios-helper/qq101'
import { formatError } from '@shared/utils/errors'

import type { ChampionDataMain } from '../champion-data'
import type { AkariLogger } from '../logger-factory'
import type { DraftMatchupTables, DraftPerformanceSample, DraftSynergyTables } from './scoring'

/**
 * 适配层统一以 0-1 比率表达胜率 (`percentageToRatio`), 而推荐评分使用百分比量纲,
 * 便于面板直接把分数当作胜率展示。转换只在这一层做一次。
 */
export function toPercentage(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) {
    return null
  }

  return value * 100
}

/**
 * QQ101 的对位榜只给出胜率, 不给出样本量, 而协同榜两者都有。对位数据的样本量既然
 * 不可知, 就不能当成"样本充足"。这里用一个保守的等效样本量参与收缩, 让这些信号
 * 保持在中等可信度, 既不被当作噪声丢弃, 也不会压过有真实样本量的协同信号。
 */
export const UNKNOWN_MATCHUP_SAMPLE_SIZE = 1200

/** 缓存条目上限, 避免长时间运行后仍无界增长。 */
const CACHE_ENTRY_LIMIT = 512

export interface DraftAdvisorMatchupLoadOptions {
  signal?: AbortSignal
}

/**
 * 英雄的基础数据。
 *
 * 数据源在不指定分路时, 会把同一英雄按分路各返回一行。实测这些行与按分路单独查询
 * 的结果完全一致, 因此一次请求就能拿到"全部英雄 × 全部分路"的矩阵, 不必按分路发 5 次。
 */
export interface DraftChampionBaseData {
  /** 每英雄的代表性基础胜率, 取样本最集中的那个分路 */
  winRates: Map<number, number | null>

  /** 每英雄的代表性分路 */
  roles: Map<number, ChampionDataPosition | null>

  /** 分路维度: championId -> 分路 -> 该分路下的基础胜率 */
  winRatesByPosition: Map<number, Map<ChampionDataPosition, number | null>>
}

export interface DraftCandidatePool {
  championIds: number[]

  /** 仅包含池内英雄及其在本方分路下的胜率 */
  winRates: Map<number, number | null>

  roles: Map<number, ChampionDataPosition | null>
}

export interface DraftMatchupLoadResult {
  /** 以被查询英雄为基准的对位表, 只包含真正取到数据的英雄 */
  tables: DraftMatchupTables

  /** 未能取到对位数据的英雄, 用于向用户解释推荐依据的缺口 */
  missingChampionIds: number[]
}

export interface DraftSynergyLoadResult {
  tables: DraftSynergyTables

  missingChampionIds: number[]
}

function setWithLimit<K, V>(cache: Map<K, V>, key: K, value: V) {
  if (cache.size >= CACHE_ENTRY_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) {
      cache.delete(oldest)
    }
  }

  cache.set(key, value)
}

/**
 * 从全量基础数据里切出"真正可以推荐给这个位置"的英雄。
 *
 * 指定位置时只保留该位置确有数据的英雄：换个位置就是另一套出装与打法, 拿别的分路的
 * 胜率去推荐会误导。位置未知时退回每英雄的代表性数据。
 */
export function resolveCandidatePool(
  base: DraftChampionBaseData,
  position: ChampionDataPosition | null
): DraftCandidatePool {
  const championIds: number[] = []
  const winRates = new Map<number, number | null>()
  const roles = new Map<number, ChampionDataPosition | null>()

  for (const championId of base.winRates.keys()) {
    const byPosition = base.winRatesByPosition.get(championId)

    if (position) {
      if (!byPosition?.has(position)) {
        continue
      }

      championIds.push(championId)
      winRates.set(championId, byPosition.get(position) ?? null)
      roles.set(championId, position)
      continue
    }

    championIds.push(championId)
    winRates.set(championId, base.winRates.get(championId) ?? null)
    roles.set(championId, base.roles.get(championId) ?? null)
  }

  return { championIds, winRates, roles }
}

/**
 * 取某个英雄在指定分路下的基础胜率。分路未知、或该英雄在这个分路没有数据时, 退回它的
 * 代表性胜率 —— 阵容里其他人不一定玩在自己被判定的分路上。
 */
export function resolveMemberBaseWinRate(
  base: DraftChampionBaseData,
  championId: number,
  position: ChampionDataPosition | null
): number | null {
  if (position) {
    const byPosition = base.winRatesByPosition.get(championId)
    if (byPosition?.has(position)) {
      return byPosition.get(position) ?? null
    }
  }

  return base.winRates.get(championId) ?? null
}

export class DraftAdvisorMatchupLoader {
  private readonly _matchupTableCache = new Map<string, Map<number, DraftPerformanceSample>>()
  private readonly _synergyTableCache = new Map<string, Map<number, DraftPerformanceSample>>()

  constructor(
    private readonly _logger: AkariLogger,
    private readonly _championData: ChampionDataMain,
    private readonly _qq101Api: Qq101HttpApiAxiosHelper
  ) {}

  private _cacheKey(riftQuery: Qq101RiftQuery, championId: number) {
    return `${riftQuery.patch}|${riftQuery.tier}|${riftQuery.position}|${championId}`
  }

  /**
   * 取所有英雄的基础胜率与分路。走 champion-data 的常规数据源, 因此会尊重用户在那边的
   * 来源与偏好, 而不是在这里另起一套。
   *
   * 调用方应当用"不限分路"的查询, 这样才能一次拿到全部分路的矩阵。同一英雄按分路重复
   * 出现时, 用样本最集中的那个分路作为它的代表, 而不是随便留一条 —— 否则一个只打过几把
   * 的副位置可能盖过它的主位置。
   */
  async loadBaseWinRates(
    query: ChampionDataQuery,
    options: DraftAdvisorMatchupLoadOptions = {}
  ): Promise<DraftChampionBaseData> {
    const winRates = new Map<number, number | null>()
    const roles = new Map<number, ChampionDataPosition | null>()
    const winRatesByPosition = new Map<number, Map<ChampionDataPosition, number | null>>()
    const representativePickRate = new Map<number, number>()

    // champion-data 的公开契约不接受取消信号, 因此只能等它自然结束;
    // 入口先检查一次, 返回后由调用方再检查, 避免为已作废的一轮推荐继续算下去。
    options.signal?.throwIfAborted()

    const result = await this._championData.loadOverview(query)
    if (result.status !== 'success') {
      this._logger.warn(`Draft advisor could not load champion overview (${result.fallbackReason})`)
      return { winRates, roles, winRatesByPosition }
    }

    for (const item of result.data.sections.champions) {
      const winRate = toPercentage(item.performance.winRate)

      const byPosition = winRatesByPosition.get(item.championId) ?? new Map()
      byPosition.set(item.position, winRate)
      winRatesByPosition.set(item.championId, byPosition)

      const pickRate = item.performance.pickRate ?? 0
      const previous = representativePickRate.get(item.championId)

      if (previous !== undefined && previous >= pickRate) {
        continue
      }

      representativePickRate.set(item.championId, pickRate)
      winRates.set(item.championId, winRate)
      roles.set(item.championId, item.position)
    }

    return { winRates, roles, winRatesByPosition }
  }

  /**
   * 取指定英雄的对位表。
   *
   * 数据源返回的是"被查询英雄对阵各对手时它自己的胜率", 与表集的取向一致, 因此直接落表。
   * 由于对位是互斥结果, 一方拿到表以后, 另一方的胜率就是它的补数 —— 于是只需按敌方英雄
   * 抓取 (最多 5 次) 就能覆盖全部候选, 而不必为每个候选各抓一次 (40 个候选就是 40 次)。
   */
  async loadEnemyMatchups(
    riftQuery: Qq101RiftQuery,
    enemyChampionIds: readonly number[],
    options: DraftAdvisorMatchupLoadOptions = {}
  ): Promise<DraftMatchupLoadResult> {
    const settled = await Promise.all(
      enemyChampionIds.map(async (enemyChampionId) => ({
        championId: enemyChampionId,
        table: await this._loadMatchupTable(riftQuery, enemyChampionId, options)
      }))
    )

    const tables = new Map<number, Map<number, DraftPerformanceSample>>()
    const missingChampionIds: number[] = []

    for (const item of settled) {
      if (item.table && item.table.size > 0) {
        tables.set(item.championId, item.table)
      } else {
        missingChampionIds.push(item.championId)
      }
    }

    return { tables, missingChampionIds }
  }

  /**
   * 取指定英雄的协同表。
   *
   * 协同是"该英雄与各搭档同队时的胜率", 本身就是对称的, 因此从任一侧读都是同一个值,
   * 无需反转。
   */
  async loadAllySynergies(
    riftQuery: Qq101RiftQuery,
    allyChampionIds: readonly number[],
    options: DraftAdvisorMatchupLoadOptions = {}
  ): Promise<DraftSynergyLoadResult> {
    const settled = await Promise.all(
      allyChampionIds.map(async (allyChampionId) => ({
        championId: allyChampionId,
        table: await this._loadSynergyTable(riftQuery, allyChampionId, options)
      }))
    )

    const tables = new Map<number, Map<number, DraftPerformanceSample>>()
    const missingChampionIds: number[] = []

    for (const item of settled) {
      if (item.table && item.table.size > 0) {
        tables.set(item.championId, item.table)
      } else {
        missingChampionIds.push(item.championId)
      }
    }

    return { tables, missingChampionIds }
  }

  private async _loadMatchupTable(
    riftQuery: Qq101RiftQuery,
    queriedChampionId: number,
    options: DraftAdvisorMatchupLoadOptions
  ): Promise<Map<number, DraftPerformanceSample> | null> {
    const cacheKey = this._cacheKey(riftQuery, queriedChampionId)
    const cached = this._matchupTableCache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const result = await this._qq101Api.getMatchups(riftQuery, queriedChampionId, options)
      const table = new Map<number, DraftPerformanceSample>()

      for (const entry of [...result.favorable, ...result.unfavorable]) {
        table.set(entry.championId, {
          winRate: toPercentage(entry.winRate),
          games: UNKNOWN_MATCHUP_SAMPLE_SIZE
        })
      }

      setWithLimit(this._matchupTableCache, cacheKey, table)
      return table
    } catch (error) {
      options.signal?.throwIfAborted()
      this._logger.warn(
        `Failed to load matchup data for champion ${queriedChampionId}`,
        formatError(error)
      )
      return null
    }
  }

  private async _loadSynergyTable(
    riftQuery: Qq101RiftQuery,
    queriedChampionId: number,
    options: DraftAdvisorMatchupLoadOptions
  ): Promise<Map<number, DraftPerformanceSample> | null> {
    const cacheKey = this._cacheKey(riftQuery, queriedChampionId)
    const cached = this._synergyTableCache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const result = await this._qq101Api.getSynergies(riftQuery, queriedChampionId, options)
      const table = new Map<number, DraftPerformanceSample>()

      for (const entry of result.synergies) {
        table.set(entry.championId, {
          winRate: toPercentage(entry.winRate),
          games: entry.games
        })
      }

      setWithLimit(this._synergyTableCache, cacheKey, table)
      return table
    } catch (error) {
      options.signal?.throwIfAborted()
      this._logger.warn(
        `Failed to load synergy data for champion ${queriedChampionId}`,
        formatError(error)
      )
      return null
    }
  }
}
