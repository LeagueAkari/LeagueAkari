<template>
  <div
    ref="wrapperEl"
    class="relative w-full min-w-175"
    :aria-hidden="hidden || undefined"
    :data-match-card-render-state="renderState"
    :style="wrapperStyle"
  >
    <Transition name="match-history-card-materialize" :css="animateMaterialization">
      <MatchCard
        v-if="renderState === 'materialized'"
        v-model:is-expanded="isExpanded"
        :summary="summary"
        :puuid="puuid"
        :details="details"
        :loading-details="loadingDetails"
        :hide-privacy="hidePrivacy"
        :replay-state="replayState"
        :can-dry-run-ongoing-game="canDryRunOngoingGame"
        @navigate-to-summoner-by-puuid="handleNavigateToSummonerByPuuid"
        @load-details="(gameId) => emit('loadDetails', gameId)"
        @download-replay="(gameId) => emit('downloadReplay', gameId)"
        @watch-replay="(gameId) => emit('watchReplay', gameId)"
        @dry-run-ongoing-game="(draft) => emit('dryRunOngoingGame', draft)"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import MatchCard from '@renderer-shared/components/match-card/MatchCard.vue'
import { MATCH_CARD_COLLAPSED_HEIGHT_PX } from '@renderer-shared/components/match-card/constants'
import type {
  MatchCardEmits,
  MatchCardExpose,
  MatchCardProps
} from '@renderer-shared/components/match-card/types'
import { useTimeoutFn } from '@vueuse/core'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import { MATCH_HISTORY_CARD_RECYCLE_DELAY_MS } from './constants'
import type { MatchHistoryCardOptimizationMode } from './types'
import { useMatchHistoryCardViewport } from './viewport'

type MatchHistoryCardProps = MatchCardProps & {
  hidden?: boolean
  optimizationMode?: MatchHistoryCardOptimizationMode
}

const {
  summary,
  details = null,
  puuid,
  hidePrivacy = false,
  loadingDetails = false,
  replayState = null,
  canDryRunOngoingGame = false,
  hidden = false,
  optimizationMode = 'once'
} = defineProps<MatchHistoryCardProps>()

const emit = defineEmits<MatchCardEmits>()
const isExpanded = defineModel<boolean>('isExpanded', {
  required: false,
  default: false
})

const wrapperEl = useTemplateRef('wrapperEl')
const viewport = useMatchHistoryCardViewport()

const renderState = ref<'placeholder' | 'materialized'>('placeholder')
const isNearViewport = ref(false)
const animateMaterialization = ref(false)

let viewportRegistration: ReturnType<typeof viewport.register> | null = null
let hasReceivedViewportResult = false

const wrapperStyle = computed(() => ({
  display: hidden ? 'none' : undefined,
  height: renderState.value === 'placeholder' ? `${MATCH_CARD_COLLAPSED_HEIGHT_PX}px` : undefined
}))

const { start: startRecycleTimer, stop: stopRecycleTimer } = useTimeoutFn(
  () => {
    if (
      renderState.value === 'materialized' &&
      optimizationMode === 'recycle' &&
      !hidden &&
      !isNearViewport.value &&
      !isExpanded.value
    ) {
      renderState.value = 'placeholder'
    }
  },
  MATCH_HISTORY_CARD_RECYCLE_DELAY_MS,
  { immediate: false }
)

const materialize = (animate = true) => {
  stopRecycleTimer()

  if (renderState.value === 'materialized') {
    return
  }

  animateMaterialization.value = animate
  renderState.value = 'materialized'
}

const scheduleRecycle = () => {
  stopRecycleTimer()

  if (
    renderState.value !== 'materialized' ||
    optimizationMode !== 'recycle' ||
    hidden ||
    isNearViewport.value ||
    isExpanded.value
  ) {
    return
  }

  startRecycleTimer()
}

const handleNearViewportChange = (isNear: boolean) => {
  const animate = hasReceivedViewportResult
  hasReceivedViewportResult = true
  isNearViewport.value = isNear

  if (hidden) {
    return
  }

  if (isNear) {
    materialize(animate)
  } else {
    scheduleRecycle()
  }
}

const handleNavigateToSummonerByPuuid = (puuid: string, setCurrent?: boolean) => {
  emit('navigateToSummonerByPuuid', puuid, setCurrent)
}

const setExpanded = (expanded: boolean) => {
  isExpanded.value = expanded

  if (expanded && !hidden) {
    materialize()
  } else if (!expanded) {
    scheduleRecycle()
  }
}

watch(
  () => hidden,
  async (isHidden) => {
    stopRecycleTimer()
    isNearViewport.value = false

    if (isHidden) {
      return
    }

    await nextTick()

    if (isExpanded.value) {
      materialize()
    } else {
      viewportRegistration?.refresh()
    }
  }
)

watch(
  () => optimizationMode,
  (mode) => {
    if (mode === 'once') {
      stopRecycleTimer()
    } else {
      scheduleRecycle()
    }
  }
)

watch(isExpanded, (expanded) => {
  if (expanded && !hidden) {
    materialize()
  } else if (!expanded) {
    scheduleRecycle()
  }
})

onMounted(() => {
  const element = wrapperEl.value

  if (!element) {
    return
  }

  viewportRegistration = viewport.register(element, handleNearViewportChange)

  if (isExpanded.value && !hidden) {
    materialize(false)
  }
})

onBeforeUnmount(() => {
  viewportRegistration?.unregister()
})

defineExpose<MatchCardExpose>({
  setExpanded
})
</script>

<style scoped>
.match-history-card-materialize-enter-active {
  transition: opacity 180ms ease-out;
}

.match-history-card-materialize-enter-from {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .match-history-card-materialize-enter-active {
    transition-duration: 0.01ms;
  }
}
</style>
