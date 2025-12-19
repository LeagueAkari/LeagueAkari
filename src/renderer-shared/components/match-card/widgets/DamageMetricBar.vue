<template>
  <NPopover :delay="50" :show-arrow="false">
    <template #trigger>
      <div class="flex flex-col items-center text-[11px]">
        <div>{{ formatExtremeNumber(totalDamage || 0) }}</div>
        <svg :width="width" :height="height" class="damage-bar-svg">
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
      </div>
    </template>
    <div class="min-w-[204px] text-[11px]">
      <div class="flex items-center">
        <svg :width="INNER_WIDTH" :height="height" class="damage-bar-svg">
          <rect x="0" y="0" :width="INNER_WIDTH" :height="height" class="bg" />
          <rect
            v-for="(dmg, index) in orderedInner"
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
        <div class="ml-2">{{ ((totalDamage / (baselineDamage || 1)) * 100).toFixed(2) }}%</div>
      </div>
      <div class="my-1 h-px bg-gray-300 dark:bg-gray-700"></div>
      <div class="grid grid-cols-2 grid-rows-1 gap-1">
        <div>
          <div class="text-[11px] font-bold">{{ t('DamageMetricsBar.total') }}</div>
          <div>{{ totalDamage.toLocaleString() }}</div>
        </div>
        <div>
          <div class="text-[11px] font-bold">
            {{ t('DamageMetricsBar.physical') }} ({{
              ((physicalDamage / (totalDamage || 1)) * 100).toFixed()
            }}%)
          </div>
          <div>{{ physicalDamage.toLocaleString() }}</div>
        </div>
        <div>
          <div class="text-[11px] font-bold">
            {{ t('DamageMetricsBar.magic') }} ({{
              ((magicDamage / (totalDamage || 1)) * 100).toFixed()
            }}%)
          </div>
          <div>{{ magicDamage.toLocaleString() }}</div>
        </div>
        <div>
          <div class="text-[11px] font-bold">
            {{ t('DamageMetricsBar.true') }} ({{
              ((trueDamage / (totalDamage || 1)) * 100).toFixed()
            }}%)
          </div>
          <div>{{ trueDamage.toLocaleString() }}</div>
        </div>
      </div>
    </div>
  </NPopover>
</template>

<script setup lang="ts">
import { useNumberFormatter } from '@renderer-shared/composables/useNumberFormatter'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

const { t } = useTranslation()

const {
  baselineDamage = 1,
  magicDamage = 0,
  physicalDamage = 0,
  totalDamage = 1,
  trueDamage = 0,
  width = 52,
  height = 6
} = defineProps<{
  physicalDamage?: number
  magicDamage?: number
  trueDamage?: number
  totalDamage?: number
  baselineDamage?: number
  width?: number
  height?: number
}>()

const INNER_WIDTH = 140

const { formatExtremeNumber } = useNumberFormatter()

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

const orderedInner = computed(() => {
  return calcMetricBar(INNER_WIDTH)
})
</script>

<style scoped>
.damage-bar-svg {
  border-radius: 3px;
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

.divider {
  height: 1px;
  background-color: rgb(200, 200, 200);
  margin: 4px 0;
}

[data-theme='dark'] .divider {
  background-color: rgb(107, 107, 107);
}
</style>
