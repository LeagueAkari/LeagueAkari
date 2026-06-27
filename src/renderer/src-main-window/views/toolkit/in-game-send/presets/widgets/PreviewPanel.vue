<template>
  <NCollapseTransition :show="!!previewedLines">
    <div class="pt-3">
      <div
        class="rounded border p-3 text-xs"
        :class="
          hasPreviewLines
            ? 'border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5'
            : 'border-dashed border-black/10 bg-transparent text-black/45 dark:border-white/10 dark:text-white/45'
        "
      >
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div class="font-semibold text-black/75 dark:text-white/80">
            {{ t('title') }}
          </div>

          <div class="flex shrink-0 items-center gap-1">
            <NButton size="tiny" quaternary :disabled="!previewText" @click="handleCopy">
              <template #icon>
                <NIcon><CopyIcon /></NIcon>
              </template>
              {{ t('copy') }}
            </NButton>
            <NButton size="tiny" quaternary @click="closePreview()">{{ t('close') }}</NButton>
          </div>
        </div>
        <div v-if="hasPreviewLines" class="flex flex-col gap-1 font-mono select-text">
          <div
            v-for="(line, idx) of previewedLines?.lines || []"
            :key="idx"
            class="flex items-baseline gap-2"
          >
            <span class="min-w-[2ch] shrink-0 text-right tabular-nums opacity-40">
              {{ idx + 1 }}
            </span>
            <span class="flex-1">{{ line }}</span>
          </div>
        </div>
        <div v-else class="py-2 text-center">
          {{ t('empty') }}
        </div>
      </div>
    </div>
  </NCollapseTransition>
</template>

<script setup lang="ts">
import { Copy24Regular as CopyIcon } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NCollapseTransition, NIcon, useMessage } from 'naive-ui'
import { computed } from 'vue'

import { writeClipboardText } from '@renderer-shared/utils/clipboard'

import type { PresetScopeContext } from '../data/shared'

const props = defineProps<{
  preset: PresetScopeContext
}>()

const { previewedLines, closePreview } = props.preset
const { t } = useTranslation('renderer', { keyPrefix: 'InGameSend.presets.preview' })
const message = useMessage()

const previewText = computed(() => previewedLines.value?.lines.join('\n') ?? '')
const hasPreviewLines = computed(() => (previewedLines.value?.lines.length ?? 0) > 0)

async function handleCopy() {
  if (!previewText.value) {
    return
  }

  try {
    await writeClipboardText(previewText.value)
    message.success(t('copied'))
  } catch (error) {
    message.error(t('copyFailed'))
  }
}
</script>
