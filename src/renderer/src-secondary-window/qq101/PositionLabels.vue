<template>
  <span
    class="inline-flex min-h-4 min-w-0 items-center gap-1 overflow-hidden text-[10px] opacity-45"
  >
    <template v-for="(position, index) in positions" :key="position.value">
      <span v-if="index" aria-hidden="true">/</span>
      <span class="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap">
        <PositionIcon :position="position.value" class="shrink-0 text-[1em]" />
        <span>{{ position.label }}</span>
      </span>
    </template>
  </span>
</template>
<script setup lang="ts">
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'

defineProps<{ positions: { value: string; label: string }[] }>()
</script>
