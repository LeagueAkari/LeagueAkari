import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import {
  MatchParticipantPosition,
  normalizeMatchParticipantPosition,
  toParticipants
} from '@shared/data-adapter/match-history/participants'
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

import type { MatchHistoryTimeRange } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import { MATCH_HISTORY_POSITIONS, MatchHistoryFilterMode } from './match-history-filters'
import { shouldHideMatchHistoryGame } from './match-history-visibility'

export type MatchHistoryQueryState = MatchHistoryQueryParams & {
  timeRange?: MatchHistoryTimeRange
}

const TIME_RANGE_MS_MAP: Record<Exclude<MatchHistoryTimeRange, 'all'>, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000
}

function toGameCreationTimestamp(game: LcuOrSgpGameSummary): number {
  if (game.source === 'sgp') {
    return game.data.json.gameCreation
  }

  return game.data.gameCreation
}

function normalizeChampionFilter(ids: number[]): number[] {
  return [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))].sort((a, b) => a - b)
}

function isMatchHistoryPosition(
  position: MatchParticipantPosition | null
): position is MatchParticipantPosition {
  return !!position && MATCH_HISTORY_POSITIONS.includes(position)
}

function normalizePositionFilter(positions: string[]): MatchParticipantPosition[] {
  return [
    ...new Set(
      positions
        .map((position) => normalizeMatchParticipantPosition(position))
        .filter(isMatchHistoryPosition)
    )
  ].sort()
}

function normalizeSummonerFilter(puuids: string[]): string[] {
  return [...new Set(puuids.filter((puuid) => !!puuid))].sort()
}

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
  queryParams: MatchHistoryQueryState
}

export type MatchHistoryContext = {
  pagedMatchHistory: Readonly<Ref<PagedMatchHistory | null>>
  isLoading: Readonly<Ref<boolean>>
  loadMatchHistory: (params?: MatchHistoryQueryState) => Promise<void>
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
  filterMode?: MaybeRefOrGetter<MatchHistoryFilterMode>
  winLoss?: MaybeRefOrGetter<'all' | 'win' | 'loss'>
  selectedChampions?: MaybeRefOrGetter<number[]>
  selectedPositions?: MaybeRefOrGetter<string[]>
  selectedSummoners?: MaybeRefOrGetter<string[]>
  showPractice?: MaybeRefOrGetter<boolean>
  showIrregularGames?: MaybeRefOrGetter<boolean>
}) {
  const puuid = toRef(props.puuid)
  const preferredSource = toRef(props.preferredSource)
  const sgpServerId = toRef(props.sgpServerId)
  const isCrossRegion = toRef(props.isCrossRegion)
  const filterMode = toRef(props.filterMode ?? 'simple')
  const winLoss = toRef(props.winLoss ?? 'all')
  const selectedChampions = toRef(props.selectedChampions ?? [])
  const selectedPositions = toRef(props.selectedPositions ?? [])
  const selectedSummoners = toRef(props.selectedSummoners ?? [])
  const showPractice = toRef(props.showPractice ?? false)
  const showIrregularGames = toRef(props.showIrregularGames ?? false)

  const componentName = useComponentName()

  const sgp = useInstance(SgpRenderer)
  const sgps = useSgpStore()
  const lc = useInstance(LeagueClientRenderer)
  const pts = usePlayerTabsStore()
  const log = useInstance(LoggerRenderer)

  const { t } = useTranslation()

  const isLoading = ref(false)
  const pagedMatchHistory = ref<PagedMatchHistory | null>(null)
  const pendingLoadParams = ref<MatchHistoryQueryState | null>(null)

  const notification = useNotification()

  const lcuLoadDetailedGameQueue = new PQueue({ concurrency: 10 })
  const lcuReplayMetadataQueue = new PQueue({ concurrency: 10 })

  const getDefaultQueryParams = (): MatchHistoryQueryState => {
    const defaultTag = pts.frontendSettings.defaultMatchHistoryTag
    return {
      count: pts.frontendSettings.loadCount,
      timeRange: pts.frontendSettings.defaultMatchHistoryTimeRange,
      tag: defaultTag.startsWith('<akari:') ? undefined : defaultTag
    }
  }

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

  const loadMatchHistory = async (params: MatchHistoryQueryState = {}) => {
    if (isLoading.value) {
      pendingLoadParams.value = {
        ...(pendingLoadParams.value ??
          pagedMatchHistory.value?.queryParams ??
          getDefaultQueryParams()),
        ...params
      }
      return
    }

    lcuLoadDetailedGameQueue.clear()
    isLoading.value = true

    const queryParams: MatchHistoryQueryState = {
      ...pagedMatchHistory.value?.queryParams,
      ...params
    }

    const currentTimeRange = queryParams.timeRange ?? 'all'
    queryParams.timeRange = currentTimeRange

    const isTimeRangeMode = currentTimeRange !== 'all'
    queryParams.startIndex = isTimeRangeMode ? 0 : (queryParams.startIndex ?? 0)

    const useSimpleFilters = filterMode.value === 'simple'
    const currentWinLoss = useSimpleFilters ? winLoss.value : 'all'
    const currentShowPractice = useSimpleFilters ? showPractice.value : true
    const currentShowIrregularGames = useSimpleFilters ? showIrregularGames.value : true
    const visibleStartIndex = queryParams.startIndex
    const visibleCount = isTimeRangeMode
      ? Number.POSITIVE_INFINITY
      : (queryParams.count ?? pts.frontendSettings.loadCount)
    const shouldFilterByWinLoss = currentWinLoss !== 'all'
    const selectedChampionSet = new Set<number>(
      useSimpleFilters ? normalizeChampionFilter(selectedChampions.value) : []
    )
    const shouldFilterByChampion = selectedChampionSet.size > 0
    const selectedPositionSet = new Set<string>(
      useSimpleFilters ? normalizePositionFilter(selectedPositions.value) : []
    )
    const shouldFilterByPosition = selectedPositionSet.size > 0
    const selectedSummonerSet = new Set<string>(
      useSimpleFilters ? normalizeSummonerFilter(selectedSummoners.value) : []
    )
    const shouldFilterBySummoners = selectedSummonerSet.size > 0
    const needsParticipantFilters =
      shouldFilterByChampion ||
      shouldFilterByWinLoss ||
      shouldFilterByPosition ||
      shouldFilterBySummoners
    const hideByVisibilityOptions = !currentShowPractice || !currentShowIrregularGames
    const shouldFilterByTimeRange = isTimeRangeMode
    const timeRangeStartMs = shouldFilterByTimeRange
      ? Date.now() - TIME_RANGE_MS_MAP[currentTimeRange]
      : null
    const pageFetchSize = isTimeRangeMode
      ? Math.max(100, pts.frontendSettings.loadCount)
      : Math.max(visibleCount, pts.frontendSettings.loadCount)
    const maxChunkRequests =
      isTimeRangeMode ||
      shouldFilterByChampion ||
      shouldFilterByWinLoss ||
      shouldFilterByPosition ||
      shouldFilterBySummoners
        ? 500
        : Math.max(80, Math.ceil((visibleStartIndex + visibleCount) / pageFetchSize) + 5)

    const createEmptyPagedMatchHistory = () => {
      return {
        games: markRaw([] as LcuOrSgpGameSummary[]),
        replayMetadata: {},
        details: {},
        detailsLoading: {},
        queryParams
      } satisfies PagedMatchHistory
    }

    const appendGamesToCurrentList = (games: LcuOrSgpGameSummary[]) => {
      if (!pagedMatchHistory.value || games.length === 0) {
        return
      }

      pagedMatchHistory.value.games = markRaw([...pagedMatchHistory.value.games, ...games])
    }

    const appendLcuCompletedGames = async (games: LcuOrSgpGameSummary[]) => {
      let nextAppendIndex = 0
      const completedGames = new Map<number, LcuOrSgpGameSummary>()

      const flushReadyGames = () => {
        const toAppend: LcuOrSgpGameSummary[] = []

        while (completedGames.has(nextAppendIndex)) {
          toAppend.push(completedGames.get(nextAppendIndex)!)
          completedGames.delete(nextAppendIndex)
          nextAppendIndex++
        }

        if (toAppend.length > 0) {
          appendGamesToCurrentList(toAppend)
        }
      }

      await Promise.all(
        games.map(async (g, index) => {
          if (g.source !== 'lcu') {
            completedGames.set(index, g)
            flushReadyGames()
            return
          }

          const complete = await toCompleteLcuGame(g.data)
          const completeGame = markRaw(complete) as LcuOrSgpGameSummary

          pts.detailedGameLruMap.set(`lcu:${complete.gameId}`, completeGame)
          completedGames.set(index, completeGame)
          flushReadyGames()
        })
      )
    }

    const collectVisibleGames = async (
      fetchChunk: (startIndex: number, count: number) => Promise<LcuOrSgpGameSummary[]>,
      onChunkCollected?: (games: LcuOrSgpGameSummary[]) => void
    ) => {
      const games: LcuOrSgpGameSummary[] = []

      let rawCursor = 0
      let visibleSkipped = 0
      let guard = 0

      while ((isTimeRangeMode || games.length < visibleCount) && guard < maxChunkRequests) {
        const chunk = await fetchChunk(rawCursor, pageFetchSize)
        if (chunk.length === 0) {
          break
        }

        let hasTimeInRangeGameInChunk = false
        let hasTimeOutOfRangeGameInChunk = false
        const collectedInChunk: LcuOrSgpGameSummary[] = []

        for (const g of chunk) {
          if (!g || typeof g.gameId !== 'number') {
            continue
          }

          if (
            shouldHideMatchHistoryGame(g, puuid.value, {
              showPractice: currentShowPractice,
              showIrregularGames: currentShowIrregularGames
            })
          ) {
            continue
          }

          if (timeRangeStartMs !== null) {
            const gameCreation = toGameCreationTimestamp(g)

            if (gameCreation < timeRangeStartMs) {
              hasTimeOutOfRangeGameInChunk = true
              continue
            }

            hasTimeInRangeGameInChunk = true
          }

          let participants: ReturnType<typeof toParticipants> | null = null
          let selfParticipant: ReturnType<typeof toParticipants>[number] | undefined = undefined

          if (needsParticipantFilters) {
            participants = toParticipants(g, toBasicInfo(g))
            selfParticipant = participants.find((p) => p.puuid === puuid.value)
          }

          if (
            (shouldFilterByChampion || shouldFilterByWinLoss || shouldFilterByPosition) &&
            !selfParticipant
          ) {
            continue
          }

          if (shouldFilterByChampion && selfParticipant) {
            if (!selectedChampionSet.has(selfParticipant.championId)) {
              continue
            }
          }

          if (shouldFilterByPosition && selfParticipant) {
            if (!selfParticipant.position || !selectedPositionSet.has(selfParticipant.position)) {
              continue
            }
          }

          if (shouldFilterByWinLoss && selfParticipant && selfParticipant.winResult !== currentWinLoss) {
            continue
          }

          if (shouldFilterBySummoners && participants) {
            const participantPuuidSet = new Set<string>(participants.map((p) => p.puuid))
            const containsAllSelectedSummoners = [...selectedSummonerSet].every((targetPuuid) =>
              participantPuuidSet.has(targetPuuid)
            )

            if (!containsAllSelectedSummoners) {
              continue
            }
          }

          if (!isTimeRangeMode && visibleSkipped < visibleStartIndex) {
            visibleSkipped++
            continue
          }

          games.push(g)
          collectedInChunk.push(g)

          if (!isTimeRangeMode && games.length >= visibleCount) {
            break
          }
        }

        if (collectedInChunk.length > 0) {
          onChunkCollected?.(collectedInChunk)
        }

        rawCursor += chunk.length
        guard++

        if (
          timeRangeStartMs !== null &&
          !hasTimeInRangeGameInChunk &&
          hasTimeOutOfRangeGameInChunk
        ) {
          break
        }

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
        const { data } = await lcuLoadDetailedGameQueue.add(() =>
          lc.api.matchHistory.getGame(g.gameId)
        )
        return { source: 'lcu', data: data, gameId: g.gameId }
      } catch (error) {
        return { source: 'lcu', data: g, gameId: g.gameId }
      }
    }

    try {
      pagedMatchHistory.value = createEmptyPagedMatchHistory()

      if (preferredSource.value === 'sgp' || isCrossRegion.value) {
        if (!sgps.isTokenReady) {
          return
        }

        if (!sgps.leagueServers.servers[sgpServerId.value]?.matchHistory) {
          return
        }

        const fetchSgpChunk = async (startIndex: number, count: number) => {
          const requestParams = { ...queryParams } as MatchHistoryQueryParams
          delete (requestParams as MatchHistoryQueryState).timeRange
          const { data } = await sgp.api.matchHistoryQuery.getMatchHistorySummaryByPlayerPuuid(
            puuid.value,
            {
              ...requestParams,
              startIndex,
              count,
              __sgpServerId: sgpServerId.value
            }
          )

          return data.games
            .filter((g) => g.json)
            .map(
              (g) =>
                markRaw({ source: 'sgp', gameId: g.json.gameId, data: g }) as LcuOrSgpGameSummary
            )
        }

        const shouldCollectGames =
          hideByVisibilityOptions ||
          shouldFilterByTimeRange ||
          shouldFilterByChampion ||
          shouldFilterByPosition ||
          shouldFilterByWinLoss ||
          shouldFilterBySummoners
        const games = shouldCollectGames
          ? await collectVisibleGames(fetchSgpChunk, appendGamesToCurrentList)
          : await fetchSgpChunk(visibleStartIndex, visibleCount)

        if (!shouldCollectGames) {
          appendGamesToCurrentList(games)
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
            .map(
              (g) => markRaw({ source: 'lcu', data: g, gameId: g.gameId }) as LcuOrSgpGameSummary
            )
        }

        const shouldCollectGames =
          hideByVisibilityOptions ||
          shouldFilterByTimeRange ||
          shouldFilterByChampion ||
          shouldFilterByPosition ||
          shouldFilterByWinLoss ||
          shouldFilterBySummoners
        const selectedGames = shouldCollectGames
          ? await collectVisibleGames(fetchLcuSummaryChunk)
          : await fetchLcuSummaryChunk(visibleStartIndex, visibleCount)

        await appendLcuCompletedGames(selectedGames)
      }

      if (!isCrossRegion.value && pagedMatchHistory.value.games.length > 0) {
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

      const nextLoadParams = pendingLoadParams.value
      if (nextLoadParams) {
        pendingLoadParams.value = null
        void loadMatchHistory(nextLoadParams)
      }
    }
  }

  const loadDetails = async (gameId: number) => {
    if (!pagedMatchHistory.value || pagedMatchHistory.value.detailsLoading[gameId]) return

    pagedMatchHistory.value.detailsLoading[gameId] = true

    try {
      if (preferredSource.value === 'sgp' || isCrossRegion.value) {
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

  lc.onLcuEventVue<ReplayDownloadProgress>('/lol-replays/v1/metadata/:gameId', (data) => {
    if (data.eventType === 'Update' && pagedMatchHistory.value) {
      pagedMatchHistory.value.replayMetadata[data.data.gameId] = markRaw(data.data)
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

      loadMatchHistory(getDefaultQueryParams())
    },
    { immediate: true }
  )

  watch(
    () =>
      [
        filterMode.value,
        filterMode.value === 'simple' ? winLoss.value : 'all',
        filterMode.value === 'simple' ? showPractice.value : true,
        filterMode.value === 'simple' ? showIrregularGames.value : true,
        filterMode.value === 'simple'
          ? normalizeChampionFilter(selectedChampions.value).join(',')
          : '',
        filterMode.value === 'simple'
          ? normalizePositionFilter(selectedPositions.value).join(',')
          : '',
        filterMode.value === 'simple'
          ? normalizeSummonerFilter(selectedSummoners.value).join(',')
          : ''
      ].join('|'),
    (current, previous) => {
      if (current === previous) {
        return
      }

      const baseQueryParams = pagedMatchHistory.value?.queryParams ?? getDefaultQueryParams()
      loadMatchHistory({
        ...baseQueryParams,
        startIndex: 0
      })
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
