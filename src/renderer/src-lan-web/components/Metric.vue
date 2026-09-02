<template>
  <div class="rounded-md bg-black/5 px-2 py-1.5 dark:bg-white/5">
    <div class="truncate text-[10px] opacity-50">{{ label }}</div>
    <div class="mt-0.5 truncate text-sm font-semibold tabular-nums">{{ value }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string }>()
</script>
