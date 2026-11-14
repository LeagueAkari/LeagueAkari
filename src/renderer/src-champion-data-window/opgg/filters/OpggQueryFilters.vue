<template>
  <div class="query-filter-row">
    <OpggModeSelect
      :value="query.mode"
      :disabled="readOnly"
      @update:value="emit('change', { mode: $event })"
    />
    <OpggRegionSelect
      v-if="query.mode !== 'aram_mayhem'"
      :value="query.region"
      :disabled="readOnly"
      @update:value="emit('change', { region: $event })"
    />
    <OpggTierSelect
      v-if="query.mode !== 'aram_mayhem' && query.mode !== 'arena'"
      :value="query.tier"
      :disabled="readOnly"
      @update:value="emit('change', { tier: $event })"
    />
    <OpggPositionSelect
      v-if="query.mode === 'ranked' || query.mode === 'flex'"
      :value="query.position"
      :disabled="readOnly"
      @update:value="emit('change', { position: $event })"
    />
    <OpggVersionSelect
      v-if="query.mode !== 'aram_mayhem'"
      :value="version"
      :versions="versions"
      :disabled="readOnly || versions.length === 0"
      class="version-filter"
      @update:value="emit('change', { version: $event })"
    />
  </div>
</template>

<script setup lang="ts">
import '@champion-data-window/components/query-filter/filter-row.css'
import type {
  OpggChampionDataQuery,
  OpggChampionDataQueryUpdate
} from '@shared/types/champion-data/opgg'
import OpggModeSelect from './OpggModeSelect.vue'
import OpggRegionSelect from './OpggRegionSelect.vue'
import OpggTierSelect from './OpggTierSelect.vue'
import OpggPositionSelect from './OpggPositionSelect.vue'
import OpggVersionSelect from './OpggVersionSelect.vue'

defineProps<{
  query: OpggChampionDataQuery
  version: string | null
  versions: string[]
  readOnly: boolean
}>()

const emit = defineEmits<{ change: [query: OpggChampionDataQueryUpdate] }>()
</script>
