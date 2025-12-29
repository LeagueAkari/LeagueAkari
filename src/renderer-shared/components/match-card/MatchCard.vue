<template>
  <div class="relative w-full min-w-[700px]">
    <MatchCardOverview @toggle-expand="isExpanded = !isExpanded" />

    <KeepAlive>
      <MatchCardDetails v-if="!puuid || isExpanded" />
    </KeepAlive>
  </div>
</template>

<script lang="ts" setup>
import { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { ReplayDownloadProgress } from '@shared/types/league-client/replays'
import { onErrorCaptured } from 'vue'

import MatchCardDetails from './MatchCardDetails.vue'
import MatchCardOverview from './MatchCardOverview.vue'
import { registerChartJS } from './chartjs-register'
import { provideMatchCard } from './context'

const {
  theme = 'dark',
  summary,
  puuid,
  details = null,
  hidePrivacy = false,
  loadingDetails = false,
  replayState = 'checking'
} = defineProps<{
  summary: LcuOrSgpGameSummary
  details?: LcuOrSgpGameDetails | null
  theme?: 'light' | 'dark'
  puuid?: string
  hidePrivacy?: boolean

  loadingDetails?: boolean
  replayState?: ReplayDownloadProgress['state']
}>()

const emits = defineEmits<{
  loadDetails: [gameId: number]
  downloadReplay: [gameId: number]
  watchReplay: [gameId: number]
  navigateToSummonerByPuuid: [puuid: string, setCurrent?: boolean]
}>()

const isExpanded = defineModel<boolean>('isExpanded', { required: false, default: false })

provideMatchCard({
  theme: () => theme,
  isExpanded: () => isExpanded.value,
  summary: () => summary,
  puuid: () => puuid,
  details: () => details,
  hidePrivacy: () => hidePrivacy,
  loadingDetails: () => loadingDetails,
  replayState: () => replayState,

  onNavigateToSummonerByPuuid: (puuid: string, setCurrent?: boolean) => {
    emits('navigateToSummonerByPuuid', puuid, setCurrent)
  },
  onLoadReplay: (gameId: number) => {
    emits('downloadReplay', gameId)
  },
  onWatchReplay: (gameId: number) => {
    emits('watchReplay', gameId)
  },
  onLoadDetails: (gameId: number) => {
    emits('loadDetails', gameId)
  }
})

onErrorCaptured((error) => {
  console.error(error)
})

registerChartJS()

defineExpose({
  setExpanded: (expanded: boolean) => {
    isExpanded.value = expanded
  }
})
</script>
