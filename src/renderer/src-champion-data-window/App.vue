<template>
  <div class="flex h-full min-h-(--la-app-min-height) min-w-(--la-app-min-width) flex-col">
    <SetupInAppScope />
    <ChampionDataWindowTitlebar
      :sources="sources"
      :active-tab="isSettings ? 'settings' : activeSource"
      @select="selectTab"
    />
    <RouterView v-slot="{ Component, route: currentRoute }">
      <KeepAlive>
        <component
          :is="Component"
          :key="currentRoute.name ?? currentRoute.path"
          v-if="currentRoute.name !== 'settings' || settingsAvailable"
          v-bind="currentRoute.name === 'sources' ? sourceViewProps : {}"
          class="h-0 min-h-0 flex-1"
        />
      </KeepAlive>
    </RouterView>
  </div>
</template>

<script setup lang="ts">
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/setup-in-app-scope-component'
import type { ChampionDataSourceId } from '@shared/types/champion-data'
import { computed, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import { provideOpgg } from './opgg/context'
import ChampionDataWindowTitlebar from './components/ChampionDataWindowTitlebar.vue'
import { useChampionDataSources } from './sources/use-champion-data-sources'

provideOpgg()

const router = useRouter()
const route = useRoute()
const { sources, allSourcesDisabled, activeSource, minimumUpgradeVersion, selectSource } =
  useChampionDataSources()
const settingsAvailable = computed(() => sources.value.some((source) => source.available))
const isSettings = computed(() => route.name === 'settings')
const sourceViewProps = computed(() => ({
  activeSource: activeSource.value,
  allSourcesDisabled: allSourcesDisabled.value,
  settingsAvailable: settingsAvailable.value,
  minimumUpgradeVersion: minimumUpgradeVersion.value
}))

const selectTab = (tab: ChampionDataSourceId | 'settings') => {
  if (tab === 'settings') {
    if (settingsAvailable.value) {
      void router.push('/settings')
    }

    return
  }

  selectSource(tab)
  void router.push('/')
}

watch(
  [isSettings, settingsAvailable],
  ([settings, available]) => {
    if (settings && !available) {
      void router.replace('/')
    }
  },
  { immediate: true }
)
</script>
