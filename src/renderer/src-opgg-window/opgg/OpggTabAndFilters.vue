<template>
  <div>
    <!-- buttons + tabs -->
    <div class="mb-1 flex items-center gap-1">
      <a href="https://op.gg" :title="t('OpggTabAndFilters.toOpgg')" target="_blank">
        <OpggIcon class="block size-8 text-blue-500 dark:text-white" />
      </a>

      <!-- refresh -->
      <NButton
        secondary
        class="size-8!"
        :title="t('OpggTabAndFilters.refresh')"
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
        :title="t('OpggTabAndFilters.settings.button')"
        @click="isSettingsShow = true"
      >
        <template #icon>
          <NIcon><Settings /></NIcon>
        </template>
      </NButton>

      <NTabs class="tabs" :value="currentTab" type="segment" size="small" @update:value="setTab">
        <NTab name="champions" :tab="t('OpggTabAndFilters.champions')" />
        <NTab :title="t('OpggTabAndFilters.champion')" name="champion" :disabled="!championId">
          <div v-if="championId" class="flex items-center gap-2">
            <ChampionIcon round class="size-5" :champion-id="championId" />
            <span>{{ lcs.gameData.championName(championId) }}</span>
          </div>
          <div v-else>{{ t('OpggTabAndFilters.empty') }}</div>
        </NTab>
      </NTabs>
    </div>

    <!-- filters -->
    <div class="flex gap-1">
      <NSelect
        size="small"
        :placeholder="t('OpggTabAndFilters.mode')"
        :options="modeOptions"
        :value="mode"
        @update:value="changeMode"
        :render-label="renderLabel"
        class="w-0! flex-1"
        :consistent-menu-width="false"
        :disabled="isLoading"
      />
      <NSelect
        size="small"
        :placeholder="t('OpggTabAndFilters.region')"
        :options="regionOptions"
        :value="region"
        @update:value="changeRegion"
        :render-label="renderLabel"
        class="w-0! flex-1"
        :consistent-menu-width="false"
        :disabled="isLoading"
      />
      <NSelect
        size="small"
        :placeholder="t('OpggTabAndFilters.rankTier')"
        :options="tierOptions"
        :value="tier"
        @update:value="changeTier"
        :render-label="renderLabel"
        class="w-0! flex-1"
        :consistent-menu-width="false"
        :disabled="isLoading || mode === 'arena'"
      />
      <NSelect
        size="small"
        :placeholder="t('OpggTabAndFilters.position')"
        :options="positionOptions"
        :value="position"
        @update:value="changePosition"
        class="w-18!"
        :render-label="renderLabel"
        :consistent-menu-width="false"
        :disabled="isLoading || mode !== 'ranked'"
      />
      <NSelect
        size="small"
        :placeholder="t('OpggTabAndFilters.version')"
        :value="version"
        :options="versionOptions"
        @update:value="changeVersion"
        :render-label="renderLabel"
        class="w-18!"
        :consistent-menu-width="false"
        :disabled="isLoading"
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

<script setup lang="ts">
import {
  useModeOptions,
  usePositionOptions,
  useRegionOptions,
  useTierOptions
} from '@opgg-window/opgg/utils/options'
import OpggIcon from '@renderer-shared/assets/icon/OpggIcon.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { RefreshSharp, Settings } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NModal, NSelect, NTab, NTabs, SelectRenderLabel } from 'naive-ui'
import { computed, h, ref } from 'vue'

import { useOpgg } from './context'
import SettingsPane from './widgets/Settings.vue'

const { t } = useTranslation()
const lcs = useLeagueClientStore()

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
  changeMode,
  changePosition,
  changeRegion,
  changeTier,
  changeVersion,
  refresh,
  setTab
} = useOpgg()

const isSettingsShow = ref(false)

const { modeOptions } = useModeOptions()
const { regionOptions } = useRegionOptions()
const { tierOptions } = useTierOptions()
const { positionOptions } = usePositionOptions(mode)

const versionOptions = computed(() =>
  versions.value.map((version) => ({ label: version, value: version }))
)

const renderLabel: SelectRenderLabel = (option) => {
  return h('span', { class: 'text-xs' }, option.label as string)
}
</script>
