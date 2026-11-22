<template>
  <div
    role="status"
    :aria-busy="loading"
    class="flex min-h-24 flex-col justify-center gap-3 px-3 py-4"
  >
    <div class="flex items-center gap-2 text-xs leading-5 text-black/55 dark:text-white/55">
      <NSpin v-if="loading" size="small" />
      <span>{{ description }}</span>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { NSpin } from 'naive-ui'

defineProps<{ description: string; loading?: boolean }>()
</script>
