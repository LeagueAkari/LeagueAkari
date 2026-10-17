<template>
  <div class="flex min-w-0 items-center gap-2 text-xs">
    <AugmentDisplay :augment-id="augmentId" :size="24" class="shrink-0" />
    <span class="truncate">{{ name }}</span>
  </div>
</template>

<script setup lang="ts">
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { computed } from 'vue'

const { augmentId } = defineProps<{ augmentId: number }>()

const resources = useAkariResourceProvider()

const name = computed(() => resources.augments.name(augmentId))
</script>
