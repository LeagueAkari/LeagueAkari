<template>
  <JunglePathingInfo
    v-if="junglePathingAnalysis"
    :aggregated-analysis="junglePathingAnalysis"
    :current-champion-id="displayChampionId"
  />
</template>

<script setup lang="ts">
import { SUMMONER_SPELL_SMITE_ID } from '@shared/constants/summoner-spells'
import { computed } from 'vue'

import { useOngoingGamePanel } from '../../context'
import { resolveJunglePathingAnalysis } from './jungle-pathing-visibility'
import JunglePathingInfo from './jungle-pathing-info/JunglePathingInfo.vue'

const { puuid } = defineProps<{
  puuid: string
}>()

const { ongoingGame } = useOngoingGamePanel()

const analysis = computed(() => ongoingGame.value.analysis?.players[puuid])
const position = computed(() => ongoingGame.value.positionAssignments?.[puuid])
const championId = computed(() => ongoingGame.value.championSelections?.[puuid])

const isCurrentJungler = computed(() => {
  const assignedPosition = position.value?.position?.toUpperCase()
  if (assignedPosition === 'JUNGLE') {
    return true
  }

  const spells = ongoingGame.value.spells[puuid]
  return (
    spells?.spell1Id === SUMMONER_SPELL_SMITE_ID || spells?.spell2Id === SUMMONER_SPELL_SMITE_ID
  )
})

const junglePathingAnalysis = computed(() => {
  return resolveJunglePathingAnalysis({
    analysis: analysis.value,
    isCurrentJungler: isCurrentJungler.value,
    showJunglePathing: ongoingGame.value.settings.showJunglePathing,
    showJunglePathingForAllPlayers: ongoingGame.value.settings.showJunglePathingForAllPlayers
  })
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

  if (ongoingGame.value.settings.showJunglePathingForAllPlayers) {
    return mostPlayedJungleChampionId.value
  }

  return championId.value ?? null
})
</script>
