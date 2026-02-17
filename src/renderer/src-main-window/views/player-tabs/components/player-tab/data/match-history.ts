import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import {
  LcuGameSummary,
  LcuOrSgpGameDetails,
  LcuOrSgpGameSummary
} from '@shared/data-adapter/wrapper'
import { MatchHistoryQueryParams } from '@shared/http-api-axios-helper/sgp/match-history-query'
import { Game } from '@shared/types/league-client/match-history'
import { ReplayDownloadProgress, ReplayMetadata } from '@shared/types/league-client/replays'
import { useTranslation } from 'i18next-vue'
import { useMessage, useNotification } from 'naive-ui'
import PQueue from 'p-queue'
import {
  InjectionKey,
  MaybeRefOrGetter,
  Ref,
  computed,
  inject,
  markRaw,
  provide,
  ref,
  toRef,
  watch
} from 'vue'

import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

export interface PagedMatchHistory {
  /** 战绩概览，应该是 raw */
  games: LcuOrSgpGameSummary[]

  /** 战绩回放元数据 */
  replayMetadata: Record<number, ReplayMetadata>

  /** 战绩详情 */
  details: Record<number, LcuOrSgpGameDetails>

  /** 加载状态图 */
  detailsLoading: Record<number, boolean>

  /** 战绩查询参数 */
  queryParams: MatchHistoryQueryParams
}

export type MatchHistoryContext = {
  pagedMatchHistory: Readonly<Ref<PagedMatchHistory | null>>
  isLoading: Readonly<Ref<boolean>>
  loadMatchHistory: (params?: MatchHistoryQueryParams) => Promise<void>
  loadDetails: (gameId: number) => Promise<void>
  downloadReplay: (gameId: number) => Promise<void>
  launchRelay: (gameId: number) => Promise<void>
}

export const MatchHistoryContextKey: InjectionKey<MatchHistoryContext> = Symbol(
  'PlayerTabMatchHistoryContext'
)

/**
 * 玩家战绩加载
 *
 * 可使用 sgp 数据源，或在跨区时强制使用 sgp 数据源
 *
 * - 目前战绩录像下载只支持 lcu 数据源
 */
export function provideMatchHistory(props: {
  puuid: MaybeRefOrGetter<string>
  preferredSource: MaybeRefOrGetter<'lcu' | 'sgp'>
  sgpServerId: MaybeRefOrGetter<string>
  isCrossRegion: MaybeRefOrGetter<boolean>
  showPractice?: MaybeRefOrGetter<boolean>
}) {
  const puuid = toRef(props.puuid)
  const preferredSource = toRef(props.preferredSource)
  const sgpServerId = toRef(props.sgpServerId)
  const isCrossRegion = toRef(props.isCrossRegion)
  const showPractice = toRef(props.showPractice ?? false)

  const componentName = useComponentName()

  const sgp = useInstance(SgpRenderer)
  const sgps = useSgpStore()
  const lc = useInstance(LeagueClientRenderer)
  const pts = usePlayerTabsStore()
  const log = useInstance(LoggerRenderer)

  const { t } = useTranslation()

  const isLoading = ref(false)
  const pagedMatchHistory = ref<PagedMatchHistory | null>(null)

  const notification = useNotification()

  const lcuLoadDetailedGameQueue = new PQueue({ concurrency: 10 })
  const lcuReplayMetadataQueue = new PQueue({ concurrency: 10 })

  const sgpApiAvailable = computed(() => {
    return (
      sgps.isTokenReady && (sgps.leagueServers.servers[sgpServerId.value]?.matchHistory ?? false)
    )
  })

  const loadReplayMetadata = async (games: LcuOrSgpGameSummary[]) => {
    const { data: conf } = await lc.api.replays.getConfiguration()

    if (!conf.isReplaysEnabled) {
      return
    }

    const task = async (game: LcuOrSgpGameSummary) => {
      let gameId = 0
      let gameMeta = {
        gameVersion: '',
        gameType: '',
        queueId: 0,
        gameEnd: 0
      }

      if (game.source === 'sgp') {
        gameId = game.data.json.gameId
        gameMeta = {
          gameVersion: game.data.json.gameVersion,
          gameType: game.data.json.gameType,
          queueId: game.data.json.queueId,
          gameEnd: game.data.json.gameEndTimestamp
        }
      } else {
        gameId = game.data.gameId
        gameMeta = {
          gameVersion: conf.gameVersion,
          gameType: game.data.gameType,
          queueId: game.data.queueId,
          gameEnd: game.data.gameCreation + game.data.gameDuration * 1000
        }
      }

      await lc.api.replays.createMetadata(gameId, gameMeta)

      const { data } = await lc.api.replays.getMetadata(gameId)

      if (pagedMatchHistory.value) {
        pagedMatchHistory.value.replayMetadata[gameId] = markRaw(data)
      }
    }

    await Promise.all(games.map((g) => lcuReplayMetadataQueue.add(() => task(g))))
  }

  const loadMatchHistory = async (params: MatchHistoryQueryParams = {}) => {
    if (isLoading.value) return

    lcuLoadDetailedGameQueue.clear()
    isLoading.value = true

    params = {
      ...pagedMatchHistory.value?.queryParams,
      ...params
    }

    const visibleStartIndex = params.startIndex ?? 0
    const visibleCount = params.count ?? pts.frontendSettings.loadCount
    const hidePractice = !showPractice.value
    const pageFetchSize = Math.max(visibleCount, pts.frontendSettings.loadCount)

    const isPracticeGame = (g: LcuOrSgpGameSummary) => toBasicInfo(g).gameMode === 'PRACTICETOOL'

    const collectVisibleGames = async (
      fetchChunk: (startIndex: number, count: number) => Promise<LcuOrSgpGameSummary[]>
    ) => {
      const games: LcuOrSgpGameSummary[] = []

      let rawCursor = 0
      let visibleSkipped = 0
      let guard = 0

      while (games.length < visibleCount && guard < 80) {
        const chunk = await fetchChunk(rawCursor, pageFetchSize)
        if (chunk.length === 0) {
          break
        }

        for (const g of chunk) {
          if (!g || typeof g.gameId !== 'number') {
            continue
          }

          if (hidePractice && isPracticeGame(g)) {
            continue
          }

          if (visibleSkipped < visibleStartIndex) {
            visibleSkipped++
            continue
          }

          games.push(g)

          if (games.length >= visibleCount) {
            break
          }
        }

        rawCursor += chunk.length
        guard++

        if (chunk.length < pageFetchSize) {
          break
        }
      }

      return games
    }

    const toCompleteLcuGame = async (g: Game): Promise<LcuGameSummary> => {
      const cached = pts.detailedGameLruMap.get(`lcu:${g.gameId}`) as LcuGameSummary | undefined
      if (cached) {
        return cached
      }

      try {
        const { data } = await lcuLoadDetailedGameQueue.add(() => lc.api.matchHistory.getGame(g.gameId))
        return { source: 'lcu', data: data, gameId: g.gameId }
      } catch (error) {
        return { source: 'lcu', data: g, gameId: g.gameId }
      }
    }

    try {
      if (preferredSource.value === 'sgp' || isCrossRegion.value) {
        // SGP API 需要 token 就绪
        if (!sgps.isTokenReady) {
          return
        }

        // 检查 SGP 服务器支持
        if (!sgps.leagueServers.servers[sgpServerId.value]?.matchHistory) {
          return
        }

        const fetchSgpChunk = async (startIndex: number, count: number) => {
          const { data } = await sgp.api.matchHistoryQuery.getMatchHistorySummaryByPlayerPuuid(
            puuid.value,
            {
              ...params,
              startIndex,
              count,
              __sgpServerId: sgpServerId.value
            }
          )

          return data.games
            .filter((g) => g.json)
            .map((g) => markRaw({ source: 'sgp', gameId: g.json.gameId, data: g }) as LcuOrSgpGameSummary)
        }

        const games = hidePractice
          ? await collectVisibleGames(fetchSgpChunk)
          : await fetchSgpChunk(visibleStartIndex, visibleCount)

        pagedMatchHistory.value = {
          games: markRaw(games),
          replayMetadata: {}, // must be shallow
          details: {}, // must be shallow
          detailsLoading: {}, // must be shallow
          queryParams: params
        }
      } else {
        const fetchLcuSummaryChunk = async (startIndex: number, count: number) => {
          const { data } = await lc.api.matchHistory.getMatchHistory(
            puuid.value,
            startIndex,
            startIndex + count - 1
          )

          return data.games.games
            .filter((g) => !!g && typeof g.gameId === 'number')
            .map((g) => markRaw({ source: 'lcu', data: g, gameId: g.gameId }) as LcuOrSgpGameSummary)
        }

        const selectedGames = hidePractice
          ? await collectVisibleGames(fetchLcuSummaryChunk)
          : await fetchLcuSummaryChunk(visibleStartIndex, visibleCount)

        const games = await Promise.all(
          selectedGames.map(async (g) => {
            if (g.source !== 'lcu') {
              return g
            }

            const complete = await toCompleteLcuGame(g.data)
            pts.detailedGameLruMap.set(`lcu:${complete.gameId}`, markRaw(complete))
            return markRaw(complete) as LcuOrSgpGameSummary
          })
        )

        games.forEach((g) => {
          if (g.source === 'lcu') {
            pts.detailedGameLruMap.set(`lcu:${g.gameId}`, markRaw(g))
          }
        })

        pagedMatchHistory.value = {
          games: markRaw(games),
          replayMetadata: {}, // must be shallow
          details: {}, // must be shallow
          detailsLoading: {}, // must be shallow
          queryParams: params
        }
      }

      if (!isCrossRegion.value) {
        loadReplayMetadata(pagedMatchHistory.value.games)
      }
    } catch (error: any) {
      notification.error({
        title: () => t('PlayerTab.failedToLoadMatchHistoryTitle'),
        content: () => t('PlayerTab.failedToLoadMatchHistoryContent', { reason: error.message }),
        duration: 4000
      })
      log.error(componentName, error)
    } finally {
      isLoading.value = false
    }
  }

  const loadDetails = async (gameId: number) => {
    if (!pagedMatchHistory.value || pagedMatchHistory.value.detailsLoading[gameId]) return

    pagedMatchHistory.value.detailsLoading[gameId] = true

    try {
      if (preferredSource.value === 'sgp' || isCrossRegion.value) {
        // SGP API 需要 token 就绪
        if (!sgps.isTokenReady) {
          return
        }

        const { data } = await sgp.api.matchHistoryQuery.getGameDetailsByGameId(gameId, {
          __sgpServerId: sgpServerId.value
        })

        pagedMatchHistory.value.details[gameId] = markRaw({ source: 'sgp', gameId, data })
      } else {
        const { data } = await lc.api.matchHistory.getTimeline(gameId)

        pagedMatchHistory.value.details[gameId] = markRaw({ source: 'lcu', gameId, data })
      }
    } catch (error) {
      // ignore single detail loading error, just log it
      log.error(componentName, error)
    } finally {
      pagedMatchHistory.value.detailsLoading[gameId] = false
    }
  }

  const message = useMessage()

  const downloadReplay = async (gameId: number) => {
    try {
      await lc.api.replays.downloadRofl(gameId)
    } catch (error: any) {
      message.error(() => t('PlayerTab.failedToDownloadReplay', { reason: error.message }))
    }
  }

  const launchRelay = async (gameId: number) => {
    try {
      await lc.api.replays.watchRofl(gameId)

      message.success(() => t('PlayerTab.operationSuccessTitle'))
    } catch (error: any) {
      message.error(() => t('PlayerTab.failedToLaunchReplay', { reason: error.message }))
    }
  }

  // track replay download progress updates
  lc.onLcuEventVue<ReplayDownloadProgress>('/lol-replays/v1/metadata/:gameId', (data) => {
    if (data.eventType === 'Update' && pagedMatchHistory.value) {
      pagedMatchHistory.value.replayMetadata[data.data.gameId] = markRaw(data.data)
    }
  })

  // 主要监听器：参数变化时加载
  watch(
    [sgpApiAvailable, preferredSource, puuid, sgpServerId, isCrossRegion],
    ([available]) => {
      lcuLoadDetailedGameQueue.clear()
      lcuReplayMetadataQueue.clear()

      // 如果需要 SGP 但 token 未就绪，等待 token 就绪后再加载
      if ((preferredSource.value === 'sgp' || isCrossRegion.value) && !available) {
        return
      }

      loadMatchHistory({
        count: pts.frontendSettings.loadCount
      })
    },
    { immediate: true }
  )

  watch(
    () => showPractice.value,
    () => {
      if (!pagedMatchHistory.value) {
        return
      }

      loadMatchHistory(pagedMatchHistory.value.queryParams)
    }
  )

  provide(MatchHistoryContextKey, {
    pagedMatchHistory,
    isLoading,
    loadMatchHistory,
    loadDetails,
    downloadReplay,
    launchRelay
  })

  return {
    pagedMatchHistory,
    isLoading,
    loadMatchHistory,
    loadDetails,
    downloadReplay,
    launchRelay
  }
}

export function useMatchHistory() {
  const context = inject(MatchHistoryContextKey)

  if (!context) {
    throw new Error('useMatchHistory must be used within a player tab component')
  }

  return context
}
