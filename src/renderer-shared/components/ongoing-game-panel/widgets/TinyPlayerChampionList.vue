<template>
  <div class="flex gap-2 flex-col">
    <div class="flex gap-2 items-center" v-for="p of list" :key="p.puuid">
      <ChampionIcon class="size-6" round :champion-id="p.championId" />
      <div
        class="flex gap-0.5 items-end cursor-pointer"
        v-if="p.gameName"
        @click="navigateToTabByPuuid(p.puuid)"
      >
        <div
          class="text-13px font-bold transition-colors dark:text-white/80 dark:hover:text-white text-black/90 hover:text-black"
        >
          {{ p.gameName }} <span v-if="p.tagLine" class="text-xs">#{{ p.tagLine }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useInstance } from '@renderer-shared/shards'

import { MatchHistoryTabsRenderer } from '@main-window/shards/match-history-tabs'

const { list = [] } = defineProps<{
  list?: Array<{
    puuid: string // must have
    championId?: number
    gameName?: string
    tagLine?: string
  }>
}>()

const mh = useInstance(MatchHistoryTabsRenderer)

const { navigateToTabByPuuid } = mh.useNavigateToTab()
</script>
