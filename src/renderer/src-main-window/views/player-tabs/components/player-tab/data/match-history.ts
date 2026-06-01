import { useComponentName } from '@renderer-shared/composables/useComponentName'
import type { SgpApiStatus } from '@renderer-shared/composables/useSgpApiStatus'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { AggregatedAnalysis, analyzeGames } from '@shared/data-adapter/analysis/player'
import { GameRelationship, analyzeRelationship } from '@shared/data-adapter/analysis/relationship'
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
  shallowRef,
  toRef,
  watch
} from 'vue'

import type { MatchHistoryInitParams } from '@main-window/shards/player-tabs/context'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import { InitParamsContext } from '../init-params'
import { toPredicate } from '../widgets/match-history-filters/filter-state'
import {
  createInitParamCollectFilterState,
  createInitParamCollectSettings
} from './match-history-init-param-collect'
import { type PlayerTabDataSourceDecision, toLoadStatus } from './source-selection'

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
 * 收集模式下的状态指标
 */
export interface MatchHistoryCollectState {
  currentIteration: number
  params: MatchHistoryCollectParams
  isStopping: boolean
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

  collectModeStats?: {
    scannedGamesCount: number
  }
}

export type MatchHistoryContext = {
  page: Ref<MatchHistoryPage | null>
  filteredGames: Ref<LcuOrSgpGameSummary[]>
  analysis: Ref<AggregatedAnalysis | null>
  relationship: Ref<Record<string, GameRelationship>>
  isLoading: Ref<boolean>
  collectState: Ref<MatchHistoryCollectState | null>
  loadMatchHistory: (params?: MatchHistoryQueryParams) => Promise<void>
  collectMatchHistory: (params: MatchHistoryCollectParams) => Promise<void>
  stopCollectMatchHistory: () => void
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
export function provideMatchHistory(
  props: {
    puuid: MaybeRefOrGetter<string>
    preferredSource: MaybeRefOrGetter<'lcu' | 'sgp'>
    sgpServerId: MaybeRefOrGetter<string>
    isCrossRegion: MaybeRefOrGetter<boolean>
    sgpApiStatus: MaybeRefOrGetter<SgpApiStatus>
    predicate: MaybeRefOrGetter<(game: LcuOrSgpGameSummary) => boolean>
  },
  initParamsTool: InitParamsContext
): MatchHistoryContext {
  const puuid = toRef(props.puuid)
  const preferredSource = toRef(props.preferredSource)
  const sgpServerId = toRef(props.sgpServerId)
  const sgpApiStatus = toRef(props.sgpApiStatus)
  const isCrossRegion = toRef(props.isCrossRegion)
  const predicate = toRef(props.predicate)

  const componentName = useComponentName()

  const sgp = useInstance(SgpRenderer)
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
  const collectState = ref<MatchHistoryCollectState | null>(null)

  const page = ref<MatchHistoryPage | null>(null)

  const shouldContinueCollecting = () => {
    return !!page.value && !!collectState.value && !collectState.value.isStopping
  }

  const remainingCollectCount = (expectedCount: number) => {
    return Math.max(expectedCount - (page.value?.games.length ?? 0), 0)
  }

  const appendCollectedGames = (games: LcuOrSgpGameSummary[]) => {
    if (!page.value || games.length === 0) {
      return
    }

    page.value.games = markRaw([...page.value.games, ...games])
  }

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

  const analysis = shallowRef<AggregatedAnalysis | null>(null)
  const relationship = computed(() => analyzeRelationship(filteredGames.value, puuid.value))

  /**
   * 给 analysis 使用的输入，显式带上当前 games 对应的 details 引用。
   * 这样 watch source 不仅会响应 summary 变化，也会响应 relevant details 的变化。
   */
  const filteredGameWithDetails = computed(() => {
    return filteredGames.value.map((g) => ({
      gameId: g.gameId,
      summary: g,
      details: page.value?.details[g.gameId]
    }))
  })

  watch(
    [filteredGameWithDetails, puuid],
    ([games, puuid]) => {
      analysis.value = analyzeGames(games, puuid, { previous: analysis.value ?? undefined })
    },
    { immediate: true }
  )

  const notification = useNotification()

  const lcuCompleteGameQueue = new PQueue({ concurrency: 10 })
  const lcuReplayMetadataQueue = new PQueue({ concurrency: 5 })
  const gameDetailsQueue = new PQueue({ concurrency: 5 })

  const dataSourceDecision = computed<PlayerTabDataSourceDecision>(() =>
    toLoadStatus({
      preferredSource: preferredSource.value,
      isCrossRegion: isCrossRegion.value,
      sgpApiStatus: sgpApiStatus.value
    })
  )

  const logDataSourceDecision = (
    decision: PlayerTabDataSourceDecision,
    actionName = 'match history'
  ) => {
    if (decision.type === 'unavailable') {
      log.warn(
        componentName,
        `Cannot load ${actionName}: SGP API is unavailable for ${sgpServerId.value}`
      )
    } else if (decision.type === 'wait') {
      log.info(
        componentName,
        `Waiting for SGP API token readiness before loading ${actionName} from ${sgpServerId.value}`
      )
    } else if (decision.fallbackReason === 'sgp-api-unavailable') {
      log.warn(
        componentName,
        `Falling back to LCU ${actionName}: SGP API is unavailable for ${sgpServerId.value}`
      )
    }
  }

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

  const loadGameDetails = async (games: LcuOrSgpGameSummary[]) => {
    const task = async (game: LcuOrSgpGameSummary) => {
      if (!page.value || page.value.detailsLoading[game.gameId]) {
        return
      }

      if (
        page.value.details[game.gameId] &&
        page.value.details[game.gameId].source === game.source
      ) {
        return
      }

      try {
        let wrappedGame: LcuOrSgpGameDetails

        if (game.source === 'sgp') {
          const { data } = await sgp.api.matchHistoryQuery.getGameDetailsByGameId(game.gameId, {
            __sgpServerId: sgpServerId.value
          })

          wrappedGame = markRaw({ source: 'sgp', gameId: game.gameId, data })
        } else {
          const { data } = await lc.api.matchHistory.getTimeline(game.gameId)
          wrappedGame = markRaw({ source: 'lcu', gameId: game.gameId, data })
        }

        if (page.value) {
          page.value.details[game.gameId] = wrappedGame
        }
      } catch (error) {
        log.warn(componentName, error)
      } finally {
        if (page.value) {
          page.value.detailsLoading[game.gameId] = false
        }
      }
    }

    await Promise.all(games.map((g) => gameDetailsQueue.add(() => task(g))))
  }

  const completeLcuGame = async (g: Game): Promise<LcuGameSummary> => {
    const cached = pts.gameSummaryLruMap.get(`lcu:${g.gameId}`) as LcuGameSummary | undefined
    if (cached) {
      return cached
    }

    try {
      const { data } = await lcuCompleteGameQueue.add(() => lc.api.matchHistory.getGame(g.gameId))
      return { source: 'lcu', data: data, gameId: g.gameId }
    } catch (error) {
      return { source: 'lcu', data: g, gameId: g.gameId }
    }
  }

  const loadMatchHistory = async (params: MatchHistoryQueryParams = {}) => {
    if (isLoading.value) return

    const decision = dataSourceDecision.value
    logDataSourceDecision(decision)

    if (decision.type !== 'load') {
      return
    }

    lcuCompleteGameQueue.clear()
    isLoading.value = true

    params = {
      ...page.value?.queryParams,
      ...params
    }

    const startIndex = params.startIndex ?? 0
    const count = params.count ?? pts.frontendSettings.loadCount

    try {
      if (decision.source === 'sgp') {
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

        const prevDetails = games.reduce(
          (acc, g) => {
            const details = page.value?.details[g.gameId]

            if (details && details.source === g.source) {
              acc[g.gameId] = markRaw(details)
            }

            return acc
          },
          {} as Record<number, LcuOrSgpGameDetails>
        )

        page.value = {
          games: markRaw(games),
          replayMetadata: {}, // must be shallow
          details: prevDetails,
          detailsLoading: {}, // must be shallow
          queryParams: params,
          isLoadedByCollectMode: false
        }

        loadGameDetails(games)
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

        const prevDetails = completedGames.reduce(
          (acc, g) => {
            const details = page.value?.details[g.gameId]
            if (details && details.source === g.source) {
              acc[g.gameId] = markRaw(details)
            }
            return acc
          },
          {} as Record<number, LcuOrSgpGameDetails>
        )

        page.value = {
          games: markRaw(completedGames),
          replayMetadata: {}, // must be shallow
          details: prevDetails,
          detailsLoading: {}, // must be shallow
          queryParams: params,
          isLoadedByCollectMode: false
        }

        loadGameDetails(games)
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

    const decision = dataSourceDecision.value
    logDataSourceDecision(decision, 'match history collection')

    if (decision.type !== 'load') {
      return
    }

    lcuCompleteGameQueue.clear()
    isLoading.value = true
    const collectPageQueryParams = {
      ...page.value?.queryParams,
      ...params.queryParams
    }

    collectState.value = {
      currentIteration: 0,
      params,
      isStopping: false
    }

    try {
      if (decision.source === 'sgp') {
        const lastPageGameIds = new Set<number>()

        collectState.value.currentIteration = 0
        page.value = {
          games: markRaw([]),
          replayMetadata: {},
          details: {},
          detailsLoading: {},
          queryParams: collectPageQueryParams,
          isLoadedByCollectMode: true,
          collectModeStats: {
            scannedGamesCount: 0
          }
        }

        while (
          page.value.games.length < params.expectedCount &&
          collectState.value.currentIteration < collectState.value.params.maxIteration &&
          shouldContinueCollecting()
        ) {
          const { data } = await sgp.api.matchHistoryQuery.getMatchHistorySummaryByPlayerPuuid(
            puuid.value,
            {
              ...params.queryParams,
              startIndex:
                collectState.value.currentIteration * collectState.value.params.countPerIteration,
              count: collectState.value.params.countPerIteration,
              __sgpServerId: sgpServerId.value
            }
          )

          if (!shouldContinueCollecting()) {
            break
          }

          const rawSummaryList = data.games
            .filter((g) => g.json) // 有时候服务器内容错误，没有这个 json 字段，原因不明
            .map((g) =>
              markRaw({ source: 'sgp', gameId: g.json.gameId, data: g } as LcuOrSgpGameSummary)
            )

          if (rawSummaryList.length === 0) {
            break
          }

          page.value.collectModeStats!.scannedGamesCount += rawSummaryList.length

          const gamesToAppend = rawSummaryList
            .filter((g) => params.predicate(g) && !lastPageGameIds.has(g.gameId))
            .slice(0, remainingCollectCount(params.expectedCount))

          gamesToAppend.forEach((g) => lastPageGameIds.add(g.gameId))
          appendCollectedGames(gamesToAppend)

          loadGameDetails(gamesToAppend)

          if (!isCrossRegion.value) {
            loadReplayMetadata(gamesToAppend)
          }

          collectState.value.currentIteration++
        }
      } else {
        const lastPageGameIds = new Set<number>()

        collectState.value.currentIteration = 0
        page.value = {
          games: markRaw([]),
          replayMetadata: {},
          details: {},
          detailsLoading: {},
          queryParams: collectPageQueryParams,
          isLoadedByCollectMode: true,
          collectModeStats: {
            scannedGamesCount: 0
          }
        }

        while (
          page.value.games.length < params.expectedCount &&
          collectState.value.currentIteration < collectState.value.params.maxIteration &&
          shouldContinueCollecting()
        ) {
          const { data } = await lc.api.matchHistory.getMatchHistory(
            puuid.value,
            collectState.value.currentIteration * collectState.value.params.countPerIteration,
            (collectState.value.currentIteration + 1) *
              collectState.value.params.countPerIteration -
              1
          )

          if (!shouldContinueCollecting()) {
            break
          }

          const rawSummaryList = data.games.games
            .filter((g) => !!g && typeof g.gameId === 'number')
            .map(
              (g) => markRaw({ source: 'lcu', data: g, gameId: g.gameId }) as LcuOrSgpGameSummary
            )

          if (rawSummaryList.length === 0) {
            break
          }

          page.value.collectModeStats!.scannedGamesCount += rawSummaryList.length

          const games = rawSummaryList
            .filter((g) => params.predicate(g) && !lastPageGameIds.has(g.gameId))
            .slice(0, remainingCollectCount(params.expectedCount))

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

          if (!shouldContinueCollecting()) {
            break
          }

          completedGamesToAppend.forEach((g) => lastPageGameIds.add(g.gameId))
          appendCollectedGames(completedGamesToAppend)

          loadGameDetails(completedGamesToAppend)

          if (!isCrossRegion.value) {
            loadReplayMetadata(completedGamesToAppend)
          }

          collectState.value.currentIteration++
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
      collectState.value = null
    }
  }

  const stopCollectMatchHistory = () => {
    if (!collectState.value) {
      return
    }

    collectState.value.isStopping = true
    lcuReplayMetadataQueue.clear()
    gameDetailsQueue.clear()
  }

  const loadDetails = async (gameId: number) => {
    if (!page.value || page.value.detailsLoading[gameId]) return

    const decision = dataSourceDecision.value
    logDataSourceDecision(decision, 'match history details')

    if (decision.type !== 'load') {
      return
    }

    page.value.detailsLoading[gameId] = true

    try {
      if (decision.source === 'sgp') {
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

  const collectByInitParams = (initParams: MatchHistoryInitParams | null) => {
    if (!initParams || isLoading.value) {
      return false
    }

    const filterState = createInitParamCollectFilterState(initParams, puuid.value)

    if (!filterState) {
      return false
    }

    log.info(componentName, 'Starting match history collection from init params', initParams)

    collectMatchHistory({
      ...createInitParamCollectSettings(initParams),
      predicate: toPredicate(filterState),
      queryParams: {
        __sgpServerId: sgpServerId.value
      }
    })

    return true
  }

  watch(
    [dataSourceDecision, puuid, sgpServerId],
    () => {
      lcuCompleteGameQueue.clear()
      lcuReplayMetadataQueue.clear()

      const decision = dataSourceDecision.value

      if (decision.type !== 'load') {
        logDataSourceDecision(decision)
        return
      }

      const initParams = initParamsTool.consumeMatchHistoryInitParams()

      if (collectByInitParams(initParams)) {
        return
      }

      // default approach
      loadMatchHistory({
        startIndex: 0,
        count: pts.frontendSettings.loadCount
      })
    },
    { immediate: true }
  )

  initParamsTool.onMatchHistoryInitParamsUpdate((newParams) => {
    log.info(componentName, 'Received updated init params', newParams)
    const decision = dataSourceDecision.value

    if (decision.type !== 'load') {
      logDataSourceDecision(decision, 'match history collection from init params')
      return
    }

    collectByInitParams(newParams)
  })

  provide(MatchHistoryContextKey, {
    page,
    filteredGames,
    analysis,
    relationship,
    isLoading,
    collectState,
    loadMatchHistory,
    collectMatchHistory,
    stopCollectMatchHistory,
    loadDetails,
    downloadReplay,
    launchRelay
  })

  return {
    page,
    filteredGames,
    analysis,
    relationship,
    isLoading,
    collectState,
    loadMatchHistory,
    collectMatchHistory,
    stopCollectMatchHistory,
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
