<template>
  <!-- loading state -->
  <div
    v-if="isLoading && !pagedMatchHistory"
    class="h-50 flex items-center justify-center dark:bg-white/5 bg-black/5 rounded"
  >
    <div class="flex items-center gap-2">
      <NSpin :size="16" />
      <span class="text-sm dark:text-white/60 text-black/80">正在加载中</span>
    </div>
  </div>

  <!-- empty placeholder -->
  <div
    v-else-if="pagedMatchHistory && pagedMatchHistory.games.length === 0"
    class="h-50 flex items-center justify-center dark:bg-white/5 bg-black/5 rounded"
  >
    <span class="text-sm dark:text-white/60 text-black/80">暂无战绩</span>
  </div>

  <!-- match history list -->
  <div v-else-if="pagedMatchHistory" class="space-y-1">
    <MatchCard
      v-for="g of pagedMatchHistory.games"
      :summary="g"
      :puuid="puuid"
      :key="`${g.source}${g.gameId}`"
      :theme="as.colorTheme"
      @navigate-to-summoner-by-puuid="navigateToSummonerByPuuid"
      @load-details="loadDetails(g.gameId)"
      @download-replay="downloadReplay(g.gameId)"
      @watch-replay="launchRelay(g.gameId)"
      :details="pagedMatchHistory.details[g.gameId]"
      :loading-details="pagedMatchHistory.detailsLoading[g.gameId]"
      :hide-privacy="hidePrivacy"
      :replay-state="pagedMatchHistory.replayMetadata[g.gameId]?.state"
    />
  </div>
</template>

<script setup lang="ts">
import MatchCard from '@renderer-shared/components/match-card/MatchCard.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { NSpin } from 'naive-ui'
import { computed } from 'vue'

import { usePlayerTab } from './context'
import { useMatchHistory } from './data/match-history'

const as = useAppCommonStore()
const { masked } = useStreamerModeMaskedText()

const { puuid, navigateToSummonerByPuuid } = usePlayerTab()
const { pagedMatchHistory, isLoading, loadDetails, downloadReplay, launchRelay } = useMatchHistory()

// trick
const hidePrivacy = computed(() => masked('__streamer_flag__') !== '__streamer_flag__')
</script>
