import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { RankedStats } from '@shared/types/league-client/ranked'
import { useTranslation } from 'i18next-vue'
import { useNotification } from 'naive-ui'
import {
  InjectionKey,
  MaybeRefOrGetter,
  Ref,
  computed,
  inject,
  onUnmounted,
  provide,
  ref,
  shallowRef,
  toRef,
  watch
} from 'vue'

export type RankedStatsContext = {
  rankedStats: Ref<RankedStats | null>
  isLoading: Ref<boolean>
  loadRankedStats: (options?: { silent?: boolean }) => Promise<void>
}

export const RankedStatsContextKey: InjectionKey<RankedStatsContext> = Symbol(
  'PlayerTabRankedStatsContext'
)

/**
 * 加载排位赛信息
 *
 * 此特性仅支持 lcu 数据源，且不可在跨区查询时生效
 */
export function provideRankedStats(props: {
  puuid: MaybeRefOrGetter<string>
  isCrossRegion: MaybeRefOrGetter<boolean>
  isSelfTab: MaybeRefOrGetter<boolean>
}) {
  const DISPLAY_QUEUE_TYPES = ['RANKED_SOLO_5x5', 'RANKED_FLEX_SR'] as const
  const SUPPORTED_AUTO_REFRESH_QUEUE_IDS = new Set<number>([420, 440])
  const SUPPORTED_AUTO_REFRESH_QUEUE_TYPES = new Set<string>(['RANKED_SOLO_5x5', 'RANKED_FLEX_SR'])

  const puuid = toRef(props.puuid)
  const isCrossRegion = toRef(props.isCrossRegion)
  const isSelfTab = toRef(props.isSelfTab)

  const componentName = useComponentName()

  const lc = useInstance(LeagueClientRenderer)
  const log = useInstance(LoggerRenderer)
  const lcs = useLeagueClientStore()

  const isLoading = ref(false)
  const rankedStats = shallowRef<RankedStats | null>(null)
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  const { t } = useTranslation()
  const notification = useNotification()

  const clearRetryTimer = () => {
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
  }

  const isEndOfGame = computed(
    () => lcs.gameflow.phase === 'EndOfGame' || lcs.gameflow.phase === 'PreEndOfGame'
  )
  const isSupportedAutoRefreshQueue = computed(() => {
    const queue = lcs.gameflow.session?.gameData.queue
    if (!queue) {
      return false
    }

    if (SUPPORTED_AUTO_REFRESH_QUEUE_IDS.has(queue.id)) {
      return true
    }

    return SUPPORTED_AUTO_REFRESH_QUEUE_TYPES.has(queue.type)
  })

  const getLpSnapshot = (stats: RankedStats | null) => {
    if (!stats) {
      return ''
    }

    return DISPLAY_QUEUE_TYPES.map((queueType) => {
      const entry = stats.queueMap[queueType] || stats.queues.find((q) => q.queueType === queueType)

      if (!entry) {
        return `${queueType}:N/A`
      }

      return `${queueType}:${entry.tier}:${entry.division}:${entry.leaguePoints}:${entry.wins}:${entry.losses}:${entry.ratedRating}`
    }).join('|')
  }

  const loadRankedStats = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false

    // 不支持 cross region
    if (isLoading.value || isCrossRegion.value) return

    isLoading.value = true

    try {
      const { data } = await lc.api.ranked.getRankedStats(puuid.value)
      rankedStats.value = data
    } catch (error: any) {
      if (!silent) {
        notification.error({
          title: () => t('PlayerTab.failedToLoadRankedStatsTitle'),
          content: () => t('PlayerTab.failedToLoadRankedStatsContent', { reason: error.message }),
          duration: 4000
        })
      }

      log.error(componentName, error)
    } finally {
      isLoading.value = false
    }
  }

  watch(
    [isCrossRegion, puuid],
    ([isCrossRegion, _puuid]) => {
      if (isCrossRegion) {
        rankedStats.value = null
        clearRetryTimer()
        return
      }

      void loadRankedStats()
    },
    { immediate: true }
  )

  watch(isEndOfGame, (is, prev) => {
    if (!(is && !prev)) {
      return
    }

    if (!isSelfTab.value || isCrossRegion.value || !isSupportedAutoRefreshQueue.value) {
      return
    }

    clearRetryTimer()

    const beforeSnapshot = getLpSnapshot(rankedStats.value)

    void (async () => {
      await loadRankedStats({ silent: true })

      const afterSnapshot = getLpSnapshot(rankedStats.value)

      if (afterSnapshot !== beforeSnapshot) {
        return
      }

      retryTimer = setTimeout(() => {
        retryTimer = null
        void loadRankedStats({ silent: true })
      }, 3000)
    })()
  })

  onUnmounted(() => {
    clearRetryTimer()
  })

  provide(RankedStatsContextKey, {
    rankedStats,
    isLoading,
    loadRankedStats
  })

  return { rankedStats, isLoading, loadRankedStats }
}

export function useRankedStats() {
  const context = inject(RankedStatsContextKey)

  if (!context) {
    throw new Error('useRankedStats must be used within a player tab component')
  }

  return context
}
