<template>
  <JunglePathingInfo
    v-if="junglePathingAnalysis"
    :aggregated-analysis="junglePathingAnalysis"
    :current-champion-id="displayChampionId"
  />
</template>

<script setup lang="ts">
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { SUMMONER_SPELL_SMITE_ID } from '@shared/constants/summoner-spells'
import { computed } from 'vue'

import JunglePathingInfo from './jungle-pathing-info/JunglePathingInfo.vue'

const { puuid } = defineProps<{
  puuid: string
}>()

const ogs = useOngoingGameStore()

const analysis = computed(() => ogs.analysis?.players[puuid])
const position = computed(() => ogs.positionAssignments?.[puuid])
const championId = computed(() => ogs.championSelections?.[puuid])

const isCurrentJungler = computed(() => {
  const assignedPosition = position.value?.position?.toUpperCase()
  if (assignedPosition === 'JUNGLE') {
    return true
  }

  const spells = ogs.additional.spells[puuid]
  return (
    spells?.spell1Id === SUMMONER_SPELL_SMITE_ID || spells?.spell2Id === SUMMONER_SPELL_SMITE_ID
  )
})

const junglePathingAnalysis = computed(() => {
  if (!analysis.value?.jungle) {
    return null
  }

  if (!isCurrentJungler.value && !ogs.settings.showJunglePathingForAllPlayers) {
    return null
  }

  return analysis.value
})

const mostPlayedJungleChampionId = computed(() => {
  const champion = Object.values(analysis.value?.champions ?? {})
    .filter((champion) => !!champion.jungle)
    .toSorted((a, b) => (b.jungle?.gamesAnalyzed ?? 0) - (a.jungle?.gamesAnalyzed ?? 0))[0]

  return champion?.championId ?? null
})

const displayChampionId = computed(() => {
  if (isCurrentJungler.value) {
    return championId.value ?? null
  }

  if (ogs.settings.showJunglePathingForAllPlayers) {
    return mostPlayedJungleChampionId.value
  }

  return championId.value ?? null
})
</script>
