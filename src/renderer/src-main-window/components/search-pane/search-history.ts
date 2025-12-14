import { useInstance } from '@renderer-shared/shards'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { computed, readonly, shallowRef } from 'vue'

import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'

export interface SearchHistoryItem {
  // 目标的 puuid, 当作主键
  puuid: string

  // 目标所属的服务器
  sgpServerId: string

  // 不是必要项, 但用于展示很方便
  summoner: {
    profileIconId?: number
    gameName: string
    tagLine: string
  }

  isPinned?: boolean
}

export interface SaveSearchHistoryResult {
  puuid: string
  sgpServerId: string
  profileIconId?: number
  gameName: string
  tagLine: string
}

export interface SearchResult {
  puuid: string
  gameName: string
  tagLine: string
  profileIconId: number
  sgpServerId: string
  privacy: string
  summonerLevel: number
}

export function useSearchPaneSearchHistory() {
  const pt = useInstance(PlayerTabsRenderer)
  const sgps = useSgpStore()

  const searchHistory = shallowRef<SearchHistoryItem[]>([])

  const filteredSearchHistory = computed(() => {
    if (sgps.availability.region === 'TENCENT') {
      return searchHistory.value.filter((item) => {
        return sgps.leagueServers.tencentServerMatchHistoryInteroperability.includes(
          item.sgpServerId
        )
      })
    }

    return searchHistory.value.filter((item) => item.sgpServerId === sgps.availability.sgpServerId)
  })

  const pinnedSearchHistory = computed(() => {
    return filteredSearchHistory.value.filter((item) => item.isPinned)
  })

  const unpinnedSearchHistory = computed(() => {
    return filteredSearchHistory.value.filter((item) => !item.isPinned)
  })

  const isNeedToShowSgpServer = computed(() => {
    const count: Record<string, number> = {}
    for (const h of filteredSearchHistory.value) {
      if (count[h.sgpServerId]) {
        count[h.sgpServerId]++
      } else {
        count[h.sgpServerId] = 1
      }
    }

    return Object.keys(count).length > 1 || !count[sgps.availability.sgpServerId]
  })

  const handleSaveSearchHistory = async (result: SaveSearchHistoryResult) => {
    await pt.saveSearchHistory({
      puuid: result.puuid,
      sgpServerId: result.sgpServerId,
      summoner: { gameName: result.gameName, tagLine: result.tagLine },
      isPinned: false
    })
    searchHistory.value = await pt.getSearchHistory()
  }

  const handleDeleteSearchHistory = async (puuid: string) => {
    await pt.deleteSearchHistory(puuid)
    searchHistory.value = await pt.getSearchHistory()
  }

  const handlePinSearchHistory = async (puuid: string) => {
    await pt.pinSearchHistory(puuid)
    searchHistory.value = await pt.getSearchHistory()
  }

  const updateSearchHistory = async () => {
    searchHistory.value = await pt.getSearchHistory()
  }

  return {
    searchHistory: readonly(searchHistory),
    filteredSearchHistory,
    pinnedSearchHistory,
    unpinnedSearchHistory,
    isNeedToShowSgpServer,
    handleSaveSearchHistory,
    handleDeleteSearchHistory,
    handlePinSearchHistory,
    updateSearchHistory
  }
}
