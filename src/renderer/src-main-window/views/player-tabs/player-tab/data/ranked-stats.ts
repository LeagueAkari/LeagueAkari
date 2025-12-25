import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { RankedStats } from '@shared/types/league-client/ranked'
import { useTranslation } from 'i18next-vue'
import { useNotification } from 'naive-ui'
import {
  InjectionKey,
  MaybeRefOrGetter,
  Ref,
  inject,
  provide,
  ref,
  shallowRef,
  toRef,
  watch
} from 'vue'

export type RankedStatsContext = {
  rankedStats: Readonly<Ref<RankedStats | null>>
  isLoading: Readonly<Ref<boolean>>
  loadRankedStats: () => Promise<void>
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
}) {
  const puuid = toRef(props.puuid)
  const isCrossRegion = toRef(props.isCrossRegion)

  const componentName = useComponentName()

  const lc = useInstance(LeagueClientRenderer)
  const log = useInstance(LoggerRenderer)

  const isLoading = ref(false)
  const rankedStats = shallowRef<RankedStats | null>(null)

  const { t } = useTranslation()
  const notification = useNotification()

  const loadRankedStats = async () => {
    // 不支持 cross region
    if (isLoading.value || isCrossRegion.value) return

    isLoading.value = true

    try {
      const { data } = await lc.api.ranked.getRankedStats(puuid.value)
      rankedStats.value = data
    } catch (error: any) {
      notification.error({
        title: () => t('PlayerTab.failedToLoadRankedStatsTitle'),
        content: () => t('PlayerTab.failedToLoadRankedStatsContent', { reason: error.message }),
        duration: 4000
      })
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
        return
      }

      loadRankedStats()
    },
    { immediate: true }
  )

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
