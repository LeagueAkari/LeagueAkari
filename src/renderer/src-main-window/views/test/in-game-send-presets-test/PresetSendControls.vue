<template>
  <div class="pt-4">
    <ControlItem v-for="target of targets" :key="target.id" :label-width="160" align="center">
      <template #label>
        <div class="flex items-center gap-1.5">
          <NIcon><component :is="target.icon" /></NIcon>
          <span>{{ target.label }}</span>
        </div>
      </template>
      <template #labelDescription>
        <span class="text-[11px]">{{ target.description }}</span>
      </template>

      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-black/60 dark:text-white/60">快捷键</span>
          <ShortcutSelector
            :shortcut-id="shortcuts[target.id]"
            :target-id="`demo:${preset.id}:${target.id}`"
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
              @click="send(target)"
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
            <NButton size="small" secondary @click="dryRun(target)">
              <template #icon>
                <NIcon><DryRunIcon /></NIcon>
              </template>
              试运行
            </NButton>
          </template>
          生成发送内容并在下方预览, 不会写入客户端
        </NPopover>
      </div>
    </ControlItem>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { DocumentText24Regular as DryRunIcon, Send24Filled as SendIcon } from '@vicons/fluent'
import { NButton, NDivider, NIcon, NPopover } from 'naive-ui'

import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'

import { useCurrentPreset } from './context'

const {
  preset,
  targets,
  shortcuts,
  canSend,
  sendButtonText,
  sendDisabledReason,
  setShortcut,
  send,
  dryRun
} = useCurrentPreset()
</script>
