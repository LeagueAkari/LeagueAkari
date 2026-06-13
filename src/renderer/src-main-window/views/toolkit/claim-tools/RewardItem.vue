<template>
  <NPopover placement="right-end" :delay="500">
    <template #trigger>
      <div class="flex w-16 flex-col gap-1">
        <LcuImage class="aspect-square w-8 self-center object-cover" :src="iconUrl" />
        <div class="line-clamp-2 overflow-hidden text-center text-[10px]">{{ name }}</div>
      </div>
    </template>
    <div>
      <LcuImage class="mb-1 w-32" :src="iconUrl" />
      <div class="text-center">{{ name }}</div>
    </div>
  </NPopover>
</template>

<script lang="ts" setup>
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { NPopover } from 'naive-ui'

const { name = '' } = defineProps<{
  iconUrl?: string
  name?: string
}>()
</script>
