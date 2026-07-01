<template>
  <NPopover :delay="delay" :keep-alive-on-hover="keepAliveOnHover">
    <template #trigger>
      <slot />
    </template>
    <AkariScorePopoverContent :score="score" :total-precision="totalPrecision" />
  </NPopover>
</template>

<script setup lang="ts">
import type { AkariScore } from '@shared/data-adapter/analysis/player'
import { NPopover } from 'naive-ui'

import AkariScorePopoverContent from './AkariScorePopoverContent.vue'

withDefaults(
  defineProps<{
    score: AkariScore
    delay?: number
    keepAliveOnHover?: boolean
    totalPrecision?: number
  }>(),
  {
    delay: 50,
    keepAliveOnHover: false,
    totalPrecision: 2
  }
)
</script>
