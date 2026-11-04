<template>
  <div
    class="flex flex-col gap-1 rounded-lg border border-black/10 bg-black/5 p-3 dark:border-white/10 dark:bg-white/5"
  >
    <span class="text-xs text-black/55 dark:text-white/55">{{ label }}</span>
    <span class="text-xl font-bold text-black/85 tabular-nums dark:text-white/85">
      {{ value }}
    </span>
    <div v-if="delta" class="flex items-center gap-1 text-[11px]">
      <span :class="deltaClass">{{ delta.direction === 'up' ? '↑' : '↓' }}</span>
      <span :class="deltaClass">{{ delta.text }}</span>
      <span class="text-black/35 dark:text-white/35">{{ delta.hint }}</span>
    </div>
    <div v-else class="text-[11px] text-black/35 dark:text-white/35">{{ noDeltaText }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { SelfImprovementKpiDelta } from './types'

const props = defineProps<{
  label: string
  value: string
  delta: SelfImprovementKpiDelta | null
  noDeltaText: string
}>()

const deltaClass = computed(() =>
  props.delta?.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
)
</script>
