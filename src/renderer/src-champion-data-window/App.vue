<template>
  <div class="flex h-full min-h-(--la-app-min-height) min-w-(--la-app-min-width) flex-col">
    <SetupInAppScope />
    <ChampionDataSourceBar
      :sources="sources"
      :active-source="activeSource"
      @select="selectSource"
      @settings="settingsShown = true"
    />

    <div
      v-if="!activeSource"
      role="status"
      class="flex min-h-0 flex-1 items-center justify-center px-6 text-center"
    >
      <div class="flex max-w-80 flex-col items-center gap-3">
        <div class="text-sm font-medium text-black/70 dark:text-white/75">
          {{ allSourcesDisabled ? t('opgg.sources.noneEnabled') : unavailableDescription }}
        </div>
        <div v-if="allSourcesDisabled" class="text-xs text-black/45 dark:text-white/45">
          {{ t('opgg.sources.enableDescription') }}
        </div>
        <NButton v-if="allSourcesDisabled" size="small" secondary @click="settingsShown = true">
          {{ t('opgg.sources.openSettings') }}
        </NButton>
      </div>
    </div>
    <KeepAlive>
      <Qq101View v-if="activeSource === 'qq101'" class="h-0 flex-1" />
    </KeepAlive>
    <KeepAlive>
      <View v-if="activeSource === 'opgg'" class="h-0 flex-1" />
    </KeepAlive>
    <NModal v-model:show="settingsShown" transform-origin="center">
      <div class="w-125 max-w-[90vw]">
        <SettingsPane @close="settingsShown = false" />
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/setup-in-app-scope-component'
import { useTranslation } from 'i18next-vue'
import { NButton, NModal } from 'naive-ui'
import { computed, ref } from 'vue'

import View from './opgg/View.vue'
import { provideOpgg } from './opgg/context'
import SettingsPane from './opgg/widgets/Settings.vue'
import ChampionDataSourceBar from './sources/ChampionDataSourceBar.vue'
import Qq101View from './qq101/View.vue'
import { useChampionDataSources } from './sources/use-champion-data-sources'

provideOpgg()

const { t } = useTranslation()
const settingsShown = ref(false)
const { sources, allSourcesDisabled, activeSource, minimumUpgradeVersion, selectSource } =
  useChampionDataSources()
const unavailableDescription = computed(() =>
  minimumUpgradeVersion.value
    ? t('opgg.sources.updateRequired', { version: minimumUpgradeVersion.value })
    : t('opgg.sources.unavailable')
)
</script>
