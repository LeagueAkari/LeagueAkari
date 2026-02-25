import { Summoner } from '@shared/data-adapter/summoner'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { SummonerProfile } from '@shared/types/league-client/summoner'
import { SpectatorData } from '@shared/types/sgp/gsm'
import { defineStore } from 'pinia'
import QuickLRU from 'quick-lru'
import { computed, ref, shallowReactive } from 'vue'

export interface TabState {
  id: string

  /** 页面的 puuid */
  puuid: string

  /** 该玩家数据来源自哪个服务器 */
  sgpServerId: string

  // --- 以下数据通过 tab component -> store 同步

  /** 是否位于加载状态，这个状态由 tab 本身控制 */
  isLoading: boolean

  /** 玩家信息 */
  summoner: Summoner | null

  /** 玩家 profile 信息 */
  summonerProfile: SummonerProfile | null

  /** 玩家 spectator 信息 */
  spectatorData: SpectatorData | null

  refresh: (() => void) | null
}

/** 声明到全局状态, 以减少状态管理的复杂度 */
export const usePlayerTabsStore = defineStore('shard:player-tabs-renderer', () => {
  // 这里应该是 frontendSettings，但为了保持兼容性，暂时保留
  const frontendSettings = shallowReactive({
    /**
     *  游戏结束后刷新涉及到的页面卡
     */
    refreshTabsAfterGameEnds: true,

    /**
     * 优先使用 SGP API 查询战绩
     */
    matchHistoryUseSgpApi: true,

    /**
     * 加载战绩数量
     */
    loadCount: 20,

    /**
     * 默认战绩模式筛选 tag
     */
    defaultMatchHistoryTag: '<akari:all>' as string,

    /**
     * 默认战绩时间范围
     */
    defaultMatchHistoryTimeRange: 'all' as 'all' | '24h' | '3d' | '7d' | '30d',

    /**
     * 默认显示训练模式
     */
    defaultShowPractice: false,

    /**
     * 默认显示重开局等
     */
    defaultShowIrregularGames: false,

    /**
     * 战绩页面是否启用打野偏好
     */
    showJunglePathing: true
  })

  const tabs = ref<TabState[]>([])
  const currentTabId = ref<string | null>(null)
  const pendingChampionFilterByTab = ref<Record<string, number>>({})

  const currentTab = computed(() => {
    return tabs.value.find((t) => t.id === currentTabId.value) || null
  })

  const closeTab = (id: string) => {
    // 删除 tab, 并切换到右边的 tab (如果有), 否则切换到左边的 tab
    const index = tabs.value.findIndex((t) => t.id === id)
    if (index === -1) {
      return
    }

    tabs.value = tabs.value.filter((t) => t.id !== id)

    const setCurrentIndex = Math.min(index, tabs.value.length - 1)
    if (setCurrentIndex >= 0) {
      currentTabId.value = tabs.value[setCurrentIndex].id
    } else {
      currentTabId.value = null
    }
  }

  const setCurrentTab = (id: string) => {
    if (tabs.value.some((t) => t.id === id)) {
      currentTabId.value = id
    }
  }

  const createTab = (data: TabState, setCurrent = true) => {
    if (tabs.value.some((t) => t.id === data.id)) {
      return
    }

    if (setCurrent) {
      currentTabId.value = data.id
    }

    tabs.value.push(data)
  }

  const getTab = (id: string) => {
    return tabs.value.find((t) => t.id === id)
  }

  const getTabByPuuid = (puuid: string) => {
    return tabs.value.find((t) => t.puuid === puuid)
  }

  const moveTabBefore = (fromTabId: string, toTabId: string) => {
    if (fromTabId === toTabId) {
      return
    }

    const fromIndex = tabs.value.findIndex((t) => t.id === fromTabId)
    const toIndex = tabs.value.findIndex((t) => t.id === toTabId)

    if (fromIndex === -1 || toIndex === -1) {
      return
    }

    const updatedTabs = [...tabs.value]
    const [tab] = updatedTabs.splice(fromIndex, 1) // 移除 fromIndex 的元素

    updatedTabs.splice(toIndex, 0, tab)

    tabs.value = updatedTabs
  }

  const closeAllTabs = () => {
    tabs.value = []
    currentTabId.value = null
  }

  const closeOtherTabs = (centerId: string) => {
    tabs.value = tabs.value.filter((t) => t.id === centerId)
    currentTabId.value = centerId
  }

  const closeTabsToTheRight = (centerId: string) => {
    const index = tabs.value.findIndex((t) => t.id === centerId)
    if (index === -1) {
      return
    }

    tabs.value = tabs.value.slice(0, index + 1)

    if (!tabs.value.some((t) => t.id === currentTabId.value)) {
      currentTabId.value = tabs.value[tabs.value.length - 1].id
    }
  }

  const canCloseTabsToTheRight = (centerId: string) => {
    const index = tabs.value.findIndex((t) => t.id === centerId)
    return index !== -1 && index < tabs.value.length - 1
  }

  const canCloseOtherTabs = (centerId: string) => {
    return tabs.value.some((t) => t.id !== centerId)
  }

  /** 避免太多的加载, 在所有的页面中可以共享 */
  const detailedGameLruMap = new QuickLRU<string, LcuOrSgpGameSummary>({ maxSize: 128 })

  const updateTabData = (
    id: string,
    data: Partial<Exclude<TabState, 'id' | 'puuid' | 'sgpServerId'>>
  ) => {
    const tab = tabs.value.find((t) => t.id === id)
    if (tab) {
      Object.assign(tab, data)
    }
  }

  const setPendingChampionFilter = (tabId: string, championId: number) => {
    if (!tabId || !Number.isInteger(championId) || championId <= 0) {
      return
    }

    pendingChampionFilterByTab.value = {
      ...pendingChampionFilterByTab.value,
      [tabId]: championId
    }
  }

  const consumePendingChampionFilter = (tabId: string) => {
    const championId = pendingChampionFilterByTab.value[tabId]
    if (championId === undefined) {
      return null
    }

    const next = { ...pendingChampionFilterByTab.value }
    delete next[tabId]
    pendingChampionFilterByTab.value = next

    return championId
  }

  return {
    frontendSettings,

    detailedGameLruMap,
    pendingChampionFilterByTab,

    tabs,
    currentTabId,
    currentTab,

    closeTab,
    setCurrentTab,
    createTab,
    getTab,
    getTabByPuuid,
    closeAllTabs,
    closeOtherTabs,
    closeToTheRight: closeTabsToTheRight,
    canCloseOtherTabs,
    canCloseTabsToTheRight,
    moveTabBefore,
    setPendingChampionFilter,
    consumePendingChampionFilter,

    updateTabData
  }
})
