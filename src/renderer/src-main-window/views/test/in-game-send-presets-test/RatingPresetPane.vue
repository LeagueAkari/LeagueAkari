<template>
  <div class="flex flex-col pt-2">
    <div class="text-xs leading-relaxed text-black/60 dark:text-white/70">
      {{ preset.description }}
    </div>

    <PresetSendControls />

    <div class="pt-3">
      <div class="mb-2 text-xs font-semibold text-black/70 dark:text-white/70">展示元素</div>
      <NCheckboxGroup v-model:value="selectedDisplayItems">
        <div class="grid grid-cols-2 gap-2">
          <NCheckbox v-for="option of displayOptions" :key="option.value" :value="option.value">
            <div class="flex flex-col leading-tight">
              <span class="text-xs">{{ option.label }}</span>
              <span class="text-[11px] text-black/45 dark:text-white/45">
                {{ option.description }}
              </span>
            </div>
          </NCheckbox>
        </div>
      </NCheckboxGroup>
    </div>

    <PlayerSelectionPanel />
    <PreviewPanel />
  </div>
</template>

<script setup lang="ts">
import { NCheckbox, NCheckboxGroup } from 'naive-ui'

import { provideCurrentPreset, providePlayerSelectionPreset, useRatingPreset } from './context'
import PlayerSelectionPanel from './PlayerSelectionPanel.vue'
import PresetSendControls from './PresetSendControls.vue'
import PreviewPanel from './PreviewPanel.vue'

const ratingPreset = useRatingPreset()
const { preset, displayOptions, selectedDisplayItems } = ratingPreset

provideCurrentPreset(ratingPreset)
providePlayerSelectionPreset(ratingPreset.playerSelection)
</script>
