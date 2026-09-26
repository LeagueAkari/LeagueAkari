import type { ChampionDataQuery } from '@shared/data-adapter/champion-data'
import type { Qq101HttpApiAxiosHelper, Qq101RiftQuery } from '@shared/http-api-axios-helper/qq101'
import { formatError } from '@shared/utils/errors'

import type { ChampionDataMain } from '../champion-data'
import type { AkariLogger } from '../logger-factory'
import type {
  DraftAllyInput,
  DraftCandidateInput,
  DraftEnemyInput,
  DraftPerformanceSample
} from './scoring'

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

/** 缓存条目上限, 避免长时间运行后无界增长。 */
const CACHE_ENTRY_LIMIT = 512

export interface DraftAdvisorMatchupLoadOptions {
  signal?: AbortSignal
}

export interface DraftOpponentMatchupData {
  enemies: DraftEnemyInput[]

  /** 未能取到对位数据的敌方英雄, 用于向用户解释推荐依据的缺口 */
  missingEnemyChampionIds: number[]
}

export interface DraftAllySynergyData {
  allies: DraftAllyInput[]

  missingAllyChampionIds: number[]
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
   * 取指定位置下所有英雄的基础胜率。走 champion-data 的常规数据源, 因此会尊重
   * 用户在那边选择的来源与偏好, 而不是在这里另起一套。
   */
  async loadBaseWinRates(
    query: ChampionDataQuery,
    options: DraftAdvisorMatchupLoadOptions = {}
  ): Promise<Map<number, DraftCandidateInput>> {
    const candidates = new Map<number, DraftCandidateInput>()

    // champion-data 的公开契约不接受取消信号, 因此只能等它自然结束;
    // 入口先检查一次, 返回后由调用方再检查, 避免为已作废的一轮推荐继续算下去。
    options.signal?.throwIfAborted()

    const result = await this._championData.loadOverview(query)
    if (result.status !== 'success') {
      this._logger.warn(`Draft advisor could not load champion overview (${result.fallbackReason})`)
      return candidates
    }

    for (const item of result.data.sections.champions) {
      candidates.set(item.championId, {
        championId: item.championId,
        baseWinRate: toPercentage(item.performance.winRate),
        games: item.performance.games
      })
    }

    return candidates
  }

  /**
   * 对位数据是"被查询英雄对阵各对手时该英雄自己的胜率"。同一场对局的胜负互补,
   * 因此候选英雄面对该对手的胜率就是它的补数。这样只需按敌方英雄抓取 (最多 5 次),
   * 就能覆盖全部候选, 而不必为每个候选各抓一次。
   */
  async loadEnemyMatchups(
    riftQuery: Qq101RiftQuery,
    enemyChampionIds: readonly number[],
    options: DraftAdvisorMatchupLoadOptions = {}
  ): Promise<DraftOpponentMatchupData> {
    const settled = await Promise.all(
      enemyChampionIds.map(async (enemyChampionId) => ({
        enemyChampionId,
        table: await this._loadMatchupTable(riftQuery, enemyChampionId, options)
      }))
    )

    const enemies: DraftEnemyInput[] = []
    const missingEnemyChampionIds: number[] = []

    for (const item of settled) {
      if (item.table && item.table.size > 0) {
        enemies.push({ championId: item.enemyChampionId, matchups: item.table })
      } else {
        missingEnemyChampionIds.push(item.enemyChampionId)
      }
    }

    return { enemies, missingEnemyChampionIds }
  }

  /**
   * 协同数据是"该英雄与各队友同队时的胜率", 本身就是对称的, 因此可以直接作为
   * 候选英雄与该队友的协同胜率使用, 无需反转。
   */
  async loadAllySynergies(
    riftQuery: Qq101RiftQuery,
    allyChampionIds: readonly number[],
    options: DraftAdvisorMatchupLoadOptions = {}
  ): Promise<DraftAllySynergyData> {
    const settled = await Promise.all(
      allyChampionIds.map(async (allyChampionId) => ({
        allyChampionId,
        table: await this._loadSynergyTable(riftQuery, allyChampionId, options)
      }))
    )

    const allies: DraftAllyInput[] = []
    const missingAllyChampionIds: number[] = []

    for (const item of settled) {
      if (item.table && item.table.size > 0) {
        allies.push({ championId: item.allyChampionId, synergies: item.table })
      } else {
        missingAllyChampionIds.push(item.allyChampionId)
      }
    }

    return { allies, missingAllyChampionIds }
  }

  private async _loadMatchupTable(
    riftQuery: Qq101RiftQuery,
    opponentChampionId: number,
    options: DraftAdvisorMatchupLoadOptions
  ): Promise<Map<number, DraftPerformanceSample> | null> {
    const cacheKey = this._cacheKey(riftQuery, opponentChampionId)
    const cached = this._matchupTableCache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const result = await this._qq101Api.getMatchups(riftQuery, opponentChampionId, options)
      const table = new Map<number, DraftPerformanceSample>()

      for (const entry of [...result.favorable, ...result.unfavorable]) {
        const opponentWinRate = toPercentage(entry.winRate)
        table.set(entry.championId, {
          winRate: opponentWinRate === null ? null : 100 - opponentWinRate,
          games: UNKNOWN_MATCHUP_SAMPLE_SIZE
        })
      }

      setWithLimit(this._matchupTableCache, cacheKey, table)
      return table
    } catch (error) {
      options.signal?.throwIfAborted()
      this._logger.warn(
        `Failed to load matchup data for champion ${opponentChampionId}`,
        formatError(error)
      )
      return null
    }
  }

  private async _loadSynergyTable(
    riftQuery: Qq101RiftQuery,
    allyChampionId: number,
    options: DraftAdvisorMatchupLoadOptions
  ): Promise<Map<number, DraftPerformanceSample> | null> {
    const cacheKey = this._cacheKey(riftQuery, allyChampionId)
    const cached = this._synergyTableCache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const result = await this._qq101Api.getSynergies(riftQuery, allyChampionId, options)
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
        `Failed to load synergy data for champion ${allyChampionId}`,
        formatError(error)
      )
      return null
    }
  }
}
