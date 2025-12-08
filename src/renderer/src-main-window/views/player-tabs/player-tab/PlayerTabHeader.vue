<template>
  <div class="flex items-center">
    <!-- name & something -->
    <div class="flex flex-1 min-w-0 h-16">
      <!-- profile icon / summoner level -->
      <div class="relative size-16">
        <LcuImage
          class="size-full rounded"
          :src="summoner ? profileIconUri(summoner.profileIconId) : undefined"
        />
        <div
          v-if="summoner"
          class="absolute dark:text-white -bottom-1 -right-1 dark:bg-black/40 py-0.5 px-1 rounded text-10px"
        >
          {{ summoner.level }}
        </div>
      </div>

      <!-- name & tag -->
      <div class="flex flex-col gap-1 self-center ml-3">
        <div
          class="font-bold dark:text-white text-black"
          :class="summoner && summoner.gameName.length >= 16 ? 'text-sm' : 'text-xl'"
        >
          {{ summoner?.gameName || '—' }}
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ summoner ? `#${summoner.tagLine}` : '—' }}
        </div>
      </div>
    </div>

    <!-- ranked -->
    <RankedPane />

    <!-- buttons -->
    <div class="flex gap-2 ml-8 justify-end">
      <!-- tag edit -->
      <NButton secondary class="!size-42px" @click="isTagEditModalShowing = true">
        <template #icon>
          <NIcon><Edit20Filled /></NIcon>
        </template>
      </NButton>

      <!-- refresh -->
      <NButton secondary class="!size-42px" :loading="somethingLoading" @click="refresh">
        <template #icon>
          <NIcon><RefreshSharp /></NIcon>
        </template>
      </NButton>
    </div>

    <PlayerTagEditModal v-model:show="isTagEditModalShowing" />
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { Edit20Filled } from '@vicons/fluent'
import { RefreshSharp } from '@vicons/ionicons5'
import { NButton, NIcon } from 'naive-ui'
import { computed, ref } from 'vue'

import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import { usePlayerTab } from './context'
import { useEncounteredGames } from './data/encountered-games'
import { useMatchHistory } from './data/match-history'
import { useRankedStats } from './data/ranked-stats'
import { useSpectator } from './data/spectator'
import { useSummoner } from './data/summoner'
import { useSummonerProfile } from './data/summoner-profile'
import { useTags } from './data/tags'
import PlayerTagEditModal from './widgets/PlayerTagEditModal.vue'
import RankedPane from './widgets/RankedPane.vue'

const { id } = usePlayerTab()
const { summoner, loadSummoner } = useSummoner()
const { loadGames } = useEncounteredGames()
const { loadMatchHistory } = useMatchHistory()
const { loadRankedStats } = useRankedStats()
const { loadTags } = useTags()
const { loadSpectatorData } = useSpectator()
const { loadSummonerProfile } = useSummonerProfile()

const refresh = () => {
  loadSummoner()
  loadGames()
  loadMatchHistory()
  loadRankedStats()
  loadTags()
  loadSpectatorData()
  loadSummonerProfile()
}

const isTagEditModalShowing = ref(false)

const pts = usePlayerTabsStore()

const somethingLoading = computed(() => {
  return pts.getTab(id.value)?.isLoading ?? false
})
</script>
