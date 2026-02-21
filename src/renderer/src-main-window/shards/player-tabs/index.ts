import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { EMPTY_PUUID } from '@shared/constants/common'
import { useTranslation } from 'i18next-vue'
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import { usePlayerTabsStore } from './store'

export interface SearchHistoryItem {
  puuid: string
  sgpServerId: string
  summoner: {
    profileIconId?: number
    gameName: string
    tagLine: string
  }

  isPinned?: boolean
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

/**
 * 仅适用于主窗口战绩页面的渲染端模块
 */
@Shard(PlayerTabsRenderer.id)
export class PlayerTabsRenderer implements IAkariShardInitDispose {
  static id = 'player-tabs-renderer'

  static SEARCH_HISTORY_KEY = 'searchHistory'
  static SEARCH_HISTORY_MAX_LENGTH = 20

  constructor(
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer
  ) {}

  async onInit() {
    await this._handleSettings()
    this._setupInAppScope.addSetupFn(() => {
      this._handlePlayerTabs()
    })
  }

  async onDispose() {}

  private _handlePlayerTabs() {
    const pts = usePlayerTabsStore()
    const lcs = useLeagueClientStore()
    const sgps = useSgpStore()

    // 在玩家登录时立即创建一个页面
    watch(
      [() => lcs.summoner.me, () => sgps.availability.sgpServerId],
      ([me, sgpServerId]) => {
        if (me && sgpServerId) {
          this.createTab(me.puuid, sgpServerId)
        }
      },
      { immediate: true }
    )

    // 在断开连接后删除所有页面
    watch(
      () => lcs.connectionState,
      (s) => {
        if (s === 'disconnected') {
          pts.closeAllTabs()
        }
      }
    )
  }

  /**
   * 获取搜索历史, 有数量限制
   */
  async getSearchHistory(): Promise<SearchHistoryItem[]> {
    return this._setting.get(PlayerTabsRenderer.id, PlayerTabsRenderer.SEARCH_HISTORY_KEY, [])
  }

  /**
   * 使用全量替换的方式更新搜索历史。
   * 置顶区的条目始终不会变动相对位置，同时保证在非置顶项目的前面。
   * 非置顶项目在保存时会移动到非置顶区的最前面。
   * 超过上限时会删除最后一个非置顶项目，若无非置顶项目无法添加。
   * @param item
   */
  async saveSearchHistory(item: SearchHistoryItem) {
    const list = await this.getSearchHistory()
    const max = PlayerTabsRenderer.SEARCH_HISTORY_MAX_LENGTH

    const oldIdx = list.findIndex((i) => i.puuid === item.puuid)
    const existed = oldIdx !== -1
    const wasPinned = existed ? list[oldIdx].isPinned : false

    const finalPinned = item.isPinned !== undefined ? item.isPinned : existed ? wasPinned : false

    const base = existed ? list[oldIdx] : ({} as Partial<SearchHistoryItem>)
    const newItem: SearchHistoryItem = {
      ...base,
      ...item,
      isPinned: finalPinned
    } as SearchHistoryItem

    if (existed && wasPinned && finalPinned) {
      list[oldIdx] = newItem
      return this._setting.set(PlayerTabsRenderer.id, PlayerTabsRenderer.SEARCH_HISTORY_KEY, list)
    }

    if (existed) list.splice(oldIdx, 1)

    const firstUnpinned = list.findIndex((i) => !i.isPinned)
    const pos = firstUnpinned === -1 ? list.length : firstUnpinned
    list.splice(pos, 0, newItem)

    if (list.length > max) {
      const lastUnpinnedIdx = [...list].reverse().findIndex((i) => !i.isPinned)

      if (lastUnpinnedIdx !== -1) {
        list.splice(list.length - 1 - lastUnpinnedIdx, 1)
      } else if (!existed) {
        list.pop()
      }
    }

    return this._setting.set(PlayerTabsRenderer.id, PlayerTabsRenderer.SEARCH_HISTORY_KEY, list)
  }

  async deleteSearchHistory(puuid: string) {
    const items = await this.getSearchHistory()
    const index = items.findIndex((i) => i.puuid === puuid)

    if (index !== -1) {
      items.splice(index, 1)
    }

    return this._setting.set(PlayerTabsRenderer.id, PlayerTabsRenderer.SEARCH_HISTORY_KEY, items)
  }

  async pinSearchHistory(puuid: string) {
    const items = await this.getSearchHistory()
    const index = items.findIndex((i) => i.puuid === puuid)

    if (index !== -1) {
      items[index].isPinned = !items[index].isPinned
    }

    items.sort((a, b) => {
      if (a.isPinned && !b.isPinned) {
        return -1
      }
      if (!a.isPinned && b.isPinned) {
        return 1
      }
      return 0
    })

    return this._setting.set(PlayerTabsRenderer.id, PlayerTabsRenderer.SEARCH_HISTORY_KEY, items)
  }

  // 如果直接引用 router, 在热更新的时候会失效
  useNavigateToTab() {
    const router = useRouter()
    const sgps = useSgpStore()

    const navigateToTab = async (unionId: string) => {
      const { sgpServerId, puuid } = this.parseUnionId(unionId)

      if (!puuid || puuid === EMPTY_PUUID) {
        return
      }

      return router.replace({
        name: 'player-tabs',
        params: { puuid, sgpServerId }
      })
    }

    const navigateToTabByPuuidAndSgpServerId = async (puuid: string, sgpServerId: string) => {
      if (!puuid || puuid === EMPTY_PUUID) {
        return
      }

      return router.replace({
        name: 'player-tabs',
        params: { puuid, sgpServerId }
      })
    }

    /**
     * 以当前大区为准跳转到指定 puuid 的战绩页面
     */
    const navigateToTabByPuuid = async (puuid: string) => {
      if (!puuid || puuid === EMPTY_PUUID) {
        return
      }

      return router.replace({
        name: 'player-tabs',
        params: { puuid, sgpServerId: sgps.availability.sgpServerId }
      })
    }

    return { navigateToTab, navigateToTabByPuuidAndSgpServerId, navigateToTabByPuuid }
  }

  parseUnionId(unionId: string) {
    const [sgpServerId, puuid] = unionId.split(':')

    return { sgpServerId, puuid }
  }

  toUnionId(sgpServerId: string, puuid: string) {
    return `${sgpServerId}:${puuid}`
  }

  /** 创建一个新的 Tab, 并设置一些初始值 */
  createTab(puuid: string, sgpServerId: string, setCurrent = true) {
    const pts = usePlayerTabsStore()

    if (pts.getTab(this.toUnionId(sgpServerId, puuid))) {
      return
    }

    pts.createTab(
      {
        id: this.toUnionId(sgpServerId, puuid),
        puuid,
        sgpServerId,
        isLoading: false,
        summoner: null,
        summonerProfile: null,
        spectatorData: null,
        refresh: null
      },
      setCurrent
    )
  }

  setCurrentOrCreateTab(puuid: string, sgpServerId: string) {
    const pts = usePlayerTabsStore()
    const tab = pts.getTab(this.toUnionId(sgpServerId, puuid))

    if (tab) {
      pts.setCurrentTab(tab.id)
    } else {
      this.createTab(puuid, sgpServerId)
    }
  }

  private async _handleSettings() {
    const store = usePlayerTabsStore()

    await this._setting.savedPropVue(
      PlayerTabsRenderer.id,
      store.frontendSettings,
      'matchHistoryUseSgpApi'
    )

    await this._setting.savedPropVue(
      PlayerTabsRenderer.id,
      store.frontendSettings,
      'refreshTabsAfterGameEnds'
    )

    await this._setting.savedPropVue(PlayerTabsRenderer.id, store.frontendSettings, 'loadCount')

    await this._setting.savedPropVue(
      PlayerTabsRenderer.id,
      store.frontendSettings,
      'defaultMatchHistoryTag'
    )

    await this._setting.savedPropVue(
      PlayerTabsRenderer.id,
      store.frontendSettings,
      'defaultShowPractice'
    )

    await this._setting.savedPropVue(
      PlayerTabsRenderer.id,
      store.frontendSettings,
      'defaultShowIrregularGames'
    )

    await this._setting.savedPropVue(
      PlayerTabsRenderer.id,
      store.frontendSettings,
      'showJunglePathing'
    )
  }
}

export function usePageSizeOptions() {
  const { t } = useTranslation()

  const pageSizeOptions = computed(() => [
    {
      label: t('PlayerTab.itemPerPage', { count: 10 }),
      value: 10
    },
    {
      label: t('PlayerTab.itemPerPage', { count: 20 }),
      value: 20
    },
    {
      label: t('PlayerTab.itemPerPage', { count: 30 }),
      value: 30
    },
    {
      label: t('PlayerTab.itemPerPage', { count: 40 }),
      value: 40
    },
    {
      label: t('PlayerTab.itemPerPage', { count: 50 }),
      value: 50
    },
    {
      label: t('PlayerTab.itemPerPage', { count: 100 }),
      value: 100
    },
    {
      label: t('PlayerTab.itemPerPage', { count: 200 }),
      value: 200
    }
  ])

  return pageSizeOptions
}
