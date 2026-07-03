<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2" v-for="p of players" :key="p.puuid">
      <ChampionIcon class="size-6" round :champion-id="p.championId" />
      <div
        class="flex cursor-pointer items-end gap-0.5"
        v-if="p.gameName"
        @click="navigateToSummonerByPuuid(p.puuid)"
      >
        <div
          class="text-[13px] font-bold text-black/90 transition-colors hover:text-black dark:text-white/80 dark:hover:text-white"
        >
          {{ p.gameName }}
          <span v-if="p.tagLine" class="text-xs text-black/80 dark:text-white/80"
            >#{{ p.tagLine }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { computed } from 'vue'

import { useOngoingGamePanel } from '../context'

const { puuids = [] } = defineProps<{
  puuids?: string[]
}>()

const { ongoingGame, navigateToSummonerByPuuid } = useOngoingGamePanel()

const players = computed(() => {
  return puuids.map((puuid) => ({
    puuid,
    championId: ongoingGame.value.championSelections[puuid],
    gameName: ongoingGame.value.summoner[puuid]?.gameName,
    tagLine: ongoingGame.value.summoner[puuid]?.tagLine
  }))
})
</script>
