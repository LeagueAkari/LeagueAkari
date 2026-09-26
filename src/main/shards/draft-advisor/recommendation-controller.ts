import {
  type ChampionDataQuery,
  toQq101Position,
  toQq101Tier
} from '@shared/data-adapter/champion-data'
import type { Qq101RiftQuery } from '@shared/http-api-axios-helper/qq101'
import {
  type DraftAdvisorSnapshot,
  EMPTY_DRAFT_ADVISOR_DATA_GAPS,
  EMPTY_DRAFT_ADVISOR_SNAPSHOT
} from '@shared/types/draft-advisor'
import type { ChampSelectSession } from '@shared/types/league-client/champ-select'
import { formatError } from '@shared/utils/errors'

import type { LeagueClientMain } from '../league-client'
import { readDraftChampSelectSnapshot } from './champ-select-snapshot'
import {
  DRAFT_ADVISOR_DATA_SOURCE,
  DRAFT_ADVISOR_RECOMPUTE_DEBOUNCE_MS,
  type DraftAdvisorMainContext
} from './context'
import type { DraftAdvisorMatchupLoader } from './matchup-data-loader'
import { scoreDraftCandidates, sortDraftCandidatesByScore } from './scoring'

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

    const position = draft.selfPosition ?? 'all'
    const query: ChampionDataQuery = {
      source: DRAFT_ADVISOR_DATA_SOURCE,
      mode: 'ranked',
      position,
      tier: championData.settings.preferences.tier
    }

    const baseSnapshot: Omit<DraftAdvisorSnapshot, 'status' | 'candidates' | 'updatedAt'> = {
      patch: null,
      position: draft.selfPosition,
      allyChampionIds: draft.allyChampionIds,
      enemyChampionIds: draft.enemyChampionIds,
      gaps: EMPTY_DRAFT_ADVISOR_DATA_GAPS
    }

    state.setSnapshot({ ...baseSnapshot, status: 'loading', candidates: [], updatedAt: Date.now() })

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
          updatedAt: Date.now()
        })
        return
      }

      const riftQuery: Qq101RiftQuery = {
        patch,
        tier: toQq101Tier(query.tier),
        position: toQq101Position(position)
      }

      const baseWinRates = await this._loader.loadBaseWinRates(query, { signal })
      if (signal.aborted) {
        return
      }

      const excluded = this._collectExcludedChampionIds(session)
      for (const championId of [...draft.allyChampionIds, ...draft.enemyChampionIds]) {
        excluded.add(championId)
      }

      const candidates = [...baseWinRates.values()].filter(
        (candidate) => !excluded.has(candidate.championId)
      )

      if (candidates.length === 0) {
        state.setSnapshot({
          ...baseSnapshot,
          patch,
          status: 'unavailable',
          candidates: [],
          gaps: { ...EMPTY_DRAFT_ADVISOR_DATA_GAPS, hasBaseWinRates: baseWinRates.size > 0 },
          updatedAt: Date.now()
        })
        return
      }

      const [enemyData, allyData] = await Promise.all([
        this._loader.loadEnemyMatchups(riftQuery, draft.enemyChampionIds, { signal }),
        this._loader.loadAllySynergies(riftQuery, draft.allyChampionIds, { signal })
      ])
      if (signal.aborted) {
        return
      }

      const ranked = sortDraftCandidatesByScore(
        scoreDraftCandidates(candidates, enemyData.enemies, allyData.allies, {
          riskLevel: settings.riskLevel,
          includeBaseWinRate: settings.includeBaseWinRate
        })
      ).slice(0, settings.candidateLimit)

      state.setSnapshot({
        ...baseSnapshot,
        patch,
        status: 'ready',
        candidates: ranked,
        gaps: {
          missingEnemyChampionIds: enemyData.missingEnemyChampionIds,
          missingAllyChampionIds: allyData.missingAllyChampionIds,
          hasBaseWinRates: baseWinRates.size > 0
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
        updatedAt: Date.now()
      })
    }
  }
}
