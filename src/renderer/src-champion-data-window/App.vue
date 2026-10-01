<template>
  <div class="flex h-full min-h-(--la-app-min-height) min-w-(--la-app-min-width) flex-col">
    <SetupInAppScope />
    <ChampionDataSourceBar
      :sources="enabledSources"
      :active-source="activeSource"
      @select="selectSource"
    />

    <NEmpty
      v-if="!activeSource"
      class="flex min-h-0 flex-1 items-center justify-center px-6 text-center"
      :description="unavailableDescription"
    />
    <KeepAlive>
      <Qq101View v-if="activeSource === 'qq101'" class="h-0 flex-1" />
    </KeepAlive>
    <KeepAlive>
      <View v-if="activeSource === 'opgg'" class="h-0 flex-1" />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/setup-in-app-scope-component'
import { useTranslation } from 'i18next-vue'
import { NEmpty } from 'naive-ui'
import { computed } from 'vue'

import View from './opgg/View.vue'
import { provideOpgg } from './opgg/context'
import ChampionDataSourceBar from './sources/ChampionDataSourceBar.vue'
import Qq101View from './qq101/View.vue'
import { useChampionDataSources } from './sources/use-champion-data-sources'

provideOpgg()

const { t } = useTranslation()
const { enabledSources, activeSource, minimumUpgradeVersion, selectSource } =
  useChampionDataSources()
const unavailableDescription = computed(() =>
  minimumUpgradeVersion.value
    ? t('opgg.sources.updateRequired', { version: minimumUpgradeVersion.value })
    : t('opgg.sources.unavailable')
)
</script>
