<template>
  <div class="max-w-64 min-w-40 text-xs">
    <div class="mb-2 flex items-center gap-2 font-semibold">
      <ChampionIcon v-if="championId != null" :champion-id="championId" class="size-5!" />
      {{ title }}
    </div>
    <div class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
      <template v-for="field in fields" :key="field.label">
        <span class="opacity-60">{{ field.label }}</span>
        <FilterLabel
          class="justify-self-end"
          :label="field.value"
          :icon="field.icon"
          :position="field.position"
          :rank="field.rank"
          :flag="field.flag"
        />
      </template>
    </div>
  </div>
</template>
<script lang="ts">
export interface QuerySummaryField {
  label: string
  value: string
  icon?: 'region' | 'tier'
  position?: string
  rank?: string
  flag?: string
}
</script>
<script setup lang="ts">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import FilterLabel from './FilterLabel.vue'

defineProps<{ title: string; championId?: number | null; fields: QuerySummaryField[] }>()
</script>
