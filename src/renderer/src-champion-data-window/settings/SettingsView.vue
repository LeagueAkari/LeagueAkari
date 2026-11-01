<template>
  <div class="box-border flex min-h-0 w-full flex-col overflow-hidden">
    <div
      role="heading"
      aria-level="1"
      class="shrink-0 px-5 pt-4 pb-6 text-xl leading-7 font-bold text-black/85 dark:text-white/90"
    >
      {{ t('opgg.filters.settings.button') }}
    </div>
    <NScrollbar class="min-h-0 flex-1" content-class="px-2 pb-4">
      <div class="flex flex-col gap-6">
        <SettingsSection :title="t('opgg.view.settings.sections.window')">
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
            :label="t('opgg.automation.enabled')"
            :label-description="t('opgg.automation.description')"
          >
            <NSwitch
              :value="automation.enabled"
              :disabled="savingAutomation"
              :aria-label="t('opgg.automation.enabled')"
              size="small"
              @update:value="saveAutomation({ ...automation, enabled: $event })"
            />
          </SettingsRow>
        </SettingsSection>
        <SettingsSection :title="t('opgg.view.settings.sections.sources')">
          <SourceSettings
            :automation="automation"
            :saving-automation="savingAutomation"
            @update:automation="saveAutomation"
          />
        </SettingsSection>
        <SettingsSection :title="t('opgg.view.settings.sections.preferences')">
          <SettingsRow :label="t('opgg.view.settings.flashPosition.label')" align="start">
            <NRadioGroup
              name="champion-data-flash-position"
              role="radiogroup"
              size="small"
              :aria-label="t('opgg.view.settings.flashPosition.label')"
              :value="flashPosition"
              @update:value="setFlashPosition"
            >
              <div class="flex flex-col gap-1">
                <NRadio value="d">{{ t('opgg.view.settings.flashPosition.options.d') }}</NRadio>
                <NRadio value="f">{{ t('opgg.view.settings.flashPosition.options.f') }}</NRadio>
                <NRadio value="auto">{{
                  t('opgg.view.settings.flashPosition.options.auto')
                }}</NRadio>
              </div>
            </NRadioGroup>
          </SettingsRow>
        </SettingsSection>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { useOpgg } from '@champion-data-window/opgg/context'
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { ChampionDataRenderer } from '@renderer-shared/shards/champion-data'
import { useChampionDataStore } from '@renderer-shared/shards/champion-data/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useChampionDataWindowStore } from '@renderer-shared/shards/window-manager/store'
import type { ChampionDataAutomationSettings } from '@shared/shards/champion-data/automation'
import { useTranslation } from 'i18next-vue'
import { NRadio, NRadioGroup, NScrollbar, NSwitch, useMessage } from 'naive-ui'
import { computed, ref } from 'vue'

import SourceSettings from './SourceSettings.vue'

const { t } = useTranslation()
const championDataWindowStore = useChampionDataWindowStore()
const wm = useInstance(WindowManagerRenderer)
const { flashPosition, setFlashPosition } = useOpgg()
const controller = useInstance(ChampionDataRenderer)
const store = useChampionDataStore()
const automation = computed(() => store.settings.automation)
const savingAutomation = ref(false)
const message = useMessage()

const saveAutomation = async (value: ChampionDataAutomationSettings) => {
  savingAutomation.value = true

  try {
    await controller.setAutomation(value)
  } catch {
    message.error(t('opgg.view.settings.sources.saveFailed'))
  } finally {
    savingAutomation.value = false
  }
}
</script>
