<template>
  <NPopover :delay="50" :show-arrow="false">
    <template #trigger>
      <div class="flex flex-col items-center text-[11px]">
        <div>{{ formatExtremeNumber(totalDamage || 0) }}</div>
        <DamageBar
          :physical-damage="physicalDamage"
          :magic-damage="magicDamage"
          :true-damage="trueDamage"
          :baseline-damage="baselineDamage"
          :width="width"
          :height="height"
        />
      </div>
    </template>
    <div class="min-w-[204px] text-[11px]">
      <div class="flex items-center">
        <DamageBar
          :physical-damage="physicalDamage"
          :magic-damage="magicDamage"
          :true-damage="trueDamage"
          :baseline-damage="baselineDamage"
          :width="INNER_WIDTH"
          :height="height"
        />
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

import DamageBar from './DamageBar.vue'

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
</script>

<style scoped>
.divider {
  height: 1px;
  background-color: rgb(200, 200, 200);
  margin: 4px 0;
}

[data-theme='dark'] .divider {
  background-color: rgb(107, 107, 107);
}
</style>
