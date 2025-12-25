<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2" v-for="p of list" :key="p.puuid">
      <ChampionIcon class="size-6" round :champion-id="p.championId" />
      <div
        class="flex cursor-pointer items-end gap-0.5"
        v-if="p.gameName"
        @click="navigateToTabByPuuid(p.puuid)"
      >
        <div
          class="text-[13px] font-bold text-black/90 transition-colors hover:text-black dark:text-white/80 dark:hover:text-white"
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

import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'

const { list = [] } = defineProps<{
  list?: Array<{
    puuid: string // must have
    championId?: number
    gameName?: string
    tagLine?: string
  }>
}>()

const pt = useInstance(PlayerTabsRenderer)

const { navigateToTabByPuuid } = pt.useNavigateToTab()
</script>
