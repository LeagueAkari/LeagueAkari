<template>
  <div class="relative">
    <MatchCardOverview :width="width" @toggle-expand="isExpanded = !isExpanded" />

    <MatchCardDetails :width="width" :is-expanded="isExpanded" />
  </div>
</template>

<script lang="ts" setup>
import { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { onErrorCaptured } from 'vue'

import MatchCardDetails from './MatchCardDetails.vue'
import MatchCardOverview from './MatchCardOverview.vue'
import { provideMatchCard } from './context'

const {
  width = 720,
  theme = 'dark',
  summary,
  details,
  puuid
} = defineProps<{
  summary: LcuOrSgpGameSummary

  width?: number
  theme?: 'light' | 'dark'
  details?: LcuOrSgpGameDetails | null
  puuid?: string
}>()

const isExpanded = defineModel<boolean>('isExpanded', { required: false, default: true })

provideMatchCard({
  width: () => width,
  theme: () => theme,
  isExpanded: () => isExpanded.value,
  summary: () => summary,
  details: () => details,
  puuid: () => puuid
})

onErrorCaptured((error) => {
  console.error(error)
})
</script>
