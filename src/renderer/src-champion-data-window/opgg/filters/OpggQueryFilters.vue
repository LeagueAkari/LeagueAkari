<template>
  <div v-if="!managedPage?.currentGame?.unavailableReason" class="query-filter-row">
    <OpggModeSelect :value="mode" :disabled="Boolean(managedPage)" @update:value="changeMode" />
    <OpggRegionSelect
      v-if="mode !== 'aram_mayhem'"
      :value="region"
      :disabled="Boolean(managedPage)"
      @update:value="changeRegion"
    />
    <OpggTierSelect
      v-if="mode !== 'aram_mayhem' && mode !== 'arena'"
      :value="tier"
      :disabled="Boolean(managedPage)"
      @update:value="changeTier"
    />
    <OpggPositionSelect
      v-if="mode === 'ranked' || mode === 'flex'"
      :value="position"
      :disabled="Boolean(managedPage)"
      @update:value="changePosition"
    />
    <OpggVersionSelect
      v-if="mode !== 'aram_mayhem'"
      :value="version"
      :versions="versions"
      :disabled="Boolean(managedPage) || versions.length === 0"
      class="version-filter"
      @update:value="changeVersion"
    />
  </div>
</template>

<script setup lang="ts">
import '@champion-data-window/components/query-filter/filter-row.css'
import { useOpgg } from '../context'
import OpggModeSelect from './OpggModeSelect.vue'
import OpggRegionSelect from './OpggRegionSelect.vue'
import OpggTierSelect from './OpggTierSelect.vue'
import OpggPositionSelect from './OpggPositionSelect.vue'
import OpggVersionSelect from './OpggVersionSelect.vue'

const {
  mode,
  region,
  tier,
  position,
  version,
  versions,
  managedPage,
  changeMode,
  changeRegion,
  changeTier,
  changePosition,
  changeVersion
} = useOpgg()
</script>
