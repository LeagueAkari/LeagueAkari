import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import {
  LcuGameSummary,
  LcuOrSgpGameDetails,
  LcuOrSgpGameSummary
} from '@shared/data-adapter/wrapper'
import { MatchHistoryQueryParams } from '@shared/http-api-axios-helper/sgp/match-history-query'
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
}) {
  const puuid = toRef(props.puuid)
  const preferredSource = toRef(props.preferredSource)
  const sgpServerId = toRef(props.sgpServerId)
  const isCrossRegion = toRef(props.isCrossRegion)

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
      sgps.isTokenReady && (sgps.sgpServerConfig.servers[sgpServerId.value]?.matchHistory ?? false)
    )
  })

  const loadReplayMetadata = async (games: LcuOrSgpGameSummary[]) => {
    const { data: conf } = await lc.api.replays.getConfiguration()

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

    try {
      if (preferredSource.value === 'sgp' || isCrossRegion.value) {
        // SGP API 需要 token 就绪
        if (!sgps.isTokenReady) {
          return
        }

        // 检查 SGP 服务器支持
        if (!sgps.sgpServerConfig.servers[sgpServerId.value]?.matchHistory) {
          return
        }

        const { data } = await sgp.api.matchHistoryQuery.getMatchHistorySummaryByPlayerPuuid(
          puuid.value,
          {
            ...params,
            __sgpServerId: sgpServerId.value
          }
        )

        const filtered = data.games.filter((g) => g.json)

        pagedMatchHistory.value = {
          games: filtered.map((g) => markRaw({ source: 'sgp', gameId: g.json.gameId, data: g })),
          replayMetadata: {}, // must be shallow
          details: {}, // must be shallow
          detailsLoading: {}, // must be shallow
          queryParams: params
        }
      } else {
        const { data } = await lc.api.matchHistory.getMatchHistory(
          puuid.value,
          params.startIndex ?? 0,
          (params.startIndex ?? 0) + (params.count ?? pts.frontendSettings.loadCount) - 1
        )

        const loadCompleteGameTasks = data.games.games.map(async (g) => {
          const cached = pts.detailedGameLruMap.get(`lcu:${g.gameId}`) as LcuGameSummary | undefined
          if (cached) {
            return cached
          }

          try {
            const { data } = await lcuLoadDetailedGameQueue.add(() =>
              lc.api.matchHistory.getGame(g.gameId)
            )
            return { source: 'lcu', data: data, gameId: g.gameId } as LcuGameSummary
          } catch (error) {
            return { source: 'lcu', data: g, gameId: g.gameId } as LcuGameSummary
          }
        })

        const games = await Promise.all(loadCompleteGameTasks)

        games.forEach((g) => {
          pts.detailedGameLruMap.set(`lcu:${g.gameId}`, markRaw(g))
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
