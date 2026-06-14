<template>
  <NCollapseTransition :show="!!previewedLines">
    <div class="pt-3">
      <div
        class="rounded border border-black/10 bg-black/5 p-3 text-xs dark:border-white/10 dark:bg-white/5"
      >
        <div class="mb-1.5 flex items-center justify-between">
          <div class="font-semibold opacity-80">
            {{
              t('title', {
                preset: props.presetLabel,
                target: previewTargetLabel
              })
            }}
          </div>
          <NButton size="tiny" quaternary @click="closePreview()">{{ t('close') }}</NButton>
        </div>
        <div class="flex flex-col gap-1 font-mono">
          <div
            v-for="(line, idx) of previewedLines?.lines || []"
            :key="idx"
            class="flex items-baseline gap-2"
          >
            <span class="w-5 shrink-0 text-right tabular-nums opacity-40">
              {{ idx + 1 }}
            </span>
            <span class="flex-1">{{ line }}</span>
          </div>
        </div>
      </div>
    </div>
  </NCollapseTransition>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { NButton, NCollapseTransition } from 'naive-ui'
import { computed } from 'vue'

import type { PresetScopeContext } from '../data/shared'
import { usePresetTargets } from './usePresetTargets'

const props = defineProps<{
  preset: PresetScopeContext
  presetLabel: string
}>()

const { previewedLines, closePreview } = props.preset
const { t } = useTranslation('renderer', { keyPrefix: 'InGameSend.presets.preview' })

const targets = usePresetTargets()

const previewTargetLabel = computed(() => {
  const preview = previewedLines.value
  if (!preview) return ''

  return targets.value.find((target) => target.id === preview.targetId)?.label ?? preview.targetId
})
</script>
