<template>
  <svg
    :width="width"
    :height="height"
    class="damage-bar-svg"
    :style="{ borderRadius: borderRadius + 'px' }"
  >
    <rect x="0" y="0" :width="width" :height="height" class="bg" />
    <rect
      v-for="(dmg, index) in ordered"
      :key="index"
      :x="dmg.x"
      y="0"
      :height="height"
      :width="dmg.width"
      :class="{
        'magic-damage': dmg.type === 'magic',
        'physical-damage': dmg.type === 'physical',
        'true-damage': dmg.type === 'true'
      }"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const {
  baselineDamage = 1,
  magicDamage = 0,
  physicalDamage = 0,
  trueDamage = 0,
  width = 52,
  height = 6,
  borderRadius = 3
} = defineProps<{
  physicalDamage?: number
  magicDamage?: number
  trueDamage?: number
  baselineDamage?: number
  width?: number
  height?: number
  borderRadius?: number
}>()

const calcMetricBar = (baseWidth: number) => {
  const list = [
    {
      type: 'physical',
      x: 0,
      width: (physicalDamage / (baselineDamage || 1)) * baseWidth
    },
    { type: 'magic', x: 0, width: (magicDamage / (baselineDamage || 1)) * baseWidth },
    { type: 'true', x: 0, width: (trueDamage / (baselineDamage || 1)) * baseWidth }
  ].sort((d1, d2) => d2.width - d1.width)

  for (let i = 1; i < list.length; i++) {
    list[i].x = list[i - 1].x + list[i - 1].width
  }

  return list
}

const ordered = computed(() => {
  return calcMetricBar(width)
})
</script>

<style scoped>
.damage-bar-svg {
  overflow: hidden;
}

.physical-damage {
  fill: #e07856;
}

.magic-damage {
  fill: #5b9fd7;
}

.true-damage {
  fill: #a8a8a8;
}

.bg {
  fill: #e5e5e5;
}

[data-theme='dark'] .bg {
  fill: #3a3a3a;
}
</style>
