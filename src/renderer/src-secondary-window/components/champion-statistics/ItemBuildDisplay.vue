<template>
  <RecommendationSequence :items="itemIds" ordered>
    <template #default="{ item: id }">
      <ItemDisplay v-if="resources.items.display(id)" :item-id="id" :size="24" :max-width="300" />
      <span v-else class="text-xs">#{{ id }}</span>
    </template>
  </RecommendationSequence>
</template>

<script setup lang="ts">
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'

import RecommendationSequence from './RecommendationSequence.vue'

defineProps<{ itemIds: readonly number[] }>()

const resources = useAkariResourceProvider()
</script>
