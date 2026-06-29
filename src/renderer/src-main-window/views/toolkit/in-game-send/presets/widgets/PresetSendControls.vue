<template>
  <div class="pt-4">
    <SettingsRow
      v-for="target of targets"
      :key="target.id"
      :label-width="160"
      :label-description="target.description"
      align="center"
      no-x-padding
    >
      <template #label>
        <div class="flex items-center gap-1.5">
          <NIcon><component :is="target.icon" /></NIcon>
          <span>{{ target.label }}</span>
        </div>
      </template>

      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-black/60 dark:text-white/60">{{ t('shortcut') }}</span>
          <ShortcutSelector
            :shortcut-id="shortcuts[target.id]"
            :target-id="shortcutTargetIds[target.id]"
            @update:shortcut-id="(shortcutId) => setShortcut(target.id, shortcutId)"
          />
        </div>
        <NDivider vertical />
        <NPopover :disabled="canSend" trigger="hover">
          <template #trigger>
            <NButton
              size="small"
              :type="target.buttonType"
              :disabled="!canSend"
              @click="handleSend(target)"
            >
              <template #icon>
                <NIcon><SendIcon /></NIcon>
              </template>
              {{ sendButtonText }}
            </NButton>
          </template>
          {{ sendDisabledReason }}
        </NPopover>
        <NPopover trigger="hover">
          <template #trigger>
            <NButton size="small" secondary @click="dryRun(target.id)">
              <template #icon>
                <NIcon><DryRunIcon /></NIcon>
              </template>
              {{ t('dryRun') }}
            </NButton>
          </template>
          {{ t('dryRunDescription') }}
        </NPopover>
      </div>
    </SettingsRow>

    <!-- 仅用于触发上面的 border-b -->
    <span hidden aria-hidden="true"></span>
  </div>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import { DocumentText24Regular as DryRunIcon, Send24Filled as SendIcon } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NDivider, NIcon, NPopover, useMessage } from 'naive-ui'
import { computed } from 'vue'

import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'

import { useNativeInputStatus } from '../composables/useNativeInputStatus'
import type { PresetScopeContext } from '../data/shared'
import { usePresetTargets, type PresetTarget } from './usePresetTargets'

const props = defineProps<{
  preset: PresetScopeContext
  presetLabel: string
}>()

const message = useMessage()

const { unavailableReason: nativeInputUnavailableMessage } = useNativeInputStatus()
const { shortcutTargetIds, shortcuts, gamePhase, canSend, setShortcut, send, dryRun } = props.preset

const targets = usePresetTargets()

const { t } = useTranslation('renderer', { keyPrefix: 'toolkit.inGameSend.presets.controls' })

const sendButtonText = computed(() => {
  if (gamePhase.value === 'in-game') {
    return t('sendToGame')
  }

  if (gamePhase.value === 'lobby' || gamePhase.value === 'champ-select') {
    return t('sendToChat')
  }

  return t('send')
})

const sendDisabledReason = computed(() => {
  if (gamePhase.value === 'draft') {
    return t('disabled.draftOnly')
  }

  if (gamePhase.value === 'in-game' && nativeInputUnavailableMessage.value) {
    return nativeInputUnavailableMessage.value
  }

  return t('disabled.unavailable')
})

async function handleSend(target: PresetTarget) {
  const sent = await send(target.id)

  if (sent) {
    message.success(t('sendSucceeded', { preset: props.presetLabel, target: target.label }))
  }
}
</script>
