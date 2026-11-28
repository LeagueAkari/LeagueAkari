import { useInstance } from '@renderer-shared/shards'
import { ExtraAssetsRenderer } from '@renderer-shared/shards/extra-assets'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { ChampionSimple } from '@shared/types/league-client/game-data'
import { reactive, ref } from 'vue'

const NAMESPACE = 'aram-tools-rift-week-free'

interface RiftWeekFreeState {
  /** 最近一次从官方数据源解析出的名单，同时充当离线缓存 */
  remoteIds: number[]
  lastSyncedAt: number | null
}

const state = reactive<RiftWeekFreeState>({
  remoteIds: [],
  lastSyncedAt: null
})

const isSyncing = ref(false)

let initPromise: Promise<void> | null = null
let autoSyncStarted = false

/**
 * 召唤师峡谷每周免费英雄名单管理。
 *
 * 与大乱斗周免共用官方「每周免费英雄」数据源（freeHero 字段）；
 * 加载失败时保持上一次缓存，不提供内置兜底名单（峡谷周免每周变动，内置快照很快过期）。
 * 该名单与购物车的「手动勾选」完全独立，勾选英雄不会影响周免标签。
 */
export function useRiftWeekFree() {
  const settingUtils = useInstance(SettingUtilsRenderer)
  const extraAssets = useInstance(ExtraAssetsRenderer)

  if (!initPromise) {
    initPromise = (async () => {
      await settingUtils.savedPropVue(NAMESPACE, state, 'remoteIds', {
        watchOptions: { deep: true }
      })
      await settingUtils.savedPropVue(NAMESPACE, state, 'lastSyncedAt')
    })()
  }

  /** 计算当前生效的峡谷周免 id 集合（官方名单 / 本地缓存） */
  const buildIds = (_champions: ChampionSimple[]): Set<number> => {
    return new Set(state.remoteIds)
  }

  /** 请求主进程拉取官方峡谷每周免费英雄名单 */
  const sync = async (champions: ChampionSimple[]): Promise<boolean> => {
    if (isSyncing.value || !champions.length) {
      return false
    }

    isSyncing.value = true

    try {
      const ids = await extraAssets.refreshRiftFreeChampions()

      if (ids && ids.length) {
        const available = new Set(champions.map((champion) => champion.id))
        const valid = [...new Set(ids)].filter((id) => available.has(id))

        if (valid.length) {
          state.remoteIds = valid
          state.lastSyncedAt = Date.now()
          return true
        }
      }

      return false
    } catch {
      return false
    } finally {
      isSyncing.value = false
    }
  }

  /** 页面加载后自动执行一次同步（每个应用会话仅一次） */
  const ensureLoaded = async (champions: ChampionSimple[]) => {
    if (!champions.length) {
      return
    }

    if (initPromise) {
      await initPromise
    }

    if (autoSyncStarted) {
      return
    }

    autoSyncStarted = true
    await sync(champions)
  }

  return {
    state,
    isSyncing,
    buildIds,
    ensureLoaded,
    sync
  }
}
