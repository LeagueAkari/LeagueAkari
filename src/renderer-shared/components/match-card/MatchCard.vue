<template>
  <div
    class="relative w-full min-w-175 [content-visibility:auto]"
    :style="{ containIntrinsicSize: `${MATCH_CARD_COLLAPSED_HEIGHT_PX}px` }"
  >
    <MatchCardOverview @toggle-expand="isExpanded = !isExpanded" />

    <KeepAlive>
      <MatchCardDetails v-if="!puuid || isExpanded" />
    </KeepAlive>
  </div>
</template>

<script lang="ts" setup>
import { onErrorCaptured } from 'vue'

import { MATCH_CARD_COLLAPSED_HEIGHT_PX } from './constants'
import MatchCardDetails from './MatchCardDetails.vue'
import MatchCardOverview from './MatchCardOverview.vue'
import { provideMatchCard } from './context'
import type { MatchCardEmits, MatchCardExpose, MatchCardProps } from './types'

const {
  summary,
  puuid,
  details = null,
  hidePrivacy = false,
  loadingDetails = false,
  replayState = null,
  canDryRunOngoingGame = false
} = defineProps<MatchCardProps>()

const emits = defineEmits<MatchCardEmits>()

const isExpanded = defineModel<boolean>('isExpanded', {
  required: false,
  default: false
})

provideMatchCard({
  isExpanded: () => isExpanded.value,
  summary: () => summary,
  puuid: () => puuid,
  details: () => details,
  hidePrivacy: () => hidePrivacy,
  loadingDetails: () => loadingDetails,
  replayState: () => replayState,
  canDryRunOngoingGame: () => canDryRunOngoingGame,

  navigateToSummonerByPuuid: (puuid: string, setCurrent?: boolean) => {
    emits('navigateToSummonerByPuuid', puuid, setCurrent)
  },
  loadReplay: (gameId: number) => {
    emits('downloadReplay', gameId)
  },
  watchReplay: (gameId: number) => {
    emits('watchReplay', gameId)
  },
  loadDetails: (gameId: number) => {
    emits('loadDetails', gameId)
  },
  dryRunOngoingGame: (draft) => {
    emits('dryRunOngoingGame', draft)
  }
})

onErrorCaptured((error) => {
  console.error(error)
})

defineExpose<MatchCardExpose>({
  setExpanded: (expanded: boolean) => {
    isExpanded.value = expanded
  }
})
</script>
