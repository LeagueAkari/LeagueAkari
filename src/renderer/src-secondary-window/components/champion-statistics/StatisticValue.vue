<template>
  <div
    class="flex items-center text-xs tabular-nums"
    :class="inline ? 'gap-1 whitespace-nowrap' : 'min-w-19 flex-col text-center'"
  >
    <span v-if="inline && label" class="text-[#666666] dark:text-[#bebebe]">{{ label }}</span>
    <span
      class="font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
      :style="color ? { color } : undefined"
      ><slot
    /></span>
    <span
      v-if="inline && $slots.caption"
      class="text-black/30 dark:text-white/30"
      aria-hidden="true"
      >·</span
    >
    <span v-if="$slots.caption" class="text-[#666666] dark:text-[#bebebe]"
      ><slot name="caption"
    /></span>
  </div>
</template>
<script setup lang="ts">
defineProps<{ color?: string; inline?: boolean; label?: string }>()
</script>
