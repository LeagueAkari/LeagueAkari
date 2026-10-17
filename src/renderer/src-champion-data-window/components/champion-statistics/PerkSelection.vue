<template>
  <div class="flex items-end gap-0.5">
    <template v-for="(id, index) in perkIds" :key="`${id}:${index}`">
      <PerkDisplay v-if="resources.perks.display(id)" :perk-id="id" :size="18" :max-width="280" />
      <span v-else class="text-xs">#{{ id }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'

defineProps<{ perkIds: readonly number[] }>()

const resources = useAkariResourceProvider()
</script>
