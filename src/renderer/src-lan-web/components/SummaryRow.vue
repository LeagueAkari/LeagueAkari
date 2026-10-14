<template>
  <div class="flex items-start gap-2 text-xs">
    <span class="opacity-60">{{ label }}</span>
    <span class="ml-auto text-right tabular-nums" :class="{ 'font-semibold': strong }">{{
      value
    }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string; strong?: boolean }>()
</script>
