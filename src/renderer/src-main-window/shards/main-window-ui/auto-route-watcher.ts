import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'

export function watchAutoRouteWhenGameStarts() {
  const router = useRouter()
  const store = useOngoingGameStore()

  const shouldRoute = computed(() => {
    return store.queryStage.phase !== 'unavailable' && store.queryStage.phase !== 'lobby'
  })

  watch(
    () => shouldRoute.value,
    (value) => {
      if (value && store.settings.autoRouteWhenGameStarts) {
        router.replace({ name: 'ongoing-game' })
      }
    },
    { immediate: true }
  )
}
