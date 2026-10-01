<template>
  <Rankings
    :preferences="preferences"
    :loaded-preferences="store.qq101.loadedPreferences"
    :overview="store.qq101.overview"
    :patches="store.qq101.patches"
    :loading="store.qq101.isLoading"
    :error="store.qq101.error"
    @change="controller.changePreferences($event)"
    @refresh="controller.refresh()"
  />
</template>
<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { ChampionDataRenderer } from '@renderer-shared/shards/champion-data'
import { useChampionDataStore } from '@renderer-shared/shards/champion-data/store'
import { computed } from 'vue'
import Rankings from './Rankings.vue'
const store = useChampionDataStore()
const controller = useInstance(ChampionDataRenderer).qq101
const preferences = computed(
  () => store.qq101.requestedPreferences ?? store.settings.qq101Preferences
)
</script>
