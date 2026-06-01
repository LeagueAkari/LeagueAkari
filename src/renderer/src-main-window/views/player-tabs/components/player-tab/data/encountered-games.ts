import { useComponentName } from '@renderer-shared/composables/useComponentName'
import type { SgpApiStatus } from '@renderer-shared/composables/useSgpApiStatus'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SavedPlayerRenderer } from '@renderer-shared/shards/saved-player'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { LcuGameSummary, LcuOrSgpGameSummary, SgpGameSummary } from '@shared/data-adapter/wrapper'
import { EncounteredGame } from '@shared/types/shards/saved-player'
import {
  InjectionKey,
  Ref,
  computed,
  inject,
  markRaw,
  provide,
  reactive,
  ref,
  shallowRef,
  toRef,
  watch
} from 'vue'
import { MaybeRefOrGetter } from 'vue'

import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import { ENCOUNTERED_GAMES_PAGE_SIZE } from '../constants'
import { type PlayerTabDataSourceDecision, toLoadStatus } from './source-selection'

export type EncounteredGameContext = {
  pagedGames: Ref<PagedEncounteredGames | null>
  gameMap: Readonly<Record<number, LcuOrSgpGameSummary>>
  isLoading: Ref<boolean>
  loadGames: (page?: number) => Promise<void>
  deleteGame: (recordId: number) => Promise<void>
}

export const EncounteredGameContextKey: InjectionKey<EncounteredGameContext> = Symbol(
  'PlayerTabEncounteredGameContext'
)

export interface PagedEncounteredGames {
  data: EncounteredGame[]
  page: number
  pageSize: number
  total: number
}

/**
 * 加載 encountered games
 *
 * 此特性只会在非自己 tab 且同区的环境下生效
 */
export function provideEncounteredGames(props: {
  puuid: MaybeRefOrGetter<string>
  preferredSource: MaybeRefOrGetter<'lcu' | 'sgp'>
  sgpServerId: MaybeRefOrGetter<string>
  sgpApiStatus: MaybeRefOrGetter<SgpApiStatus>
  isSelfTab: MaybeRefOrGetter<boolean>
  isCrossRegion: MaybeRefOrGetter<boolean>
}) {
  const puuid = toRef(props.puuid)
  const preferredSource = toRef(props.preferredSource)
  const sgpServerId = toRef(props.sgpServerId)
  const sgpApiStatus = toRef(props.sgpApiStatus)
  const isSelfTab = toRef(props.isSelfTab)
  const isCrossRegion = toRef(props.isCrossRegion)

  const lcs = useLeagueClientStore()
  const pts = usePlayerTabsStore()

  const lc = useInstance(LeagueClientRenderer)
  const sgp = useInstance(SgpRenderer)
  const log = useInstance(LoggerRenderer)
  const sp = useInstance(SavedPlayerRenderer)

  const componentName = useComponentName()

  const isLoading = ref(false)
  const pagedGames = shallowRef<PagedEncounteredGames | null>(null)
  const gameMap = reactive<Record<number, LcuOrSgpGameSummary>>({})

  const dataSourceStatus = computed<PlayerTabDataSourceDecision>(() =>
    toLoadStatus({
      preferredSource: preferredSource.value,
      isCrossRegion: isCrossRegion.value,
      sgpApiStatus: sgpApiStatus.value
    })
  )

  const logDataSourceStatus = (status: PlayerTabDataSourceDecision) => {
    if (status.type === 'unavailable') {
      log.warn(
        componentName,
        `Cannot load encountered game summaries: SGP API is unavailable for ${sgpServerId.value}`
      )
    } else if (status.type === 'wait') {
      log.info(
        componentName,
        `Waiting for SGP API token readiness before loading encountered game summaries from ${sgpServerId.value}`
      )
    } else if (status.fallbackReason === 'sgp-api-unavailable') {
      log.warn(
        componentName,
        `Falling back to LCU encountered game summaries: SGP API is unavailable for ${sgpServerId.value}`
      )
    }
  }

  const loadPageGames = async (gameIds: number[]) => {
    const status = dataSourceStatus.value
    logDataSourceStatus(status)

    if (status.type !== 'load') {
      return
    }

    const task = async (gameId: number) => {
      try {
        if (status.source === 'sgp') {
          // use SGP API
          const cached = pts.gameSummaryLruMap.get(`sgp:${gameId}`) as SgpGameSummary | undefined

          if (cached) {
            gameMap[cached.gameId] = markRaw(cached)
            return
          }

          const { data } = await sgp.api.matchHistoryQuery.getGameSummaryByGameId(gameId, {
            __sgpServerId: sgpServerId.value
          })

          gameMap[gameId] = markRaw({
            source: 'sgp',
            gameId: data.json.gameId,
            data: data
          })

          pts.gameSummaryLruMap.set(
            `sgp:${gameId}`,
            markRaw({ source: 'sgp', gameId: data.json.gameId, data })
          )
        } else {
          // use LCU API
          const cached = pts.gameSummaryLruMap.get(`lcu:${gameId}`) as LcuGameSummary | undefined

          if (cached) {
            gameMap[cached.gameId] = markRaw(cached)
            return
          }

          const { data } = await lc.api.matchHistory.getGame(gameId)
          gameMap[gameId] = markRaw({ source: 'lcu', gameId: data.gameId, data: data })

          pts.gameSummaryLruMap.set(
            `lcu:${gameId}`,
            markRaw({ source: 'lcu', gameId: data.gameId, data: data })
          )
        }
      } catch (error) {
        log.error(componentName, error)
      }
    }

    await Promise.all(gameIds.map((gameId) => task(gameId)))
  }

  const loadGames = async (page = 1) => {
    if (isLoading.value || !lcs.summoner.me || isCrossRegion.value) {
      return
    }

    isLoading.value = true

    try {
      const data = await sp.queryEncounteredGames({
        puuid: puuid.value,
        selfPuuid: lcs.summoner.me.puuid,
        pageSize: ENCOUNTERED_GAMES_PAGE_SIZE,
        page
      })

      pagedGames.value = data

      loadPageGames(data.data.map((g) => g.gameId))
    } finally {
      isLoading.value = false
    }
  }

  const deleteGame = async (recordId: number) => {
    await sp.deleteEncounteredGame(recordId)
    await loadGames(pagedGames.value?.page ?? 1)
  }

  // 主要监听器
  watch(
    [isSelfTab, dataSourceStatus, puuid, isCrossRegion],
    ([isSelfTab, status, _puuid, isCrossRegion]) => {
      if (isCrossRegion) {
        pagedGames.value = null
        return
      }

      if (status.type !== 'load') {
        logDataSourceStatus(status)
      }

      if (!isSelfTab) {
        loadGames()
      }
    },
    { immediate: true }
  )

  provide(EncounteredGameContextKey, {
    pagedGames,
    gameMap,
    isLoading,
    loadGames,
    deleteGame
  })

  return { pagedGames, gameMap, isLoading, loadGames, deleteGame }
}

export function useEncounteredGames() {
  const context = inject(EncounteredGameContextKey)

  if (!context) {
    throw new Error('useEncounteredGames must be used within a player tab component')
  }

  return context
}
