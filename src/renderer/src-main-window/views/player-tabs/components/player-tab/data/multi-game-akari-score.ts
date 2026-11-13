import { ALL_SGPTAG_VALUE } from '@renderer-shared/composables/useSgpTagOptions'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { type AkariScore, analyzeGames } from '@shared/data-adapter/analysis/player'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import { type LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import PQueue from 'p-queue'
import QuickLRU from 'quick-lru'
import { type MaybeRefOrGetter, computed, markRaw, ref, shallowRef, toValue, watch } from 'vue'

import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import { usePlayerTab } from '../context'
import { useMatchHistory } from './match-history'
import { toLoadStatus } from './source-selection'

export const multiGameAkariScoreLruMap = new QuickLRU<string, AkariScore>({ maxSize: 1000 })
const inFlightRequests = new Map<string, Promise<AkariScore | null>>()
const multiGameFetchQueue = new PQueue({ concurrency: 3 })

export function getMultiGameAkariScoreCacheKey(
  sgpServerId: string,
  puuid: string,
  tag: string | undefined,
  count: number
): string {
  const normalizedTag = !tag || tag === ALL_SGPTAG_VALUE ? 'all' : tag
  return `${sgpServerId}:${puuid}:${normalizedTag}:${count}`
}

export interface FetchPlayerMultiGameScoreOptions {
  puuid: string
  sgpServerId: string
  tag: string | undefined
  count: number
  source: 'sgp' | 'lcu'
  sgp: SgpRenderer
  lc: LeagueClientRenderer
  log?: LoggerRenderer
}

export async function fetchPlayerMultiGameAkariScore(
  options: FetchPlayerMultiGameScoreOptions
): Promise<AkariScore | null> {
  const { puuid, sgpServerId, tag, count, source, sgp, lc, log } = options
  const cacheKey = getMultiGameAkariScoreCacheKey(sgpServerId, puuid, tag, count)

  const cached = multiGameAkariScoreLruMap.get(cacheKey)
  if (cached) {
    return cached
  }

  const existingInFlight = inFlightRequests.get(cacheKey)
  if (existingInFlight) {
    return existingInFlight
  }

  const fetchPromise = (async () => {
    try {
      let summaries: LcuOrSgpGameSummary[] = []

      if (source === 'sgp') {
        const queryTag = !tag || tag === ALL_SGPTAG_VALUE ? undefined : tag
        const { data } = await sgp.api.matchHistoryQuery.getMatchHistorySummaryByPlayerPuuid(
          puuid,
          {
            tag: queryTag,
            startIndex: 0,
            count,
            __sgpServerId: sgpServerId
          }
        )

        summaries = (data.games || [])
          .filter((g) => g.json)
          .map(
            (g) => markRaw({ source: 'sgp', gameId: g.json.gameId, data: g }) as LcuOrSgpGameSummary
          )
      } else {
        const { data } = await lc.api.matchHistory.getMatchHistory(
          puuid,
          0,
          Math.min(count, 100) - 1
        )

        summaries = (data.games?.games || [])
          .filter((g) => !!g && typeof g.gameId === 'number')
          .map((g) => markRaw({ source: 'lcu', data: g, gameId: g.gameId }) as LcuOrSgpGameSummary)
      }

      if (summaries.length === 0) {
        return null
      }

      const preparedGames = summaries.map((g) => ({
        gameId: g.gameId,
        summary: g
      }))

      const analysis = analyzeGames(preparedGames, puuid)
      const score = analysis?.akariScore ?? null

      if (score) {
        multiGameAkariScoreLruMap.set(cacheKey, score)
      }

      return score
    } catch (error) {
      log?.warn(
        'multi-game-akari-score',
        'Failed to fetch player multi-game Akari score',
        puuid,
        error
      )
      return null
    } finally {
      inFlightRequests.delete(cacheKey)
    }
  })()

  inFlightRequests.set(cacheKey, fetchPromise)
  return multiGameFetchQueue.add(() => fetchPromise)
}

export function useCardMultiGameAkariScores(props: {
  summary: MaybeRefOrGetter<LcuOrSgpGameSummary>
  isEnabled: MaybeRefOrGetter<boolean>
}) {
  const pts = usePlayerTabsStore()
  const {
    preferredSource,
    isCrossRegion,
    sgpApiStatus,
    sgpServerId,
    puuid: tabPuuid
  } = usePlayerTab()
  const { page, analysis: tabAnalysis } = useMatchHistory()
  const sgp = useInstance(SgpRenderer)
  const lc = useInstance(LeagueClientRenderer)
  const log = useInstance(LoggerRenderer)

  const multiGameScores = shallowRef<Record<string, AkariScore>>({})
  const isLoadingMultiGameScores = ref(false)

  const dataSourceDecision = computed(() =>
    toLoadStatus({
      preferredSource: preferredSource.value,
      isCrossRegion: isCrossRegion.value,
      sgpApiStatus: sgpApiStatus.value
    })
  )

  const currentTag = computed(() => page.value?.queryParams.tag)
  const currentCount = computed(
    () => page.value?.queryParams.count ?? pts.frontendSettings.loadCount
  )

  const participants = computed(() => {
    const s = toValue(props.summary)
    const basicInfo = toBasicInfo(s)
    return toParticipants(s, basicInfo)
  })

  let fetchAbortController: AbortController | null = null

  const syncScores = async () => {
    const isEnabled = toValue(props.isEnabled)
    if (!isEnabled) {
      if (fetchAbortController) {
        fetchAbortController.abort()
        fetchAbortController = null
      }
      multiGameScores.value = {}
      isLoadingMultiGameScores.value = false
      return
    }

    const tag = currentTag.value
    const count = currentCount.value
    const serverId = sgpServerId.value
    const decision = dataSourceDecision.value

    const nextScores: Record<string, AkariScore> = {}

    // 1. Cache tab owner's score if available
    if (tabAnalysis.value?.akariScore && tabPuuid.value) {
      const selfKey = getMultiGameAkariScoreCacheKey(serverId, tabPuuid.value, tag, count)
      multiGameAkariScoreLruMap.set(selfKey, tabAnalysis.value.akariScore)
    }

    // 2. Check cache for all participants
    const missingPuuids: string[] = []
    for (const p of participants.value) {
      if (!p.puuid) continue

      if (p.puuid === tabPuuid.value && tabAnalysis.value?.akariScore) {
        nextScores[p.puuid] = tabAnalysis.value.akariScore
        continue
      }

      const key = getMultiGameAkariScoreCacheKey(serverId, p.puuid, tag, count)
      const cached = multiGameAkariScoreLruMap.get(key)
      if (cached) {
        nextScores[p.puuid] = cached
      } else {
        missingPuuids.push(p.puuid)
      }
    }

    multiGameScores.value = nextScores

    // 3. Fetch missing participants for this card
    if (missingPuuids.length === 0 || decision.type !== 'load') {
      isLoadingMultiGameScores.value = false
      return
    }

    if (fetchAbortController) {
      fetchAbortController.abort()
    }
    const abortController = new AbortController()
    fetchAbortController = abortController

    isLoadingMultiGameScores.value = true

    try {
      await Promise.all(
        missingPuuids.map(async (playerPuuid) => {
          if (abortController.signal.aborted) return

          const score = await fetchPlayerMultiGameAkariScore({
            puuid: playerPuuid,
            sgpServerId: serverId,
            tag,
            count,
            source: decision.source,
            sgp,
            lc,
            log
          })

          if (abortController.signal.aborted) return

          if (score) {
            multiGameScores.value = {
              ...multiGameScores.value,
              [playerPuuid]: score
            }
          }
        })
      )
    } finally {
      if (fetchAbortController === abortController) {
        isLoadingMultiGameScores.value = false
        fetchAbortController = null
      }
    }
  }

  watch(
    [() => toValue(props.isEnabled), currentTag, currentCount, () => tabAnalysis.value?.akariScore],
    () => {
      syncScores()
    },
    { immediate: true }
  )

  return {
    multiGameScores,
    isLoadingMultiGameScores
  }
}
