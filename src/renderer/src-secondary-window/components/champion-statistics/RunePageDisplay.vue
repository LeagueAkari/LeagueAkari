<template>
  <div>
    <div class="mb-1 flex items-end gap-0.5">
      <PerkstyleDisplay class="mr-1" :size="24" :perkstyle-id="page.primaryStyleId ?? undefined" />
      <PerkSelection :perk-ids="page.primaryRuneIds" />
    </div>
    <div class="flex items-end gap-0.5">
      <PerkstyleDisplay
        class="mr-1 opacity-80"
        :size="24"
        :perkstyle-id="page.secondaryStyleId ?? undefined"
      />
      <PerkSelection :perk-ids="page.secondaryRuneIds" />
      <div class="w-6" />
      <PerkSelection :perk-ids="page.statShardIds" />
    </div>
  </div>
</template>
<script setup lang="ts">
import PerkstyleDisplay from '@renderer-shared/components/widgets/PerkstyleDisplay.vue'

import PerkSelection from './PerkSelection.vue'

defineProps<{
  page: {
    primaryStyleId: number | null
    secondaryStyleId: number | null
    primaryRuneIds: readonly number[]
    secondaryRuneIds: readonly number[]
    statShardIds: readonly number[]
  }
}>()
</script>
