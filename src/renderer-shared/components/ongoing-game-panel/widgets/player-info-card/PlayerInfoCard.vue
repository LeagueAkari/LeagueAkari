<template>
  <div
    :class="[
      'relative box-border flex flex-col overflow-hidden rounded border border-neutral-900/20 bg-neutral-100/90 p-2 transition-[filter] dark:border-white/10 dark:bg-neutral-900/90'
    ]"
    :style="{
      width: FIXED_CARD_WIDTH_PX_LITERAL,
      borderColor: premadeTeamId ? premadeColors[premadeTeamId]?.borderColor : undefined
    }"
  >
    <!-- premade deco -->
    <div
      class="absolute top-0 right-0 z-0 h-4 w-4 translate-x-1/2 -translate-y-1/2 rotate-45"
      :style="{
        backgroundColor: premadeTeamId ? premadeColors[premadeTeamId]?.foregroundColor : undefined
      }"
    />

    <PlayerInfoCardHeader :puuid="puuid" />
    <PlayerInfoCardStats :puuid="puuid" />
    <PlayerInfoCardJunglePathing :puuid="puuid" />

    <PlayerCardTagsArea :puuid="puuid" :premade-team-id="premadeTeamId" />
    <PlayerInfoCardChampionUsage :puuid="puuid" />
    <PlayerInfoCardMatchHistory :puuid="puuid" />
  </div>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { computed } from 'vue'

import {
  FIXED_CARD_WIDTH_PX_LITERAL,
  PREMADE_TEAM_COLORS,
  PREMADE_TEAM_COLORS_LIGHT
} from '../../constants'
import { useOngoingGamePanel } from '../../context'
import PlayerCardTagsArea from './PlayerCardTagsArea.vue'
import PlayerInfoCardChampionUsage from './PlayerInfoCardChampionUsage.vue'
import PlayerInfoCardHeader from './PlayerInfoCardHeader.vue'
import PlayerInfoCardJunglePathing from './PlayerInfoCardJunglePathing.vue'
import PlayerInfoCardMatchHistory from './PlayerInfoCardMatchHistory.vue'
import PlayerInfoCardStats from './PlayerInfoCardStats.vue'

const { puuid } = defineProps<{
  puuid: string
}>()

const { mergedPremadeTeams } = useOngoingGamePanel()

const premadeTeamId = computed(() => mergedPremadeTeams.value.premadeTeamIdMap[puuid])

const as = useAppCommonStore()

const premadeColors = computed(() => {
  return as.colorTheme === 'dark' ? PREMADE_TEAM_COLORS : PREMADE_TEAM_COLORS_LIGHT
})
</script>

<style scoped></style>
