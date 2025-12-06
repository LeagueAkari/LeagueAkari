import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SavedPlayerRenderer } from '@renderer-shared/shards/saved-player'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { LcuGameSummary, LcuOrSgpGameSummary, SgpGameSummary } from '@shared/data-adapter/wrapper'
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

import { useMatchHistoryTabsStore } from '@main-window/shards/match-history-tabs/store'

import { ENCOUNTERED_GAMES_PAGE_SIZE } from './constants'

export interface EncounteredGame {
  id: number
  gameId: number
  puuid: string
  selfPuuid: string
  region: string
  rsoPlatformId: string
  updateAt: Date
  queueType: string
}

export type EncounteredGameContext = {
  pagedGames: Readonly<Ref<PagedEncounteredGames | null>>
  gameMap: Readonly<Record<number, LcuOrSgpGameSummary>>
  isLoading: Readonly<Ref<boolean>>
  loadGames: (page?: number) => Promise<void>
  deleteGame: (recordId: number) => Promise<void>
}

export const EncounteredGameContextKey: InjectionKey<EncounteredGameContext> = Symbol(
  'MatchHistoryTabEncounteredGameContext'
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
  const mhs = useMatchHistoryTabsStore()

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
          // use SGP API
          const cached = mhs.detailedGameLruMap.get(`sgp:${gameId}`) as SgpGameSummary | undefined

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

          mhs.detailedGameLruMap.set(
            `sgp:${gameId}`,
            markRaw({ source: 'sgp', gameId: data.json.gameId, data })
          )
        } else {
          // use LCU API
          const cached = mhs.detailedGameLruMap.get(`lcu:${gameId}`) as LcuGameSummary | undefined

          if (cached) {
            gameMap[cached.gameId] = markRaw(cached)
            return
          }

          const { data } = await lc.api.matchHistory.getGame(gameId)
          gameMap[gameId] = markRaw({ source: 'lcu', gameId: data.gameId, data: data })

          mhs.detailedGameLruMap.set(
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

  provide(EncounteredGameContextKey, {
    pagedGames,
    gameMap,
    isLoading,
    loadGames,
    deleteGame
  })
}

export function useEncounteredGames() {
  const context = inject(EncounteredGameContextKey)

  if (!context) {
    throw new Error('useEncounteredGames must be used within a player tab component')
  }

  return context
}
