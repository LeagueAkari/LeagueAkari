<template>
  <div class="h-full w-full">
    <NScrollbar class="relative h-full max-w-full">
      <div class="mx-auto max-w-215 p-6">
        <SettingsSection :title="t('presets.title')">
          <InGameSendPresetsPanel />

          <template #footer>
            <div class="flex flex-col gap-1">
              <div v-if="unavailableReason" class="text-yellow-700/80 dark:text-yellow-300/80">
                {{
                  t('presets.footer.shortcutUnavailable', {
                    reason: unavailableReason
                  })
                }}
              </div>

              <div>{{ t('presets.footer.shortcutUsage') }}</div>
              <div>{{ t('presets.footer.draftOnly') }}</div>
            </div>
          </template>
        </SettingsSection>

        <SettingsSection class="mt-4" :title="t('settings.title')">
          <SettingsRow
            :label-width="260"
            :disabled="!as.isElevated"
            :label="t('settings.cancelShortcut.label')"
            :label-description="t('settings.cancelShortcut.description')"
          >
            <ShortcutSelector
              :shortcut-id="igs.settings.cancelShortcut"
              :target-id="InGameSendRenderer.CANCEL_SHORTCUT_TARGET_ID"
              @update:shortcut-id="(id) => ig.setCancelShortcut(id)"
            />
          </SettingsRow>

          <SettingsRow
            :label-width="260"
            :label="t('settings.sendInterval.label')"
            :label-description="t('settings.sendInterval.description')"
          >
            <NInputNumber
              @update:value="(val) => ig.setSendInterval(val || 65)"
              :value="igs.settings.sendInterval"
              size="small"
              :min="10"
              :max="3500"
              :step="15"
              class="w-30!"
              secondary
              type="warning"
            ></NInputNumber>
          </SettingsRow>
        </SettingsSection>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import { useTranslation } from 'i18next-vue'
import { NInputNumber, NScrollbar } from 'naive-ui'

import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'

import InGameSendPresetsPanel from './presets/InGameSendPresetsPanel.vue'
import { useNativeInputStatus } from './presets/composables/useNativeInputStatus'

const { t } = useTranslation('renderer', { keyPrefix: 'InGameSend' })

const as = useAppCommonStore()
const igs = useInGameSendStore()
const ig = useInstance(InGameSendRenderer)

const { unavailableReason } = useNativeInputStatus()
</script>
