import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { PlayerChampionMastery } from '@shared/types/league-client/champion-mastery'
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

import { CHAMPION_MASTERY_TOP_COUNT } from '../constants'

export type ChampionMasteryContext = {
  championMastery: Ref<PlayerChampionMastery | null>
  isLoading: Ref<boolean>
  loadChampionMastery: () => Promise<void>
}

export const ChampionMasteryContextKey: InjectionKey<ChampionMasteryContext> = Symbol(
  'PlayerTabChampionMasteryContext'
)

export function provideChampionMastery(props: {
  puuid: MaybeRefOrGetter<string>
  isCrossRegion: MaybeRefOrGetter<boolean>
}) {
  const puuid = toRef(props.puuid)
  const isCrossRegion = toRef(props.isCrossRegion)

  const componentName = useComponentName()
  const lc = useInstance(LeagueClientRenderer)
  const log = useInstance(LoggerRenderer)

  const championMastery = shallowRef<PlayerChampionMastery | null>(null)
  const isLoading = ref(false)

  const loadChampionMastery = async () => {
    if (isLoading.value || isCrossRegion.value) {
      return
    }

    isLoading.value = true

    try {
      const targetPuuid = puuid.value
      const { data } = await lc.api.championMastery.getPlayerChampionMasteryTopN(
        targetPuuid,
        CHAMPION_MASTERY_TOP_COUNT
      )

      if (isCrossRegion.value || puuid.value !== targetPuuid) {
        return
      }

      championMastery.value = data
    } catch (error) {
      championMastery.value = null
      log.error(componentName, error)
    } finally {
      isLoading.value = false
    }
  }

  watch(
    [puuid, isCrossRegion],
    ([, isCrossRegion]) => {
      if (isCrossRegion) {
        championMastery.value = null
        return
      }

      void loadChampionMastery()
    },
    { immediate: true }
  )

  provide(ChampionMasteryContextKey, {
    championMastery,
    isLoading,
    loadChampionMastery
  })

  return { championMastery, isLoading, loadChampionMastery }
}

export function useChampionMastery() {
  const context = inject(ChampionMasteryContextKey)

  if (!context) {
    throw new Error('useChampionMastery must be used within a player tab component')
  }

  return context
}
