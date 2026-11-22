<template>
  <NScrollbar class="h-full">
    <div class="flex flex-col gap-6">
      <SettingsSection
        setting-id="multi-window.secondary"
        :title="t('settings.multiWindow.secondaryWindow.title')"
      >
        <SettingsRow
          setting-id="multi-window.secondary.enabled"
          :label="t('settings.multiWindow.secondaryWindow.enabled.label')"
          :label-width="400"
        >
          <template #labelDescription>
            <div>{{ t('settings.multiWindow.secondaryWindow.enabled.description') }}</div>
            <div>
              <TranslationComponent
                :translation="t('settings.multiWindow.secondaryWindow.enabled.descriptionWithIcon')"
              >
                <template #icon>
                  <Window24FilledIcon
                    class="inline-block size-4 align-middle text-black dark:text-white"
                  />
                </template>
              </TranslationComponent>
            </div>
          </template>
          <NSwitch
            size="small"
            :value="secondaryWindowStore.settings.enabled"
            @update:value="(val) => wm.secondaryWindow.setEnabled(val)"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="multi-window.secondary.auto-show-lobby"
          :label="t('settings.multiWindow.secondaryWindow.autoShowInLobby.label')"
          :label-description="t('settings.multiWindow.secondaryWindow.autoShowInLobby.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="secondaryWindowStore.settings.autoShowInLobby"
            @update:value="(val) => wm.secondaryWindow.setAutoShowInLobby(val)"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="multi-window.secondary.auto-show-champ-select"
          :label="t('settings.multiWindow.secondaryWindow.autoShowInChampSelect.label')"
          :label-description="
            t('settings.multiWindow.secondaryWindow.autoShowInChampSelect.description')
          "
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="secondaryWindowStore.settings.autoShowInChampSelect"
            @update:value="(val) => wm.secondaryWindow.setAutoShowInChampSelect(val)"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="multi-window.secondary.shortcut"
          :disabled="!as.nativeSupport.nativeInput.available"
          :label-width="400"
          :label="t('settings.multiWindow.secondaryWindow.showShortcut.label')"
          :label-description="t('settings.multiWindow.secondaryWindow.showShortcut.description')"
        >
          <ShortcutSelector
            :target-id="AkariSecondaryWindow.SHOW_WINDOW_SHORTCUT_TARGET_ID"
            :shortcut-id="secondaryWindowStore.settings.showShortcut"
            @update:shortcut-id="(id) => wm.secondaryWindow.setShowShortcut(id)"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="multi-window.secondary.opacity"
          :label="t('settings.multiWindow.secondaryWindow.opacity.label')"
          :label-description="t('settings.multiWindow.secondaryWindow.opacity.description')"
          :label-width="400"
        >
          <NSlider
            class="w-48!"
            size=""
            :min="0.3"
            :max="1"
            :step="0.01"
            :format-tooltip="(v) => `${(v * 100).toFixed()}%`"
            @update:value="(val) => wm.secondaryWindow.setOpacity(val)"
            :value="secondaryWindowStore.settings.opacity"
          ></NSlider>
        </SettingsRow>
        <SettingsRow
          setting-id="multi-window.secondary.skin-selector"
          :label="t('settings.multiWindow.secondaryWindow.showSkinSelector.label')"
          :label-description="
            t('settings.multiWindow.secondaryWindow.showSkinSelector.description')
          "
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="secondaryWindowStore.settings.showSkinSelector"
            @update:value="(val) => wm.secondaryWindow.setShowSkinSelector(val)"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="multi-window.secondary.reset-position"
          :label="t('settings.multiWindow.secondaryWindow.resetWindowPosition.label')"
          :label-description="
            t('settings.multiWindow.secondaryWindow.resetWindowPosition.description')
          "
          :label-width="400"
        >
          <NButton
            size="small"
            type="warning"
            secondary
            @click="() => wm.secondaryWindow.resetPosition()"
            >{{ t('settings.multiWindow.secondaryWindow.resetWindowPosition.button') }}</NButton
          >
        </SettingsRow>
      </SettingsSection>
      <SettingsSection
        setting-id="multi-window.ongoing-game"
        :title="
          as.isElevated
            ? t('settings.multiWindow.ongoingGameWindow.title')
            : t('settings.multiWindow.ongoingGameWindow.titleRequireAdmin')
        "
      >
        <SettingsRow
          setting-id="multi-window.ongoing-game.enabled"
          :label="t('settings.multiWindow.ongoingGameWindow.enabled.label')"
          :label-description="t('settings.multiWindow.ongoingGameWindow.enabled.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="ogws.settings.enabled"
            @update:value="(val) => wm.ongoingGameWindow.setEnabled(val)"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="multi-window.ongoing-game.shortcut"
          :disabled="!as.nativeSupport.nativeInput.available"
          :label-width="400"
          :label="t('settings.multiWindow.ongoingGameWindow.showShortcut.label')"
          :label-description="t('settings.multiWindow.ongoingGameWindow.showShortcut.description')"
        >
          <ShortcutSelector
            :target-id="AkariOngoingGameWindow.SHOW_WINDOW_SHORTCUT_TARGET_ID"
            :shortcut-id="ogws.settings.showShortcut"
            @update:shortcut-id="(id) => wm.ongoingGameWindow.setShowShortcut(id)"
          />
        </SettingsRow>
      </SettingsSection>
      <SettingsSection
        setting-id="multi-window.cd-timer"
        :title="
          as.isElevated
            ? t('settings.multiWindow.cdTimerWindow.title')
            : t('settings.multiWindow.cdTimerWindow.titleRequireAdmin')
        "
      >
        <SettingsRow
          setting-id="multi-window.cd-timer.enabled"
          :disabled="!as.nativeSupport.nativeInput.available"
          :label="t('settings.multiWindow.cdTimerWindow.enabled.label')"
          :label-description="t('settings.multiWindow.cdTimerWindow.enabled.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :disabled="!as.nativeSupport.nativeInput.available"
            :value="ctws.settings.enabled"
            @update:value="(val) => wm.cdTimerWindow.setEnabled(val)"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="multi-window.cd-timer.shortcut"
          :disabled="!as.nativeSupport.nativeInput.available"
          :label-width="400"
          :label="t('settings.multiWindow.cdTimerWindow.showShortcut.label')"
          :label-description="t('settings.multiWindow.cdTimerWindow.showShortcut.description')"
        >
          <ShortcutSelector
            :target-id="AkariCdTimerWindow.SHOW_WINDOW_SHORTCUT_TARGET_ID"
            :shortcut-id="ctws.settings.showShortcut"
            @update:shortcut-id="(id) => wm.cdTimerWindow.setShowShortcut(id)"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="multi-window.cd-timer.reset-position"
          :disabled="!as.nativeSupport.nativeInput.available"
          :label="t('settings.multiWindow.cdTimerWindow.resetWindowPosition.label')"
          :label-description="
            t('settings.multiWindow.cdTimerWindow.resetWindowPosition.description')
          "
          :label-width="400"
        >
          <NButton
            size="small"
            type="warning"
            secondary
            :disabled="!as.nativeSupport.nativeInput.available"
            @click="() => wm.cdTimerWindow.resetPosition()"
            >{{ t('settings.multiWindow.cdTimerWindow.resetWindowPosition.button') }}</NButton
          >
        </SettingsRow>
        <SettingsRow
          setting-id="multi-window.cd-timer.type"
          :disabled="!as.nativeSupport.nativeInput.available"
          :label="t('settings.multiWindow.cdTimerWindow.timerType.label')"
          :label-description="t('settings.multiWindow.cdTimerWindow.timerType.description')"
          :label-width="400"
        >
          <NRadioGroup
            size="small"
            :disabled="!as.nativeSupport.nativeInput.available"
            :value="ctws.settings.timerType"
            @update:value="(val) => wm.cdTimerWindow.setTimerType(val)"
          >
            <div class="flex flex-wrap justify-end gap-x-3 gap-y-1">
              <NRadio value="countdown">{{
                t('settings.multiWindow.cdTimerWindow.timerType.options.countdown')
              }}</NRadio>
              <NRadio value="countup">{{
                t('settings.multiWindow.cdTimerWindow.timerType.options.countup')
              }}</NRadio>
            </div>
          </NRadioGroup>
        </SettingsRow>
        <SettingsRow
          setting-id="multi-window.cd-timer.reverse-adjustment"
          :disabled="!as.nativeSupport.nativeInput.available"
          :label="t('settings.multiWindow.cdTimerWindow.reverseAdjustmentDirection.label')"
          :label-description="
            t('settings.multiWindow.cdTimerWindow.reverseAdjustmentDirection.description')
          "
          :label-width="400"
        >
          <NSwitch
            size="small"
            :disabled="!as.nativeSupport.nativeInput.available"
            :value="ctws.settings.reverseAdjustmentDirection"
            @update:value="(val) => wm.cdTimerWindow.setReverseAdjustmentDirection(val)"
          />
        </SettingsRow>
        <template #footer>
          <div class="text-[11px] leading-4 text-black/50 dark:text-white/50">
            {{ t('settings.multiWindow.cdTimerWindow.description.lineA') }}
          </div>
          <div
            class="mt-0.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-[11px] leading-4"
          >
            <span class="font-medium text-black/65 dark:text-white/65">{{
              t('settings.multiWindow.cdTimerWindow.description.leftClick1')
            }}</span>
            <span>{{ t('settings.multiWindow.cdTimerWindow.description.leftClick2') }}</span>
            <span class="font-medium text-black/65 dark:text-white/65">{{
              t('settings.multiWindow.cdTimerWindow.description.rightDoubleClick1')
            }}</span>
            <span>{{ t('settings.multiWindow.cdTimerWindow.description.rightDoubleClick2') }}</span>
            <span class="font-medium text-black/65 dark:text-white/65">{{
              t('settings.multiWindow.cdTimerWindow.description.wheel1')
            }}</span>
            <span>{{ t('settings.multiWindow.cdTimerWindow.description.wheel2') }}</span>
          </div>
        </template>
      </SettingsSection>
    </div>
  </NScrollbar>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/settings-navigation/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/settings-navigation/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import {
  AkariCdTimerWindow,
  AkariSecondaryWindow,
  WindowManagerRenderer
} from '@renderer-shared/shards/window-manager'
import { AkariOngoingGameWindow } from '@renderer-shared/shards/window-manager'
import {
  useCdTimerWindowStore,
  useOngoingGameWindowStore,
  useSecondaryWindowStore
} from '@renderer-shared/shards/window-manager/store'
import { Window24Filled as Window24FilledIcon } from '@vicons/fluent'
import { TranslationComponent, useTranslation } from 'i18next-vue'
import { NButton, NRadio, NRadioGroup, NScrollbar, NSlider, NSwitch } from 'naive-ui'

import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'

const { t } = useTranslation()

const as = useAppCommonStore()
const secondaryWindowStore = useSecondaryWindowStore()
const ogws = useOngoingGameWindowStore()
const ctws = useCdTimerWindowStore()

const wm = useInstance(WindowManagerRenderer)
</script>
