import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Predicate } from '@shared/data-adapter/predicates/combinators'
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

/**
 * 收集模式下的状态指标
 */
export interface MatchHistoryCollectState {
  /** 战绩页游标，会变化，从 0 开始 */
  cursor: number

  /** 每次加载的战绩数量 */
  countPerLoad: number

  /** 战绩页加载最大数量，用于避免无限加载。这个值一次收集周期内不会变化 */
  maxCount: number

  /** 预期收集到的战绩数量，超过则立即停止收集。这个值一次收集周期内不会变化 */
  expectedCount: number

  /**
   * 除了 count 和 startIndex 以外的查询参数，因为收集模式需要接管这两个参数
   */
  queryParams: Omit<MatchHistoryQueryParams, 'startIndex' | 'count'>

  /** 本次收集模式下的筛选条件 */
  predicate: Predicate<LcuOrSgpGameSummary>
}

/** 
收集模式下的参数
*/
export interface MatchHistoryCollectParams {
  /** 每次加载的战绩数量 */
  countPerIteration: number

  /** 当达到多少次的时候 */
  maxIteration: number

  /** 预期需要凑齐的战绩数量 */
  expectedCount: number

  /** 服务器层面的查询参数 */
  queryParams?: Omit<MatchHistoryQueryParams, 'startIndex' | 'count'>

  /** 本次收集过滤依赖的筛选条件 */
  predicate: Predicate<LcuOrSgpGameSummary>
}

/**
 * 一页战绩
 *
 * 在收集模式下仍然适用，但起始 index 固定为 0
 */
export interface MatchHistoryPage {
  /** 战绩概览，应该是 raw */
  games: LcuOrSgpGameSummary[]

  /** 战绩回放元数据 */
  replayMetadata: Record<number, ReplayMetadata>

  /** 战绩详情 */
  details: Record<number, LcuOrSgpGameDetails>

  /** 加载状态图 */
  detailsLoading: Record<number, boolean>

  /** 服务器查询参数 */
  queryParams: MatchHistoryQueryParams

  /**
   * 这一页战绩是否是收集模式的战绩
   */
  isLoadedByCollectMode: boolean
}

export type MatchHistoryContext = {
  page: Readonly<Ref<MatchHistoryPage | null>>
  filteredGames: Readonly<Ref<LcuOrSgpGameSummary[]>>
  isLoading: Readonly<Ref<boolean>>
  collectIteration: Readonly<Ref<number>>
  loadMatchHistory: (params?: MatchHistoryQueryParams) => Promise<void>
  collectMatchHistory: (params: MatchHistoryCollectParams) => Promise<void>
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
  predicate: MaybeRefOrGetter<(game: LcuOrSgpGameSummary) => boolean>
}) {
  const puuid = toRef(props.puuid)
  const preferredSource = toRef(props.preferredSource)
  const sgpServerId = toRef(props.sgpServerId)
  const isCrossRegion = toRef(props.isCrossRegion)
  const predicate = toRef(props.predicate)

  const componentName = useComponentName()

  const sgp = useInstance(SgpRenderer)
  const sgps = useSgpStore()
  const lc = useInstance(LeagueClientRenderer)
  const pts = usePlayerTabsStore()
  const log = useInstance(LoggerRenderer)

  const { t } = useTranslation()

  const isLoading = ref(false)

  /**
   * 从 0 开始（而不是 1，至于为什么提到这一点，是因为其他页面的分页逻辑，都是从 1 开始的）
   *
   * 其他时候为 -1
   */
  const collectIteration = ref(-1)

  const page = ref<MatchHistoryPage | null>(null)

  /**
   * 被 predicate 过滤后的战绩列表
   */
  const filteredGames = computed(() => {
    if (!page.value) return []

    if (page.value.isLoadedByCollectMode) {
      return page.value.games
    }

    return page.value.games.filter((g) => predicate.value(g))
  })

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

      if (page.value) {
        page.value.replayMetadata[gameId] = markRaw(data)
      }
    }

    await Promise.all(games.map((g) => lcuReplayMetadataQueue.add(() => task(g))))
  }

  const completeLcuGame = async (g: Game): Promise<LcuGameSummary> => {
    const cached = pts.gameSummaryLruMap.get(`lcu:${g.gameId}`) as LcuGameSummary | undefined
    if (cached) {
      return cached
    }

    try {
      const { data } = await lcuLoadDetailedGameQueue.add(() =>
        lc.api.matchHistory.getGame(g.gameId)
      )
      return { source: 'lcu', data: data, gameId: g.gameId }
    } catch (error) {
      return { source: 'lcu', data: g, gameId: g.gameId }
    }
  }

  const loadMatchHistory = async (params: MatchHistoryQueryParams = {}) => {
    if (isLoading.value) return

    lcuLoadDetailedGameQueue.clear()
    isLoading.value = true

    params = {
      ...page.value?.queryParams,
      ...params
    }

    const startIndex = params.startIndex ?? 0
    const count = params.count ?? pts.frontendSettings.loadCount

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

        const { data } = await sgp.api.matchHistoryQuery.getMatchHistorySummaryByPlayerPuuid(
          puuid.value,
          {
            ...params,
            __sgpServerId: sgpServerId.value
          }
        )

        const games = data.games
          .filter((g) => g.json) // 有时候服务器内容错误，没有这个 json 字段，原因不明
          .map(
            (g) => markRaw({ source: 'sgp', gameId: g.json.gameId, data: g }) as LcuOrSgpGameSummary
          )

        page.value = {
          games: markRaw(games),
          replayMetadata: {}, // must be shallow
          details: {}, // must be shallow
          detailsLoading: {}, // must be shallow
          queryParams: params,
          isLoadedByCollectMode: false
        }
      } else {
        const { data } = await lc.api.matchHistory.getMatchHistory(
          puuid.value,
          startIndex,
          startIndex + count - 1
        )

        const games = data.games.games
          .filter((g) => !!g && typeof g.gameId === 'number')
          .map((g) => markRaw({ source: 'lcu', data: g, gameId: g.gameId }) as LcuOrSgpGameSummary)

        const completedGames = await Promise.all(
          games.map(async (g) => {
            if (g.source !== 'lcu') {
              return g
            }

            const complete = await completeLcuGame(g.data)
            pts.gameSummaryLruMap.set(`lcu:${complete.gameId}`, markRaw(complete))
            return markRaw(complete) as LcuOrSgpGameSummary
          })
        )

        completedGames.forEach((g) => {
          if (g.source === 'lcu') {
            pts.gameSummaryLruMap.set(`lcu:${g.gameId}`, markRaw(g))
          }
        })

        page.value = {
          games: markRaw(games),
          replayMetadata: {}, // must be shallow
          details: {}, // must be shallow
          detailsLoading: {}, // must be shallow
          queryParams: params,
          isLoadedByCollectMode: false
        }
      }

      if (!isCrossRegion.value) {
        loadReplayMetadata(page.value.games)
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

  const collectMatchHistory = async (params: MatchHistoryCollectParams) => {
    if (isLoading.value) return

    lcuLoadDetailedGameQueue.clear()
    isLoading.value = true

    const { countPerIteration, maxIteration, expectedCount, queryParams, predicate } = params

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

        collectIteration.value = 0
        page.value = {
          games: markRaw([]),
          replayMetadata: {},
          details: {},
          detailsLoading: {},
          queryParams: queryParams ?? {},
          isLoadedByCollectMode: true
        }

        while (
          page.value.games.length < expectedCount &&
          collectIteration.value < maxIteration &&
          isLoading.value
        ) {
          const { data } = await sgp.api.matchHistoryQuery.getMatchHistorySummaryByPlayerPuuid(
            puuid.value,
            {
              ...queryParams,
              startIndex: collectIteration.value * countPerIteration,
              count: countPerIteration,
              __sgpServerId: sgpServerId.value
            }
          )

          const gamesToAppend = data.games
            .filter((g) => g.json) // 有时候服务器内容错误，没有这个 json 字段，原因不明
            .map((g) =>
              markRaw({ source: 'sgp', gameId: g.json.gameId, data: g } as LcuOrSgpGameSummary)
            )
            .filter((g) => predicate(g))

          page.value.games = markRaw([...page.value.games, ...gamesToAppend])

          if (!isCrossRegion.value) {
            loadReplayMetadata(gamesToAppend)
          }

          collectIteration.value++
        }
      } else {
        collectIteration.value = 0
        page.value = {
          games: markRaw([]),
          replayMetadata: {},
          details: {},
          detailsLoading: {},
          queryParams: queryParams ?? {},
          isLoadedByCollectMode: true
        }

        while (
          page.value.games.length < expectedCount &&
          collectIteration.value < maxIteration &&
          isLoading.value
        ) {
          const { data } = await lc.api.matchHistory.getMatchHistory(
            puuid.value,
            collectIteration.value * countPerIteration,
            (collectIteration.value + 1) * countPerIteration - 1
          )

          const games = data.games.games
            .filter((g) => !!g && typeof g.gameId === 'number')
            .map(
              (g) => markRaw({ source: 'lcu', data: g, gameId: g.gameId }) as LcuOrSgpGameSummary
            )
            .filter((g) => predicate(g))

          const completedGamesToAppend = await Promise.all(
            games.map(async (g) => {
              if (g.source !== 'lcu') {
                return g
              }

              const complete = await completeLcuGame(g.data)
              pts.gameSummaryLruMap.set(`lcu:${complete.gameId}`, markRaw(complete))
              return markRaw(complete) as LcuOrSgpGameSummary
            })
          )

          page.value.games = markRaw([...page.value.games, ...completedGamesToAppend])

          if (!isCrossRegion.value) {
            loadReplayMetadata(completedGamesToAppend)
          }

          collectIteration.value++
        }
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
      collectIteration.value = -1
    }
  }

  const loadDetails = async (gameId: number) => {
    if (!page.value || page.value.detailsLoading[gameId]) return

    page.value.detailsLoading[gameId] = true

    try {
      if (preferredSource.value === 'sgp' || isCrossRegion.value) {
        if (!sgps.isTokenReady) {
          return
        }

        const { data } = await sgp.api.matchHistoryQuery.getGameDetailsByGameId(gameId, {
          __sgpServerId: sgpServerId.value
        })

        page.value.details[gameId] = markRaw({ source: 'sgp', gameId, data })
      } else {
        const { data } = await lc.api.matchHistory.getTimeline(gameId)

        page.value.details[gameId] = markRaw({ source: 'lcu', gameId, data })
      }
    } catch (error) {
      log.error(componentName, error)
    } finally {
      page.value.detailsLoading[gameId] = false
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

  lc.onLcuEventVue<ReplayDownloadProgress>('/lol-replays/v1/metadata/:gameId', (data) => {
    if (data.eventType === 'Update' && page.value) {
      page.value.replayMetadata[data.data.gameId] = markRaw(data.data)
    }
  })

  watch(
    [sgpApiAvailable, preferredSource, puuid, sgpServerId, isCrossRegion],
    ([available]) => {
      lcuLoadDetailedGameQueue.clear()
      lcuReplayMetadataQueue.clear()

      if ((preferredSource.value === 'sgp' || isCrossRegion.value) && !available) {
        return
      }

      loadMatchHistory({
        startIndex: 0,
        count: pts.frontendSettings.loadCount
      })
    },
    { immediate: true }
  )

  provide(MatchHistoryContextKey, {
    page,
    filteredGames,
    isLoading,
    collectIteration,
    loadMatchHistory,
    collectMatchHistory,
    loadDetails,
    downloadReplay,
    launchRelay
  })

  return {
    page,
    filteredGames,
    isLoading,
    collectIteration,
    loadMatchHistory,
    collectMatchHistory,
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
