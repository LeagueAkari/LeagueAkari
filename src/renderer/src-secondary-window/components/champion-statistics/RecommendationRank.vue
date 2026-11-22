<template>
  <div class="min-w-4 shrink-0 text-[10px] text-[#666666] dark:text-[#b2b2b2]">#{{ rank }}</div>
</template>
<script setup lang="ts">
defineProps<{ rank: number | null }>()
</script>
