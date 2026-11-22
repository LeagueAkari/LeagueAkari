<template>
  <div class="flex min-w-0 flex-wrap items-center gap-1">
    <div v-for="(item, index) in items" :key="index" class="inline-flex items-center gap-1">
      <NIcon
        v-if="ordered && index > 0"
        class="shrink-0 text-[10px] text-[#999999] dark:text-[#909090]"
        aria-hidden="true"
      >
        <ArrowForwardIosOutlined />
      </NIcon>

      <slot :item="item" :index="index" />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import { ArrowForwardIosOutlined } from '@vicons/material'
import { NIcon } from 'naive-ui'

defineProps<{
  items: readonly T[]
  ordered?: boolean
}>()
</script>
