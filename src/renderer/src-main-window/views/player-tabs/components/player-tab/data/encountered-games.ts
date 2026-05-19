import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SavedPlayerRenderer } from '@renderer-shared/shards/saved-player'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { LcuGameSummary, LcuOrSgpGameSummary, SgpGameSummary } from '@shared/data-adapter/wrapper'
import { EncounteredGame } from '@shared/types/shards/saved-player'
import {
  InjectionKey,
  Ref,
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
  isSelfTab: MaybeRefOrGetter<boolean>
  isCrossRegion: MaybeRefOrGetter<boolean>
}) {
  const puuid = toRef(props.puuid)
  const preferredSource = toRef(props.preferredSource)
  const isSelfTab = toRef(props.isSelfTab)
  const isCrossRegion = toRef(props.isCrossRegion)

  const lcs = useLeagueClientStore()
  const pts = usePlayerTabsStore()
  const sgps = useSgpStore()

  const lc = useInstance(LeagueClientRenderer)
  const sgp = useInstance(SgpRenderer)
  const log = useInstance(LoggerRenderer)
  const sp = useInstance(SavedPlayerRenderer)

  const componentName = useComponentName()

  const isLoading = ref(false)
  const pagedGames = shallowRef<PagedEncounteredGames | null>(null)
  const gameMap = reactive<Record<number, LcuOrSgpGameSummary>>({})

  const loadPageGames = async (gameIds: number[]) => {
    const task = async (gameId: number) => {
      try {
        if (preferredSource.value === 'sgp') {
          // SGP API 需要 token 就绪
          if (!sgps.isTokenReady) {
            return
          }

          // use SGP API
          const cached = pts.gameSummaryLruMap.get(`sgp:${gameId}`) as SgpGameSummary | undefined

          if (cached) {
            gameMap[cached.gameId] = markRaw(cached)
            return
          }

          const { data } = await sgp.api.matchHistoryQuery.getGameSummaryByGameId(gameId)

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
    [isSelfTab, preferredSource, puuid, isCrossRegion],
    ([isSelfTab, _preferredSource, _puuid, isCrossRegion]) => {
      if (isCrossRegion) {
        pagedGames.value = null
        return
      }

      if (!isSelfTab) {
        loadGames()
      }
    },
    { immediate: true }
  )

  // 监听 SGP token 就绪状态（仅在使用 SGP 加载游戏详情时需要）
  watch(
    () => sgps.isTokenReady,
    (ready) => {
      // 当 token 就绪且使用 SGP 源时，重新加载游戏详情
      if (ready && preferredSource.value === 'sgp' && pagedGames.value) {
        const gameIds = pagedGames.value.data.map((g) => g.gameId).filter((id) => !gameMap[id])

        if (gameIds.length > 0) {
          loadPageGames(gameIds)
        }
      }
    }
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
