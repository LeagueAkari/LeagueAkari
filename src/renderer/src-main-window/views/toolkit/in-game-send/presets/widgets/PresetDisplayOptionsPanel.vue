<template>
  <div class="preset-display-options-panel pt-3">
    <div class="mb-2 text-xs font-semibold text-black/70 dark:text-white/70">
      {{ title }}
    </div>
    <NCheckboxGroup :value="selectedValues" @update:value="handleUpdate">
      <div class="preset-display-options-grid grid grid-cols-3 gap-2">
        <NCheckbox v-for="option of options" :key="option.value" :value="option.value">
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
</template>

<script setup lang="ts">
import { NCheckbox, NCheckboxGroup } from 'naive-ui'
import { computed } from 'vue'

import type { PresetDisplayOption } from '../types'

const props = defineProps<{
  title: string
  options: PresetDisplayOption<string>[]
  selectedOptions: object
}>()

const emit = defineEmits<{
  'update:selectedOptions': [options: Record<string, boolean>]
}>()

const selectedValues = computed(() => {
  const selectedOptions = props.selectedOptions as Record<string, unknown>

  return props.options
    .filter((option) => selectedOptions[option.value] === true)
    .map((option) => option.value)
})

function handleUpdate(value: (string | number)[]) {
  const selected = new Set(value.map((item) => String(item)))
  const next: Record<string, boolean> = {}

  for (const option of props.options) {
    next[option.value] = selected.has(option.value)
  }

  emit('update:selectedOptions', next)
}
</script>

<style scoped>
.preset-display-options-panel {
  container-type: inline-size;
}

@container (max-width: 419px) {
  .preset-display-options-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
