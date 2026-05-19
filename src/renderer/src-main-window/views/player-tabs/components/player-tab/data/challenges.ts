import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { AllPlayerData } from '@shared/types/sgp/challenges-client'
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

export type ChallengesPlayerDataContext = {
  challengesPlayerData: Ref<AllPlayerData | null>
  isLoading: Ref<boolean>
  loadChallengesPlayerData: () => Promise<void>
}

export const ChallengesPlayerDataContextKey: InjectionKey<ChallengesPlayerDataContext> = Symbol(
  'PlayerTabChallengesPlayerDataContext'
)

/**
 * 加载挑战玩家数据
 *
 * 此特性仅支持 SGP 数据源
 */
export function provideChallengesPlayerData(props: {
  puuid: MaybeRefOrGetter<string>
  sgpServerId: MaybeRefOrGetter<string>
}) {
  const puuid = toRef(props.puuid)
  const sgpServerId = toRef(props.sgpServerId)

  const componentName = useComponentName()

  const sgp = useInstance(SgpRenderer)
  const log = useInstance(LoggerRenderer)

  const isLoading = ref(false)
  const challengesPlayerData = shallowRef<AllPlayerData | null>(null)

  const loadChallengesPlayerData = async () => {
    if (isLoading.value) return

    isLoading.value = true

    try {
      const { data } = await sgp.api.challengesClient.getAllPlayerData(puuid.value, [], {
        __sgpServerId: sgpServerId.value
      })
      challengesPlayerData.value = data
    } catch (error: any) {
      log.error(componentName, error)
    } finally {
      isLoading.value = false
    }
  }

  watch(
    [sgpServerId, puuid],
    ([_sgpServerId, _puuid]) => {
      loadChallengesPlayerData()
    },
    { immediate: true }
  )

  provide(ChallengesPlayerDataContextKey, {
    challengesPlayerData,
    isLoading,
    loadChallengesPlayerData
  })

  return { challengesPlayerData, isLoading, loadChallengesPlayerData }
}

export function useChallengesPlayerData() {
  const context = inject(ChallengesPlayerDataContextKey)

  if (!context) {
    throw new Error('useChallengesPlayerData must be used within a player tab component')
  }

  return context
}
