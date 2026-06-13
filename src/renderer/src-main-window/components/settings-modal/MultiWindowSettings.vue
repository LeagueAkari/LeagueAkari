<template>
  <NScrollbar class="h-full">
    <div class="flex flex-col gap-6">
      <SettingsSection :title="t('MultiWindowSettings.auxWindow.title')">
        <SettingsRow :label="t('MultiWindowSettings.auxWindow.enabled.label')" :label-width="400">
          <template #labelDescription>
            <div>{{ t('MultiWindowSettings.auxWindow.enabled.description') }}</div>
            <div>
              <TranslationComponent
                :translation="t('MultiWindowSettings.auxWindow.enabled.descriptionWithIcon')"
              >
                <template #icon>
                  <NIcon class="inline-block size-4 align-middle text-black dark:text-white">
                    <Window24FilledIcon />
                  </NIcon>
                </template>
              </TranslationComponent>
            </div>
          </template>
          <NSwitch
            size="small"
            :value="aws.settings.enabled"
            @update:value="(val) => wm.auxWindow.setEnabled(val)"
          />
        </SettingsRow>
        <SettingsRow
          :label="t('MultiWindowSettings.auxWindow.autoShow.label')"
          :label-description="t('MultiWindowSettings.auxWindow.autoShow.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="aws.settings.autoShow"
            @update:value="(val) => wm.auxWindow.setAutoShow(val)"
          />
        </SettingsRow>
        <SettingsRow
          :label="t('MultiWindowSettings.auxWindow.opacity.label')"
          :label-description="t('MultiWindowSettings.auxWindow.opacity.description')"
          :label-width="400"
        >
          <NSlider
            class="w-48!"
            size=""
            :min="0.3"
            :max="1"
            :step="0.01"
            :format-tooltip="(v) => `${(v * 100).toFixed()}%`"
            @update:value="(val) => wm.auxWindow.setOpacity(val)"
            :value="aws.settings.opacity"
          ></NSlider>
        </SettingsRow>
        <SettingsRow
          :label="t('MultiWindowSettings.auxWindow.showSkinSelector.label')"
          :label-description="t('MultiWindowSettings.auxWindow.showSkinSelector.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="aws.settings.showSkinSelector"
            @update:value="(val) => wm.auxWindow.setShowSkinSelector(val)"
          />
        </SettingsRow>
        <SettingsRow
          :label="t('MultiWindowSettings.auxWindow.resetWindowPosition.label')"
          :label-description="t('MultiWindowSettings.auxWindow.resetWindowPosition.description')"
          :label-width="400"
        >
          <NButton
            size="small"
            type="warning"
            secondary
            @click="() => wm.auxWindow.resetPosition()"
            >{{ t('MultiWindowSettings.auxWindow.resetWindowPosition.button') }}</NButton
          >
        </SettingsRow>
      </SettingsSection>
      <SettingsSection :title="t('MultiWindowSettings.opggWindow.title')">
        <SettingsRow :label="t('MultiWindowSettings.opggWindow.enabled.label')" :label-width="400">
          <template #labelDescription>
            <div>{{ t('MultiWindowSettings.opggWindow.enabled.description') }}</div>
            <div>
              <TranslationComponent
                :translation="t('MultiWindowSettings.opggWindow.enabled.descriptionWithIcon')"
              >
                <template #icon>
                  <OpggIcon class="inline-block size-4 align-middle text-black dark:text-white" />
                </template>
              </TranslationComponent>
            </div>
          </template>
          <NSwitch
            size="small"
            :value="ows.settings.enabled"
            @update:value="(val) => wm.opggWindow.setEnabled(val)"
          />
        </SettingsRow>
        <SettingsRow
          :label="t('MultiWindowSettings.opggWindow.autoShow.label')"
          :label-description="t('MultiWindowSettings.opggWindow.autoShow.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="ows.settings.autoShow"
            @update:value="(val) => wm.opggWindow.setAutoShow(val)"
          />
        </SettingsRow>
        <SettingsRow
          :disabled="!as.nativeSupport.nativeInput.available"
          :label-width="400"
          :label="t('MultiWindowSettings.opggWindow.showShortcut.label')"
          :label-description="t('MultiWindowSettings.opggWindow.showShortcut.description')"
        >
          <ShortcutSelector
            :target-id="AkariOpggWindow.SHOW_WINDOW_SHORTCUT_TARGET_ID"
            :shortcut-id="ows.settings.showShortcut"
            @update:shortcut-id="(id) => wm.opggWindow.setShowShortcut(id)"
          />
        </SettingsRow>
        <SettingsRow
          :label="t('MultiWindowSettings.opggWindow.opacity.label')"
          :label-description="t('MultiWindowSettings.opggWindow.opacity.description')"
          :label-width="400"
        >
          <NSlider
            class="w-48!"
            size=""
            :min="0.3"
            :max="1"
            :step="0.01"
            :format-tooltip="(v) => `${(v * 100).toFixed()}%`"
            @update:value="(val) => wm.opggWindow.setOpacity(val)"
            :value="ows.settings.opacity"
          ></NSlider>
        </SettingsRow>
        <SettingsRow
          :label="t('MultiWindowSettings.opggWindow.resetWindowPosition.label')"
          :label-description="t('MultiWindowSettings.opggWindow.resetWindowPosition.description')"
          :label-width="400"
        >
          <NButton
            size="small"
            type="warning"
            secondary
            @click="() => wm.opggWindow.resetPosition()"
            >{{ t('MultiWindowSettings.opggWindow.resetWindowPosition.button') }}</NButton
          >
        </SettingsRow>
      </SettingsSection>
      <SettingsSection
        :title="
          as.isElevated
            ? t('MultiWindowSettings.ongoingGameWindow.title')
            : t('MultiWindowSettings.ongoingGameWindow.titleRequireAdmin')
        "
      >
        <SettingsRow
          :label="t('MultiWindowSettings.ongoingGameWindow.enabled.label')"
          :label-description="t('MultiWindowSettings.ongoingGameWindow.enabled.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="ogws.settings.enabled"
            @update:value="(val) => wm.ongoingGameWindow.setEnabled(val)"
          />
        </SettingsRow>
        <SettingsRow
          :disabled="!as.nativeSupport.nativeInput.available"
          :label-width="400"
          :label="t('MultiWindowSettings.ongoingGameWindow.showShortcut.label')"
          :label-description="t('MultiWindowSettings.ongoingGameWindow.showShortcut.description')"
        >
          <ShortcutSelector
            :target-id="AkariOngoingGameWindow.SHOW_WINDOW_SHORTCUT_TARGET_ID"
            :shortcut-id="ogws.settings.showShortcut"
            @update:shortcut-id="(id) => wm.ongoingGameWindow.setShowShortcut(id)"
          />
        </SettingsRow>
      </SettingsSection>
      <SettingsSection
        :title="
          as.isElevated
            ? t('MultiWindowSettings.cdTimerWindow.title')
            : t('MultiWindowSettings.cdTimerWindow.titleRequireAdmin')
        "
      >
        <SettingsRow
          :label="t('MultiWindowSettings.cdTimerWindow.enabled.label')"
          :label-description="t('MultiWindowSettings.cdTimerWindow.enabled.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="ctws.settings.enabled"
            @update:value="(val) => wm.cdTimerWindow.setEnabled(val)"
          />
        </SettingsRow>
        <SettingsRow
          :disabled="!as.nativeSupport.nativeInput.available"
          :label-width="400"
          :label="t('MultiWindowSettings.cdTimerWindow.showShortcut.label')"
          :label-description="t('MultiWindowSettings.cdTimerWindow.showShortcut.description')"
        >
          <ShortcutSelector
            :target-id="AkariCdTimerWindow.SHOW_WINDOW_SHORTCUT_TARGET_ID"
            :shortcut-id="ctws.settings.showShortcut"
            @update:shortcut-id="(id) => wm.cdTimerWindow.setShowShortcut(id)"
          />
        </SettingsRow>
        <SettingsRow
          :label="t('MultiWindowSettings.cdTimerWindow.timerType.label')"
          :label-description="t('MultiWindowSettings.cdTimerWindow.timerType.description')"
          :label-width="400"
        >
          <NRadioGroup
            size="small"
            :value="ctws.settings.timerType"
            @update:value="(val) => wm.cdTimerWindow.setTimerType(val)"
          >
            <div class="flex flex-wrap justify-end gap-x-3 gap-y-1">
              <NRadio value="countdown">{{
                t('MultiWindowSettings.cdTimerWindow.timerType.options.countdown')
              }}</NRadio>
              <NRadio value="countup">{{
                t('MultiWindowSettings.cdTimerWindow.timerType.options.countup')
              }}</NRadio>
            </div>
          </NRadioGroup>
        </SettingsRow>
        <SettingsRow
          :label="t('MultiWindowSettings.cdTimerWindow.reverseAdjustmentDirection.label')"
          :label-description="
            t('MultiWindowSettings.cdTimerWindow.reverseAdjustmentDirection.description')
          "
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="ctws.settings.reverseAdjustmentDirection"
            @update:value="(val) => wm.cdTimerWindow.setReverseAdjustmentDirection(val)"
          />
        </SettingsRow>
        <template #footer>
          <div class="text-[11px] leading-4 text-black/50 dark:text-white/50">
            {{ t('MultiWindowSettings.cdTimerWindow.description.lineA') }}
          </div>
          <div
            class="mt-0.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-[11px] leading-4"
          >
            <span class="font-medium text-black/65 dark:text-white/65">{{
              t('MultiWindowSettings.cdTimerWindow.description.leftClick1')
            }}</span>
            <span>{{ t('MultiWindowSettings.cdTimerWindow.description.leftClick2') }}</span>
            <span class="font-medium text-black/65 dark:text-white/65">{{
              t('MultiWindowSettings.cdTimerWindow.description.rightDoubleClick1')
            }}</span>
            <span>{{ t('MultiWindowSettings.cdTimerWindow.description.rightDoubleClick2') }}</span>
            <span class="font-medium text-black/65 dark:text-white/65">{{
              t('MultiWindowSettings.cdTimerWindow.description.wheel1')
            }}</span>
            <span>{{ t('MultiWindowSettings.cdTimerWindow.description.wheel2') }}</span>
          </div>
        </template>
      </SettingsSection>
    </div>
  </NScrollbar>
</template>

<script setup lang="ts">
import OpggIcon from '@renderer-shared/assets/icon/OpggIcon.vue'
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import {
  AkariCdTimerWindow,
  AkariOpggWindow,
  WindowManagerRenderer
} from '@renderer-shared/shards/window-manager'
import { AkariOngoingGameWindow } from '@renderer-shared/shards/window-manager'
import {
  useAuxWindowStore,
  useCdTimerWindowStore,
  useOngoingGameWindowStore,
  useOpggWindowStore
} from '@renderer-shared/shards/window-manager/store'
import { Window24Filled as Window24FilledIcon } from '@vicons/fluent'
import { TranslationComponent, useTranslation } from 'i18next-vue'
import { NButton, NIcon, NRadio, NRadioGroup, NScrollbar, NSlider, NSwitch } from 'naive-ui'

import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'

const { t } = useTranslation()

const as = useAppCommonStore()
const aws = useAuxWindowStore()
const ows = useOpggWindowStore()
const ogws = useOngoingGameWindowStore()
const ctws = useCdTimerWindowStore()

const wm = useInstance(WindowManagerRenderer)
</script>
