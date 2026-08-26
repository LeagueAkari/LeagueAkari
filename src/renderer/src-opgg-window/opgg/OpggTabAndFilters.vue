<template>
  <div>
    <!-- buttons + tabs -->
    <div class="mb-1 flex items-center gap-1">
      <NSelect
        size="small"
        :placeholder="t('opgg.filters.source')"
        :options="sourceOptions"
        :value="preferredSource"
        :title="t('opgg.filters.source')"
        class="w-22!"
        :consistent-menu-width="false"
        :disabled="isLoading"
        @update:value="changeSource"
      />

      <a :href="sourceHomeUrl" :title="sourceHomeTitle" target="_blank">
        <NButton secondary class="size-8!">
          <template #icon>
            <NIcon><OpenOutline /></NIcon>
          </template>
        </NButton>
      </a>

      <!-- refresh -->
      <NButton
        secondary
        class="size-8!"
        :title="t('opgg.filters.refresh')"
        :loading="isLoading"
        @click="() => refresh()"
      >
        <template #icon>
          <NIcon><RefreshSharp /></NIcon>
        </template>
      </NButton>

      <!-- settings -->
      <NButton
        secondary
        class="size-8!"
        :title="t('opgg.filters.settings.button')"
        @click="isSettingsShow = true"
      >
        <template #icon>
          <NIcon><Settings /></NIcon>
        </template>
      </NButton>

      <NTabs class="tabs" :value="currentTab" type="segment" size="small" @update:value="setTab">
        <NTab name="champions" :tab="t('opgg.filters.champions')" />
        <NTab :title="t('opgg.filters.champion')" name="champion" :disabled="!championId">
          <div v-if="championId" class="flex items-center gap-2">
            <ChampionIcon round class="size-5" :champion-id="championId" />
            <span>{{ resources.champions.name(championId) }}</span>
          </div>
          <div v-else>{{ t('opgg.filters.empty') }}</div>
        </NTab>
      </NTabs>
    </div>

    <!-- filters -->
    <div class="flex gap-1">
      <NSelect
        size="small"
        :placeholder="t('opgg.filters.mode')"
        :options="modeOptions"
        :value="mode"
        @update:value="changeMode"
        :render-label="renderLabel"
        class="w-0! flex-1"
        :consistent-menu-width="false"
        :disabled="isLoading"
      />
      <NSelect
        v-if="supportsFilter('region')"
        size="small"
        :placeholder="t('opgg.filters.region')"
        :options="regionOptions"
        :value="region"
        @update:value="changeRegion"
        :render-label="renderLabel"
        class="w-0! flex-1"
        :consistent-menu-width="false"
        :disabled="isLoading"
      />
      <NSelect
        v-if="supportsFilter('tier')"
        size="small"
        :placeholder="t('opgg.filters.rankTier')"
        :options="tierOptions"
        :value="tier"
        @update:value="changeTier"
        :render-label="renderLabel"
        class="w-0! flex-1"
        :consistent-menu-width="false"
        :disabled="isLoading"
      />
      <NSelect
        v-if="supportsFilter('position')"
        size="small"
        :placeholder="t('opgg.filters.position')"
        :options="positionOptions"
        :value="position"
        @update:value="changePosition"
        class="w-18!"
        :render-label="renderLabel"
        :consistent-menu-width="false"
        :disabled="isLoading"
      />
      <NSelect
        v-if="supportsFilter('patch')"
        size="small"
        :placeholder="t('opgg.filters.version')"
        :value="version"
        :options="versionOptions"
        @update:value="changeVersion"
        :render-label="renderLabel"
        class="w-18!"
        :consistent-menu-width="false"
        :disabled="isLoading || versions.length === 0"
      />
    </div>

    <!-- settings modal -->
    <NModal v-model:show="isSettingsShow" transform-origin="center">
      <div class="w-125 max-w-[90vw]">
        <SettingsPane @close="isSettingsShow = false" />
      </div>
    </NModal>
  </div>
</template>

<script setup lang="tsx">
import {
  useModeOptions,
  usePositionOptions,
  useRegionOptions,
  useTierOptions
} from '@opgg-window/opgg/utils/options'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useChampionDataStore } from '@renderer-shared/shards/champion-data/store'
import {
  type ChampionDataFilter,
  type ChampionDataMode,
  getChampionDataCapability
} from '@shared/data-adapter/champion-data'
import { OpenOutline, RefreshSharp, Settings } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NModal, NSelect, NTab, NTabs, SelectRenderLabel } from 'naive-ui'
import { computed, ref } from 'vue'

import { useOpgg } from './context'
import SettingsPane from './widgets/Settings.vue'

const { t } = useTranslation()
const resources = useAkariResourceProvider()
const championDataStore = useChampionDataStore()

const {
  currentTab,
  mode,
  versions,
  version,
  tier,
  position,
  region,
  isLoading,
  championId,
  preferredSource,
  changeSource,
  changeMode,
  changePosition,
  changeRegion,
  changeTier,
  changeVersion,
  refresh,
  setTab
} = useOpgg()

const isSettingsShow = ref(false)

const { modeOptions } = useModeOptions(preferredSource)
const { regionOptions } = useRegionOptions()
const { tierOptions } = useTierOptions()
const { positionOptions } = usePositionOptions()

const versionOptions = computed(() =>
  versions.value.map((version) => ({ label: version, value: version }))
)

const sourceOptions = computed(() =>
  (['opgg', 'qq101'] as const).map((source) => ({
    label: t(`opgg.filters.sources.${source}`),
    value: source,
    disabled: !championDataStore.availability.sources[source].enabled
  }))
)

const capability = computed(() =>
  getChampionDataCapability(preferredSource.value, mode.value as ChampionDataMode)
)

const supportsFilter = (filter: ChampionDataFilter) =>
  capability.value?.filters.includes(filter) ?? false

const sourceHomeUrl = computed(() =>
  preferredSource.value === 'qq101' ? 'https://101.qq.com' : 'https://op.gg'
)

const sourceHomeTitle = computed(() =>
  t('opgg.filters.openSource', {
    source: t(`opgg.filters.sources.${preferredSource.value}`)
  })
)

const renderLabel: SelectRenderLabel = (option) => {
  return <span class="text-xs">{option.label as string}</span>
}
</script>
