<template>
  <div class="flex h-full min-h-(--la-app-min-height) min-w-(--la-app-min-width) flex-col">
    <SetupInAppScope />
    <SecondaryWindowTitlebar
      :sources="sources"
      :active-tab="activeTab"
      @select="selectTab"
      @settings="router.push('/settings')"
    />
    <RouterView v-slot="{ Component, route: currentRoute }">
      <KeepAlive>
        <component
          :is="Component"
          :key="currentRoute.name ?? currentRoute.path"
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
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'

import SecondaryWindowTitlebar from './components/SecondaryWindowTitlebar.vue'
import { provideChampionData } from './context'
import { useSecondarySettingsNavigation } from './settings/navigation'
import { useChampionDataSources } from './sources/use-champion-data-sources'

const router = useRouter()
const route = useRoute()

provideChampionData()
useSecondarySettingsNavigation()

const { sources, activeSource, selectSource } = useChampionDataSources()
const activeTab = computed(() => {
  if (route.name === 'activity') {
    return 'activity'
  }

  return route.name === 'sources' ? activeSource.value : null
})

const sourceViewProps = computed(() => ({
  activeSource: activeSource.value,
  hasVisibleSource: sources.value.length > 0
}))

const selectTab = (tab: ChampionDataSourceId | 'activity') => {
  if (tab === 'activity') {
    void router.push('/activity')
    return
  }

  selectSource(tab)
  void router.push('/champion-data')
}
</script>
