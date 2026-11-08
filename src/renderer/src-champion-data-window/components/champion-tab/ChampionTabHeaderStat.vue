<template>
  <div class="min-w-16">
    <div class="text-[11px] leading-4 whitespace-nowrap text-black/65 dark:text-white/65">
      {{ label }}
    </div>
    <div class="text-sm leading-5 font-bold tabular-nums" :style="color ? { color } : undefined">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{ label: string; color?: string }>()
</script>
