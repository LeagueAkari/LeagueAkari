<template>
  <button
    type="button"
    class="champion-link"
    :disabled="disabled"
    @click="emit('select', championId)"
  >
    <LcuImage :src="resources.champions.icon(championId)?.iconPath" class="size-6 shrink-0" />
    <span class="truncate">{{ resources.champions.name(championId) }}</span>
  </button>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'

defineProps<{ championId: number; disabled?: boolean }>()

const emit = defineEmits<{ select: [championId: number] }>()

const resources = useAkariResourceProvider()
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.champion-link {
  @apply m-0 inline-flex min-w-0 cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-left text-inherit transition-[filter] duration-200 hover:brightness-120 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-default disabled:opacity-50 disabled:hover:brightness-100;
  font: inherit;
}
</style>
