<template>
  <div class="relative h-full">
    <NScrollbar>
      <div class="@container mx-auto max-w-1064px">
        <!-- head -->
        <MatchHistoryHeader class="my-4 h-35 px-4" />

        <!-- main content -->
        <div class="flex gap-3">
          <!-- left -->
          <div class="hidden @[1000px]:block w-300px">
            <EncounteredGames />
          </div>

          <!-- right -->
          <div class="flex-1 bg-green-500/20 h-999"></div>
        </div>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { Summoner } from '@shared/data-adapter/summoner'
import { RankedStats } from '@shared/types/league-client/ranked'
import { SpectatorData } from '@shared/types/sgp/gsm'
import { NScrollbar } from 'naive-ui'

import MatchHistoryHeader from './MatchHistoryTabHeader.vue'
import { LoadingState, PagedMatchHistory, provideMatchHistoryTab } from './context'
import EncounteredGames from './widgets/EncounteredGames.vue'

const {
  puuid,
  summoner = null,
  rankedStats = null,
  preferSource,
  isCrossRegion = false,
  sgpServerId,
  hidePrivacy = false,
  spectatorData = null,
  pagedMatchHistory = null,
  loadingState = {
    isLoadingSummoner: false,
    isLoadingRankedStats: false,
    isLoadingMatchHistory: false,
    isLoadingSpectatorData: false,
    isLoadingTags: false,
    isLoadingSavedInfo: false,
    isLoadingSummonerProfile: false,
    isLoadingEncounteredGames: false
  }
} = defineProps<{
  puuid: string
  summoner?: Summoner
  rankedStats?: RankedStats
  sgpServerId: string
  hidePrivacy?: boolean
  isCrossRegion?: boolean
  preferSource: 'lcu' | 'sgp'
  spectatorData?: SpectatorData
  pagedMatchHistory?: PagedMatchHistory
  loadingState?: LoadingState
}>()

const emits = defineEmits<{
  navigateToSummonerByPuuid: [puuid: string, setCurrent?: boolean]
}>()

provideMatchHistoryTab({
  puuid: () => puuid,
  summoner: () => summoner,
  rankedStats: () => rankedStats,
  preferSource: () => preferSource,
  sgpServerId: () => sgpServerId,
  hidePrivacy: () => hidePrivacy,
  spectatorData: () => spectatorData,
  pagedMatchHistory: () => pagedMatchHistory,
  isCrossRegion: () => isCrossRegion,
  loadingState: () => loadingState,

  onNavigateToSummonerByPuuid: (puuid: string, setCurrent?: boolean) => {
    emits('navigateToSummonerByPuuid', puuid, setCurrent)
  }
})
</script>
