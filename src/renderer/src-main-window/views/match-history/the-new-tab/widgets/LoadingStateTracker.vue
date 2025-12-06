<script setup lang="ts">
import { computed, watchEffect } from 'vue'

import { useEncounteredGames } from '../data/encountered-games'
import { useMatchHistory } from '../data/match-history'
import { useRankedStats } from '../data/ranked-stats'
import { useSummoner } from '../data/summoner'

const { isLoading: isLoadingSummoner } = useSummoner()
const { isLoading: isLoadingEncounteredGames } = useEncounteredGames()
const { isLoading: isLoadingMatchHistory } = useMatchHistory()
const { isLoading: isLoadingRankedStats } = useRankedStats()

const isSomethingLoading = computed(() => {
  return (
    isLoadingSummoner.value ||
    isLoadingEncounteredGames.value ||
    isLoadingMatchHistory.value ||
    isLoadingRankedStats.value
  )
})

const emits = defineEmits<{
  update: [isSomethingLoading: boolean]
}>()

watchEffect(() => emits('update', isSomethingLoading.value))
</script>

<template></template>
