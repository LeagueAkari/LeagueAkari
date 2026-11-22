<template>
  <span v-if="tier == null" :style="{ color: colors.color }">-</span>
  <span
    v-else
    class="relative inline-flex h-7 w-6 shrink-0 items-center justify-center align-middle"
    :style="{ color: colors.color }"
  >
    <svg class="absolute inset-0 size-full" viewBox="0 0 28 32" aria-hidden="true">
      <path
        d="M7 2h14a4 4 0 0 1 4 4v15.5a4 4 0 0 1-2 3.5l-7 4a4 4 0 0 1-4 0l-7-4a4 4 0 0 1-2-3.5V6a4 4 0 0 1 4-4Z"
        fill="currentColor"
      />
    </svg>
    <span
      class="relative pb-0.5 leading-none font-bold tabular-nums"
      :class="tier === 0 ? 'text-[11px]' : 'text-xs'"
      :style="{ color: colors.badgeTextColor }"
    >
      {{ tier === 0 ? 'OP' : tier }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useTierTheme } from './theme'

const props = defineProps<{ tier: number | null | undefined }>()
const { getTierColors } = useTierTheme()
const colors = computed(() => getTierColors(props.tier))
</script>
