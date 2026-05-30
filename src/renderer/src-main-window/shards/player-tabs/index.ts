import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { EMPTY_PUUID } from '@shared/constants/common'
import { useRouter } from 'vue-router'

import {
  PLAYER_TABS_RENDERER_NAMESPACE,
  SEARCH_HISTORY_KEY,
  SEARCH_HISTORY_MAX_LENGTH,
  type SearchHistoryItem,
  type SearchResult,
  type InitParams,
  type CreateTabOptions
} from './context'
import { usePageSizeOptions } from './page-size-options'
import { watchPlayerTabs } from './player-tabs-watcher'
import { PlayerTabsSearchHistoryService } from './search-history-service'
import { syncPlayerTabsSettings } from './settings-sync'
import { usePlayerTabsStore } from './store'

export {
  usePageSizeOptions,
  type SearchHistoryItem,
  type SearchResult,
  type InitParams,
  type CreateTabOptions
}

/**
 * 仅适用于主窗口战绩页面的渲染端模块
 */
@Shard(PlayerTabsRenderer.id)
export class PlayerTabsRenderer implements IAkariShardInitDispose {
  static id = PLAYER_TABS_RENDERER_NAMESPACE

  static SEARCH_HISTORY_KEY = SEARCH_HISTORY_KEY
  static SEARCH_HISTORY_MAX_LENGTH = SEARCH_HISTORY_MAX_LENGTH

  private readonly _searchHistoryService: PlayerTabsSearchHistoryService

  constructor(
    @Dep(SettingUtilsRenderer) private readonly _settingUtils: SettingUtilsRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer
  ) {
    this._searchHistoryService = new PlayerTabsSearchHistoryService(this._settingUtils)
  }

  async onInit() {
    await syncPlayerTabsSettings(this._settingUtils)
    this._setupInAppScope.addSetupFn(() => {
      watchPlayerTabs(this)
    })
  }

  async onDispose() {}

  /**
   * 获取搜索历史, 有数量限制
   */
  getSearchHistory() {
    return this._searchHistoryService.getSearchHistory()
  }

  saveSearchHistory(item: SearchHistoryItem) {
    return this._searchHistoryService.saveSearchHistory(item)
  }

  deleteSearchHistory(puuid: string) {
    return this._searchHistoryService.deleteSearchHistory(puuid)
  }

  pinSearchHistory(puuid: string) {
    return this._searchHistoryService.pinSearchHistory(puuid)
  }

  // 如果直接引用 router, 在热更新的时候会失效
  useNavigateToTab() {
    const router = useRouter()
    const sgpStore = useSgpStore()

    const navigateToTab = async (unionId: string, initParams: InitParams = {}) => {
      const { sgpServerId, puuid } = this.parseUnionId(unionId)

      if (!puuid || puuid === EMPTY_PUUID) {
        return
      }

      return router.replace({
        name: 'player-tabs',
        params: { puuid, sgpServerId },
        query: { ...initParams }
      })
    }

    const navigateToTabByPuuidAndSgpServerId = async (
      puuid: string,
      sgpServerId: string,
      initParams: InitParams = {}
    ) => {
      if (!puuid || puuid === EMPTY_PUUID) {
        return
      }

      return router.replace({
        name: 'player-tabs',
        params: { puuid, sgpServerId },
        query: { ...initParams }
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
        params: { puuid, sgpServerId: sgpStore.availability.sgpServerId }
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
  createTab(puuid: string, sgpServerId: string, options: CreateTabOptions = {}) {
    const playerTabsStore = usePlayerTabsStore()

    if (playerTabsStore.getTab(this.toUnionId(sgpServerId, puuid))) {
      return
    }

    playerTabsStore.createTab(
      {
        id: this.toUnionId(sgpServerId, puuid),
        puuid,
        sgpServerId,
        isLoading: false,
        summoner: null,
        summonerProfile: null,
        spectatorData: null,
        refresh: null,
        initParams: options.initParams || {}
      },
      options
    )
  }

  /**
   * 如果不存在页面，则创建一个页面并将其设置为当前页面；如果存在页面，则只设置为当前页面
   */
  createTabAndSetCurrent(puuid: string, sgpServerId: string, initParams: InitParams = {}) {
    const playerTabsStore = usePlayerTabsStore()
    const tab = playerTabsStore.getTab(this.toUnionId(sgpServerId, puuid))

    if (tab) {
      playerTabsStore.setCurrentTab(tab.id)
      playerTabsStore.updateTabData(tab.id, { initParams })
    } else {
      this.createTab(puuid, sgpServerId, { initParams, setCurrent: true })
    }
  }
}
