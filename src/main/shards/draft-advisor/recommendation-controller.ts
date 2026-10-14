import {
  type ChampionDataPosition,
  type ChampionDataQuery,
  toQq101Position,
  toQq101Tier
} from '@shared/data-adapter/champion-data'
import type { Qq101RiftQuery } from '@shared/http-api-axios-helper/qq101'
import {
  type DraftAdvisorCandidate,
  type DraftAdvisorSnapshot,
  type DraftAdvisorTeamMember,
  type DraftAdvisorTeamSide,
  EMPTY_DRAFT_ADVISOR_DATA_GAPS,
  EMPTY_DRAFT_ADVISOR_SNAPSHOT
} from '@shared/types/draft-advisor'
import type { ChampSelectSession } from '@shared/types/league-client/champ-select'
import { formatError } from '@shared/utils/errors'

import type { LeagueClientMain } from '../league-client'
import { type DraftChampSelectMember, readDraftChampSelectSnapshot } from './champ-select-snapshot'
import {
  DRAFT_ADVISOR_DATA_SOURCE,
  DRAFT_ADVISOR_RECOMPUTE_DEBOUNCE_MS,
  type DraftAdvisorMainContext
} from './context'
import {
  type DraftAdvisorMatchupLoader,
  type DraftChampionBaseData,
  resolveCandidatePool,
  resolveMemberBaseWinRate
} from './matchup-data-loader'
import {
  type DraftEvaluationContext,
  type DraftScoringOptions,
  buildDraftCandidates,
  resolveTeamScores,
  sortDraftCandidates,
  summarizeTeam
} from './scoring'

/** 尚未算出处境胜率时的阵容行, 让面板在取数据期间也能先把阵容显示出来。 */
function toPlaceholderMembers(
  members: readonly DraftChampSelectMember[]
): DraftAdvisorTeamMember[] {
  return members.map((member) => ({
    championId: member.championId,
    position: member.position,
    winRate: null
  }))
}

interface DraftBoardInput {
  side: DraftAdvisorTeamSide
  pool: readonly number[]
  poolWinRates: ReadonlyMap<number, number | null>
  poolRoles: ReadonlyMap<number, ChampionDataPosition | null>
  allyChampionIds: readonly number[]
  opponentChampionIds: readonly number[]
  context: DraftEvaluationContext
  options: DraftScoringOptions
  sideSurplus: number
  opposingSurplus: number
}

export class DraftAdvisorRecommendationController {
  private _abortController: AbortController | null = null

  private readonly _disposers: Array<() => void> = []

  constructor(
    private readonly _context: DraftAdvisorMainContext,
    private readonly _leagueClient: LeagueClientMain,
    private readonly _loader: DraftAdvisorMatchupLoader
  ) {}

  start() {
    const { mobxUtils, settings } = this._context

    this._disposers.push(
      mobxUtils.reaction(
        () => this._leagueClient.data.champSelect.session,
        () => void this._recompute(),
        { fireImmediately: true, delay: DRAFT_ADVISOR_RECOMPUTE_DEBOUNCE_MS }
      )
    )

    this._disposers.push(
      mobxUtils.reaction(
        () => [
          settings.enabled,
          settings.riskLevel,
          settings.includeBaseWinRate,
          settings.candidateLimit
        ],
        () => void this._recompute(),
        { delay: DRAFT_ADVISOR_RECOMPUTE_DEBOUNCE_MS }
      )
    )
  }

  dispose() {
    this._abortController?.abort()
    this._abortController = null

    for (const dispose of this._disposers) {
      dispose()
    }

    this._disposers.length = 0
  }

  /**
   * 已经被禁用或已经被任何一方选走的英雄都不能再作为候选, 否则会推荐一个根本无法
   * 选到的英雄。禁选列表里可能含 0 表示空位, 这里一并剔除。
   */
  private _collectExcludedChampionIds(session: ChampSelectSession) {
    const excluded = new Set<number>()

    const bans = session.bans
    for (const championId of [...(bans?.myTeamBans ?? []), ...(bans?.theirTeamBans ?? [])]) {
      if (championId > 0) {
        excluded.add(championId)
      }
    }

    return excluded
  }

  /** 阵容成员的基础胜率: 优先取他在本局分路下的数据。 */
  private _memberBaseWinRates(
    members: readonly DraftChampSelectMember[],
    base: DraftChampionBaseData
  ) {
    return new Map(
      members.map((member) => [
        member.championId,
        resolveMemberBaseWinRate(base, member.championId, member.position)
      ])
    )
  }

  /** 成员分路以客户端分配为准; 客户端没给 (盲选等) 时退回数据源的分路。 */
  private _memberRoles(members: readonly DraftChampSelectMember[], base: DraftChampionBaseData) {
    return new Map(
      members.map((member) => [
        member.championId,
        member.position ?? base.roles.get(member.championId) ?? null
      ])
    )
  }

  /** 生成某一方的候选榜: 评分 -> 排序 -> 截断到用户设定条数。 */
  private _buildBoard(input: DraftBoardInput): DraftAdvisorCandidate[] {
    return sortDraftCandidates(
      buildDraftCandidates({
        pool: input.pool,
        side: input.side,
        allyChampionIds: input.allyChampionIds,
        opponentChampionIds: input.opponentChampionIds,
        baseWinRates: input.poolWinRates,
        roles: input.poolRoles,
        context: input.context,
        options: input.options,
        sideSurplus: input.sideSurplus,
        opposingSurplus: input.opposingSurplus
      })
    ).slice(0, this._context.settings.candidateLimit)
  }

  private async _recompute() {
    this._abortController?.abort()

    const abortController = new AbortController()
    this._abortController = abortController

    const { signal } = abortController
    const { logger, settings, state, championData } = this._context

    if (!settings.enabled) {
      state.reset()
      return
    }

    const session = this._leagueClient.data.champSelect.session
    const draft = readDraftChampSelectSnapshot(session)

    if (!session || !draft.actionable) {
      state.setSnapshot({ ...EMPTY_DRAFT_ADVISOR_SNAPSHOT })
      return
    }

    const position = draft.selfPosition

    // 基础胜率一律取"不限分路"的视图: 数据源会按分路各返回一行, 一次请求就能覆盖双方
    // 每个人的分路, 不会把别的位置的胜率安到某个人头上。
    const query: ChampionDataQuery = {
      source: DRAFT_ADVISOR_DATA_SOURCE,
      mode: 'ranked',
      position: 'all',
      tier: championData.settings.preferences.tier
    }

    const baseSnapshot: Omit<
      DraftAdvisorSnapshot,
      'status' | 'candidates' | 'opponentCandidates' | 'updatedAt'
    > = {
      patch: null,
      position,
      selfChampionId: draft.selfChampionId,
      allyMembers: toPlaceholderMembers(draft.allyMembers),
      opponentMembers: toPlaceholderMembers(draft.opponentMembers),
      teamScore: null,
      gaps: { ...EMPTY_DRAFT_ADVISOR_DATA_GAPS, positionUnknown: position === null }
    }

    state.setSnapshot({
      ...baseSnapshot,
      status: 'loading',
      candidates: [],
      opponentCandidates: [],
      updatedAt: Date.now()
    })

    try {
      signal.throwIfAborted()

      const patches = await championData.loadPatches(query)
      if (signal.aborted) {
        return
      }

      const patch = patches.status === 'success' ? (patches.data[0] ?? null) : null
      if (!patch) {
        logger.warn('Draft advisor could not resolve a patch to recommend against')
        state.setSnapshot({
          ...baseSnapshot,
          status: 'unavailable',
          candidates: [],
          opponentCandidates: [],
          updatedAt: Date.now()
        })
        return
      }

      const riftQuery: Qq101RiftQuery = {
        patch,
        tier: toQq101Tier(query.tier),
        position: toQq101Position(position ?? 'all')
      }

      const base = await this._loader.loadBaseWinRates(query, { signal })
      if (signal.aborted) {
        return
      }

      const allyChampionIds = draft.allyMembers.map((member) => member.championId)
      const opponentChampionIds = draft.opponentMembers.map((member) => member.championId)

      // 位置未知时对位与协同端点会整体返回空, 这两组请求发了也是白发, 直接跳过,
      // 免得平白多出十几次注定失败的请求, 也让缺口提示更准确。
      const [matchupResult, synergyResult] =
        position === null
          ? [
              { tables: new Map(), missingChampionIds: [] },
              { tables: new Map(), missingChampionIds: [] }
            ]
          : await Promise.all([
              this._loader.loadEnemyMatchups(riftQuery, opponentChampionIds, { signal }),
              this._loader.loadAllySynergies(riftQuery, allyChampionIds, { signal })
            ])
      if (signal.aborted) {
        return
      }

      const evaluationContext: DraftEvaluationContext = {
        matchups: matchupResult.tables,
        synergies: synergyResult.tables
      }

      const scoringOptions: DraftScoringOptions = {
        riskLevel: settings.riskLevel,
        includeBaseWinRate: settings.includeBaseWinRate
      }

      const allySummary = summarizeTeam(
        allyChampionIds,
        opponentChampionIds,
        this._memberBaseWinRates(draft.allyMembers, base),
        this._memberRoles(draft.allyMembers, base),
        evaluationContext,
        scoringOptions
      )

      const opponentSummary = summarizeTeam(
        opponentChampionIds,
        allyChampionIds,
        this._memberBaseWinRates(draft.opponentMembers, base),
        this._memberRoles(draft.opponentMembers, base),
        evaluationContext,
        scoringOptions
      )

      const pool = resolveCandidatePool(base, position)
      const excluded = this._collectExcludedChampionIds(session)
      for (const championId of [...allyChampionIds, ...opponentChampionIds]) {
        excluded.add(championId)
      }

      const candidateChampionIds = pool.championIds.filter(
        (championId) => !excluded.has(championId)
      )

      if (candidateChampionIds.length === 0) {
        state.setSnapshot({
          ...baseSnapshot,
          patch,
          status: 'unavailable',
          candidates: [],
          opponentCandidates: [],
          gaps: { ...baseSnapshot.gaps, hasBaseWinRates: base.winRates.size > 0 },
          updatedAt: Date.now()
        })
        return
      }

      const boardInput = {
        pool: candidateChampionIds,
        poolWinRates: pool.winRates,
        poolRoles: pool.roles,
        allyChampionIds,
        opponentChampionIds,
        context: evaluationContext,
        options: scoringOptions
      }

      const candidates = this._buildBoard({
        ...boardInput,
        side: 'ally',
        sideSurplus: allySummary.surplus,
        opposingSurplus: opponentSummary.surplus
      })

      const opponentCandidates = this._buildBoard({
        ...boardInput,
        side: 'opponent',
        sideSurplus: opponentSummary.surplus,
        opposingSurplus: allySummary.surplus
      })

      state.setSnapshot({
        ...baseSnapshot,
        patch,
        status: 'ready',
        allyMembers: allySummary.members,
        opponentMembers: opponentSummary.members,
        // 双方都没能计入任何成员时分不出强弱, 报 null 比报 50/50 更诚实。
        teamScore:
          allySummary.countedMembers + opponentSummary.countedMembers > 0
            ? resolveTeamScores(allySummary.surplus, opponentSummary.surplus)
            : null,
        candidates,
        opponentCandidates,
        gaps: {
          missingEnemyChampionIds: matchupResult.missingChampionIds,
          missingAllyChampionIds: synergyResult.missingChampionIds,
          hasBaseWinRates: base.winRates.size > 0,
          positionUnknown: position === null
        },
        updatedAt: Date.now()
      })
    } catch (error) {
      if (signal.aborted) {
        return
      }

      logger.error('Failed to compute draft recommendations', formatError(error))
      state.setSnapshot({
        ...baseSnapshot,
        status: 'error',
        candidates: [],
        opponentCandidates: [],
        updatedAt: Date.now()
      })
    }
  }
}
