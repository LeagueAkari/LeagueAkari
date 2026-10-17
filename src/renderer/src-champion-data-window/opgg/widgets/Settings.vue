<template>
  <div
    class="box-border size-full overflow-hidden rounded-lg bg-neutral-100 px-2 py-4 dark:bg-neutral-800"
  >
    <SettingsSection no-bg>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-black/80 dark:text-white/90">
            {{ t('opgg.view.settings.title') }}
          </span>
          <NIcon
            class="cursor-pointer rounded text-lg text-black/50 transition-colors hover:bg-black/8 hover:text-black/80 dark:text-white/50 hover:dark:bg-white/8 dark:hover:text-white/80"
            @click="$emit('close')"
          >
            <Close />
          </NIcon>
        </div>
      </template>
      <SettingsRow
        :label="t('settings.multiWindow.championDataWindow.enabled.label')"
        :label-description="t('settings.multiWindow.championDataWindow.enabled.description')"
      >
        <NSwitch
          @update:value="(val) => wm.championDataWindow.setEnabled(val)"
          :value="championDataWindowStore.settings.enabled"
          size="small"
        />
      </SettingsRow>
      <SettingsRow
        :label="t('opgg.view.settings.sources.label')"
        :label-description="t('opgg.view.settings.sources.description')"
        control-full-line
      >
        <NRadioGroup
          class="w-full"
          name="champion-data-default-source"
          size="small"
          :value="sourcePreferences.defaultSource"
          @update:value="(source) => setDefaultSource(source as ChampionDataSourceId)"
        >
          <div class="flex flex-col rounded-md border border-black/8 px-3 dark:border-white/10">
            <div
              v-for="source in CHAMPION_DATA_SOURCE_ORDER"
              :key="source"
              class="flex items-center gap-4 py-3 [&+&]:border-t [&+&]:border-black/5 dark:[&+&]:border-white/8"
            >
              <div
                class="flex min-w-0 flex-1 items-center gap-2 text-sm text-black/80 dark:text-white/85"
              >
                <OpggIcon v-if="source === 'opgg'" class="size-4 shrink-0" />
                <span
                  v-else
                  class="flex h-4 min-w-5 shrink-0 items-center justify-center rounded-sm border border-current px-0.5 text-[9px] leading-none font-bold"
                  >101</span
                >
                <span>{{ t(`opgg.filters.sources.${source}`) }}</span>
              </div>
              <NRadio
                :value="source"
                :disabled="saving || !sourcePreferences.enabled[source]"
                :aria-label="
                  t('opgg.view.settings.sources.defaultLabel', {
                    source: t(`opgg.filters.sources.${source}`)
                  })
                "
              >
                {{ t('opgg.view.settings.sources.default') }}
              </NRadio>
              <NSwitch
                :value="sourcePreferences.enabled[source]"
                :disabled="saving"
                :aria-label="
                  t('opgg.view.settings.sources.enableLabel', {
                    source: t(`opgg.filters.sources.${source}`)
                  })
                "
                size="small"
                @update:value="(enabled) => setSourceEnabled(source, enabled)"
              />
            </div>
          </div>
        </NRadioGroup>
      </SettingsRow>
      <SettingsRow
        :label="t('opgg.view.settings.flashPosition.label')"
        :label-description="t('opgg.view.settings.flashPosition.description')"
        align="start"
      >
        <NRadioGroup size="small" :value="flashPosition" @update:value="setFlashPosition">
          <div class="flex flex-col gap-1">
            <NTooltip>
              <template #trigger>
                <NRadio value="d">D</NRadio>
              </template>
              {{ t('opgg.view.settings.flashPosition.options.d') }}
            </NTooltip>
            <NTooltip>
              <template #trigger>
                <NRadio value="f">F</NRadio>
              </template>
              {{ t('opgg.view.settings.flashPosition.options.f') }}
            </NTooltip>
            <NTooltip>
              <template #trigger>
                <NRadio value="auto">{{ t('opgg.view.settings.flashPosition.auto') }}</NRadio>
              </template>
              {{ t('opgg.view.settings.flashPosition.options.auto') }}
            </NTooltip>
          </div>
        </NRadioGroup>
      </SettingsRow>
    </SettingsSection>
  </div>
</template>

<script setup lang="ts">
import OpggIcon from '@renderer-shared/assets/icon/OpggIcon.vue'
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { ChampionDataRenderer } from '@renderer-shared/shards/champion-data'
import { useChampionDataStore } from '@renderer-shared/shards/champion-data/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useChampionDataWindowStore } from '@renderer-shared/shards/window-manager/store'
import { Close } from '@vicons/ionicons5'
import {
  CHAMPION_DATA_SOURCE_ORDER,
  type ChampionDataSourceId,
  type ChampionDataSourcePreferences
} from '@shared/types/champion-data'
import { useTranslation } from 'i18next-vue'
import { NIcon, NRadio, NRadioGroup, NSwitch, NTooltip, useMessage } from 'naive-ui'
import { computed, ref } from 'vue'

import { useOpgg } from '../context'

const { t } = useTranslation()

const championDataWindowStore = useChampionDataWindowStore()

const wm = useInstance(WindowManagerRenderer)
const championData = useInstance(ChampionDataRenderer)
const store = useChampionDataStore()
const sourcePreferences = computed(() => store.settings.sourcePreferences)
const saving = ref(false)
const message = useMessage()

const saveSources = async (preferences: ChampionDataSourcePreferences) => {
  saving.value = true

  try {
    await championData.setSourcePreferences(preferences)
  } catch {
    message.error(t('opgg.view.settings.sources.saveFailed'))
  } finally {
    saving.value = false
  }
}

const setSourceEnabled = (source: ChampionDataSourceId, enabled: boolean) =>
  saveSources({
    ...sourcePreferences.value,
    enabled: { ...sourcePreferences.value.enabled, [source]: enabled }
  })

const setDefaultSource = (source: ChampionDataSourceId) =>
  saveSources({
    ...sourcePreferences.value,
    defaultSource: source
  })

const { flashPosition, setFlashPosition } = useOpgg()

defineEmits<{
  close: []
}>()
</script>
