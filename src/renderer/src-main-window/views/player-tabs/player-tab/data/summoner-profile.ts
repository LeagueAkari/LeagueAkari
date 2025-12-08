import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SummonerProfile } from '@shared/types/league-client/summoner'
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

export type SummonerProfileContext = {
  profile: Readonly<Ref<SummonerProfile | null>>
  isLoading: Readonly<Ref<boolean>>
  loadSummonerProfile: () => Promise<void>
}

export const SummonerProfileContextKey: InjectionKey<SummonerProfileContext> = Symbol(
  'PlayerTabSummonerProfileContext'
)

/**
 * 加载 summoner profile 信息
 *
 * 可使用 sgp 数据源，或在跨区时强制使用 sgp 数据源
 */
export function provideSummonerProfile(props: {
  puuid: MaybeRefOrGetter<string>
  isCrossRegion: MaybeRefOrGetter<boolean>
}) {
  const puuid = toRef(props.puuid)
  const isCrossRegion = toRef(props.isCrossRegion)

  const componentName = useComponentName()

  const lc = useInstance(LeagueClientRenderer)
  const log = useInstance(LoggerRenderer)

  const lcs = useLeagueClientStore()

  const isLoading = ref(false)
  const profile = shallowRef<SummonerProfile | null>(null)

  const loadSummonerProfile = async () => {
    if (isLoading.value || isCrossRegion.value) return

    isLoading.value = true

    try {
      const { data } = await lc.api.summoner.getSummonerProfile(puuid.value)
      profile.value = data
    } catch (error) {
      log.error(componentName, error)
    } finally {
      isLoading.value = false
    }
  }

  // 主要监听器：参数变化时加载
  watch(
    [isCrossRegion, puuid],
    ([isCrossRegion]) => {
      if (isCrossRegion) {
        profile.value = null
        return
      }

      loadSummonerProfile()
    },
    { immediate: true }
  )

  // 当自己的召唤师 profile 信息更新的时候，立即更新相关页面
  watch(
    () => lcs.summoner.profile,
    (p) => {
      if (p && puuid.value === lcs.summoner.me?.puuid) {
        profile.value = p
      }
    }
  )

  provide(SummonerProfileContextKey, {
    profile,
    isLoading,
    loadSummonerProfile
  })

  return { profile, isLoading, loadSummonerProfile }
}

export function useSummonerProfile() {
  const context = inject(SummonerProfileContextKey)

  if (!context) {
    throw new Error('useSummonerProfile must be used within a PlayerTab')
  }

  return context
}
