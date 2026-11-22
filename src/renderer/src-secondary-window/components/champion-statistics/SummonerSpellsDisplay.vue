<template>
  <RecommendationSequence :items="spellIds">
    <template #default="{ item: id }">
      <SummonerSpellDisplay v-if="resources.summonerSpells.display(id)" :spell-id="id" :size="28" />
      <span v-else class="text-xs">#{{ id }}</span>
    </template>
  </RecommendationSequence>
</template>

<script setup lang="ts">
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'

import RecommendationSequence from './RecommendationSequence.vue'

defineProps<{ spellIds: readonly number[] }>()

const resources = useAkariResourceProvider()
</script>
