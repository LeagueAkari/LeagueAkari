import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useSgpApiStatus } from '@renderer-shared/composables/useSgpApiStatus'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import type { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import PQueue from 'p-queue'
import { computed, ref, shallowRef, watch } from 'vue'

import {
  SELF_IMPROVEMENT_QUEUE_ID,
  type SelfImprovementMatch,
  extractSelfImprovementMatch,
  sortSelfImprovementMatchesByTime
} from '../data/self-improvement-metrics'

export const SELF_IMPROVEMENT_MATCH_COUNT_OPTIONS = [20, 50, 100, 200] as const

/** LCU 无法按队列筛选，需要逐页扫描后再挑选单双排对局 */
const LCU_SCAN_PAGE_SIZE = 50
const LCU_MAX_SCAN_COUNT = 500

/** SGP 按位置收集时，逐页向前扫描，直到凑齐目标场次 */
const SGP_POSITION_SCAN_PAGE_SIZE = 50
const SGP_MAX_SCAN_COUNT = 500

export type SelfImprovementDataSource = 'sgp' | 'lcu'

export interface SelfImprovementLoadProgress {
  loaded: number
  total: number
}

/**
 * 加载当前登录玩家的长期对局数据
 *
 * 优先使用 SGP 数据源；SGP 不可用时回退到 LCU。SGP 可用但 Token 尚未就绪时
 * 保持等待状态，Token 就绪后会自动加载。
 */
export function useSelfImprovementData() {
  const lc = useInstance(LeagueClientRenderer)
  const sgp = useInstance(SgpRenderer)
  const sgps = useSgpStore()
  const lcs = useLeagueClientStore()
  const log = useInstance(LoggerRenderer)

  const componentName = useComponentName()
  const sgpApiStatus = useSgpApiStatus()

  const matches = shallowRef<SelfImprovementMatch[]>([])
  const isLoading = ref(false)
  const isWaitingForSgp = ref(false)
  const dataSource = ref<SelfImprovementDataSource | null>(null)
  const lastLoadedAt = ref<Date | null>(null)
  const loadProgress = ref<SelfImprovementLoadProgress | null>(null)
  const error = ref<string | null>(null)
  const matchCount = ref<number>(50)
  const selectedPosition = ref<string | null>(null)
  const availablePositions = ref<string[]>([])

  const handlePositionUpdate = (value: string | null) => {
    selectedPosition.value = value
  }

  const selfPuuid = computed(() => lcs.summoner.me?.puuid ?? '')
  const isConnected = computed(() => !!lcs.summoner.me)
  const canUseSgpMatchHistory = computed(
    () => sgpApiStatus.value.canUse && sgps.availability.serversSupported.matchHistory
  )

  let loadSequence = 0

  const lcuGameQueue = new PQueue({ concurrency: 10 })

  const collectSgpSummaries = async (
    puuid: string,
    position: string | null,
    sequence: number
  ): Promise<LcuOrSgpGameSummary[]> => {
    const target = matchCount.value
    const pageSize = position
      ? SGP_POSITION_SCAN_PAGE_SIZE
      : Math.min(Math.max(target, SGP_POSITION_SCAN_PAGE_SIZE), 200)
    const positions = new Set<string>()
    const collected: LcuOrSgpGameSummary[] = []
    let startIndex = 0
    let scanned = 0

    while (collected.length < target && scanned < SGP_MAX_SCAN_COUNT) {
      const { data } = await sgp.api.matchHistoryQuery.getMatchHistorySummaryByPlayerPuuid(puuid, {
        startIndex,
        count: pageSize,
        tag: `q_${SELF_IMPROVEMENT_QUEUE_ID}`,
        __sgpServerId: sgps.availability.sgpServerId
      })

      const games = data.games.filter((game) => game.json)

      if (games.length === 0) {
        break
      }

      for (const game of games) {
        const participant = game.json.participants.find((item) => item.puuid === puuid)

        if (participant?.teamPosition) {
          positions.add(participant.teamPosition)
        }

        if ((!position || participant?.teamPosition === position) && collected.length < target) {
          collected.push({ source: 'sgp', gameId: game.json.gameId, data: game })
        }
      }

      scanned += games.length
      startIndex += games.length

      if (sequence === loadSequence) {
        loadProgress.value = {
          loaded: collected.length,
          total: target
        }
      }

      if (games.length < pageSize) {
        break
      }
    }

    if (sequence === loadSequence) {
      availablePositions.value = [...positions]
    }

    return collected.slice(0, target)
  }

  const collectLcuSummaries = async (
    puuid: string,
    sequence: number
  ): Promise<LcuOrSgpGameSummary[]> => {
    const rankedGameIds: number[] = []
    const seenGameIds = new Set<number>()
    let scanned = 0

    for (
      let startIndex = 0;
      rankedGameIds.length < matchCount.value && scanned < LCU_MAX_SCAN_COUNT;
      startIndex += LCU_SCAN_PAGE_SIZE
    ) {
      const { data } = await lc.api.matchHistory.getMatchHistory(
        puuid,
        startIndex,
        startIndex + LCU_SCAN_PAGE_SIZE - 1
      )

      const games = (data.games?.games ?? []).filter(
        (game) => !!game && typeof game.gameId === 'number' && !seenGameIds.has(game.gameId)
      )

      if (games.length === 0) {
        break
      }

      for (const game of games) {
        seenGameIds.add(game.gameId)

        if (game.queueId === SELF_IMPROVEMENT_QUEUE_ID && rankedGameIds.length < matchCount.value) {
          rankedGameIds.push(game.gameId)
        }
      }

      scanned += games.length
    }

    const gameIds = rankedGameIds.slice(0, matchCount.value)
    let loaded = 0

    loadProgress.value = {
      loaded,
      total: gameIds.length
    }

    const completed = await Promise.all(
      gameIds.map((gameId) =>
        lcuGameQueue.add(async () => {
          try {
            const { data: game } = await lc.api.matchHistory.getGame(gameId)
            return { source: 'lcu', gameId, data: game } as LcuOrSgpGameSummary
          } catch (error) {
            log.warn(componentName, 'Failed to load LCU game summary', gameId, error)
            return null
          } finally {
            loaded++

            if (loadSequence === sequence) {
              loadProgress.value = {
                loaded,
                total: gameIds.length
              }
            }
          }
        })
      )
    )

    return completed.filter((game) => game !== null)
  }

  const load = async () => {
    const sequence = ++loadSequence

    error.value = null

    const puuid = selfPuuid.value

    if (!puuid) {
      matches.value = []
      dataSource.value = null
      lastLoadedAt.value = null
      isWaitingForSgp.value = false
      isLoading.value = false
      loadProgress.value = null
      return
    }

    const status = sgpApiStatus.value

    if (canUseSgpMatchHistory.value && !status.isReady) {
      isWaitingForSgp.value = true
      isLoading.value = false
      return
    }

    isWaitingForSgp.value = false
    isLoading.value = true
    loadProgress.value = null
    dataSource.value = canUseSgpMatchHistory.value ? 'sgp' : 'lcu'

    try {
      let summaries: LcuOrSgpGameSummary[]

      if (dataSource.value === 'sgp') {
        try {
          summaries = await collectSgpSummaries(puuid, selectedPosition.value, sequence)
        } catch (sgpError) {
          log.warn(componentName, 'Failed to load SGP match history, falling back to LCU', sgpError)

          if (sequence !== loadSequence) {
            return
          }

          dataSource.value = 'lcu'
          availablePositions.value = []
          summaries = await collectLcuSummaries(puuid, sequence)
        }
      } else {
        summaries = await collectLcuSummaries(puuid, sequence)
      }

      if (sequence !== loadSequence) {
        return
      }

      const extracted = summaries
        .map((summary) => extractSelfImprovementMatch(summary, puuid))
        .filter((match): match is SelfImprovementMatch => match !== null)
        .filter((match) => match.queueId === SELF_IMPROVEMENT_QUEUE_ID)

      matches.value = sortSelfImprovementMatchesByTime(extracted)
      lastLoadedAt.value = new Date()
    } catch (loadError: any) {
      if (sequence !== loadSequence) {
        return
      }

      error.value = loadError?.message ?? String(loadError)
      log.warn(componentName, 'Failed to load self-improvement match history', loadError)
    } finally {
      if (sequence === loadSequence) {
        isLoading.value = false
        loadProgress.value = null
      }
    }
  }

  watch(
    [
      selfPuuid,
      () => sgpApiStatus.value.canUse,
      () => sgpApiStatus.value.isReady,
      () => sgps.availability.serversSupported.matchHistory,
      matchCount,
      selectedPosition
    ],
    () => {
      void load()
    },
    { immediate: true }
  )

  return {
    matches,
    isLoading,
    isWaitingForSgp,
    dataSource,
    lastLoadedAt,
    loadProgress,
    error,
    matchCount,
    selectedPosition,
    availablePositions,
    handlePositionUpdate,
    selfPuuid,
    isConnected,
    reload: load
  }
}
