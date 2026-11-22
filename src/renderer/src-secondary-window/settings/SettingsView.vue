<template>
  <div class="box-border flex min-h-0 w-full flex-col overflow-hidden">
    <div class="flex shrink-0 items-center gap-2 px-3 pt-4 pb-6">
      <NTooltip placement="bottom">
        <template #trigger>
          <NButton
            quaternary
            size="small"
            :aria-label="t('opgg.view.settings.back')"
            @click="router.push('/')"
          >
            <template #icon
              ><NIcon><ArrowBack /></NIcon
            ></template>
          </NButton>
        </template>
        {{ t('opgg.view.settings.back') }}
      </NTooltip>
      <div
        role="heading"
        aria-level="1"
        class="text-xl leading-7 font-bold text-black/85 dark:text-white/90"
      >
        {{ t('secondaryWindow.settings') }}
      </div>
    </div>
    <NScrollbar class="min-h-0 flex-1" content-class="px-2 pb-4">
      <div class="flex flex-col gap-6">
        <SettingsSection :title="t('opgg.view.settings.sections.window')">
          <SettingsNavigationRow
            target-id="multi-window.secondary.enabled"
            :label="t('settings.multiWindow.secondaryWindow.enabled.label')"
            :description="t('settings.multiWindow.secondaryWindow.enabled.description')"
            :value="windowStore.settings.enabled"
          />
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
        <SettingsSection
          v-if="store.visibleSources.length"
          :title="t('opgg.view.settings.sections.sources')"
        >
          <SourceSettings
            :automation="automation"
            :saving-automation="savingAutomation"
            @update:automation="saveAutomation"
          />
        </SettingsSection>
        <SettingsSection :title="t('opgg.view.settings.sections.preferences')">
          <SettingsRow
            :setting-id="FLASH_POSITION_TARGET_ID"
            :label="t('opgg.view.settings.flashPosition.label')"
            align="start"
          >
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
import { FLASH_POSITION_TARGET_ID } from '@renderer-shared/components/settings-navigation/targets/secondary-window'
import SettingsNavigationRow from '@secondary-window/components/SettingsNavigationRow.vue'
import SettingsRow from '@renderer-shared/components/settings-navigation/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/settings-navigation/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { useSecondaryWindowStore } from '@renderer-shared/shards/window-manager/store'
import { ChampionDataRenderer } from '@secondary-window/shards/champion-data'
import { useChampionDataStore } from '@secondary-window/shards/champion-data/store'
import type { ChampionDataAutomationSettings } from '@shared/shards/champion-data/automation'
import type { OpggFlashPosition } from '@shared/types/champion-data/opgg'
import { ArrowBack } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NIcon,
  NRadio,
  NRadioGroup,
  NScrollbar,
  NSwitch,
  NTooltip,
  useMessage
} from 'naive-ui'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import SourceSettings from './SourceSettings.vue'

const { t } = useTranslation()
const router = useRouter()
const windowStore = useSecondaryWindowStore()
const controller = useInstance(ChampionDataRenderer)
const store = useChampionDataStore()
const message = useMessage()

const flashPosition = computed(() => store.settings.opggFlashPosition)
const automation = computed(() => store.settings.automation)

const savingAutomation = ref(false)

const setFlashPosition = async (value: OpggFlashPosition) => {
  try {
    await controller.setFlashPosition(value)
  } catch (error) {
    message.error(String(error))
  }
}

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
