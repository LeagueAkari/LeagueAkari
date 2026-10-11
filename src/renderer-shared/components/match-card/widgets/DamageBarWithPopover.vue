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
    <div class="w-64 text-xs tabular-nums">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="text-gray-500 dark:text-gray-400">
            {{ t(`matchCard.damageMetrics.${metric}.total`) }}
          </div>
          <div class="mt-1 text-base font-bold">{{ totalDamage.toLocaleString() }}</div>
        </div>
        <div class="text-right">
          <div class="text-gray-500 dark:text-gray-400">
            {{ t('matchCard.damageMetrics.teamShare') }}
          </div>
          <div class="mt-1 text-base font-bold">
            {{ formatShare(totalDamage, teamTotalDamage) }}%
          </div>
        </div>
      </div>
      <div class="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
        {{
          t(`matchCard.damageMetrics.${metric}.teamTotal`, {
            total: teamTotalDamage.toLocaleString()
          })
        }}
      </div>
      <div class="my-3 h-px bg-gray-300 dark:bg-gray-700"></div>
      <div class="mb-2 flex items-center justify-between gap-2">
        <span class="font-bold">{{ t(`matchCard.damageMetrics.${metric}.composition`) }}</span>
        <span class="text-[11px] text-gray-500 dark:text-gray-400">
          {{ t('matchCard.damageMetrics.shareOfOwnTotal') }}
        </span>
      </div>
      <div class="mb-2">
        <DamageBar
          :physical-damage="physicalDamage"
          :magic-damage="magicDamage"
          :true-damage="trueDamage"
          :baseline-damage="totalDamage"
          :width="INNER_WIDTH"
          :height="8"
        />
      </div>
      <div class="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-1.5">
        <template v-for="part in damageParts" :key="part.type">
          <div class="flex items-center gap-1.5">
            <span class="size-2 shrink-0 rounded-xs" :class="part.color" />
            <span>{{ t(`matchCard.damageMetrics.${part.type}`) }}</span>
          </div>
          <div class="text-right text-gray-500 dark:text-gray-400">
            {{ part.value.toLocaleString() }}
          </div>
          <div class="text-right font-medium">{{ formatShare(part.value, totalDamage) }}%</div>
        </template>
      </div>
    </div>
  </NPopover>
</template>

<script setup lang="ts">
import { useNumberFormatter } from '@renderer-shared/composables/useNumberFormatter'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

import DamageBar from './DamageBar.vue'

const { t } = useTranslation()

const {
  baselineDamage = 1,
  magicDamage = 0,
  physicalDamage = 0,
  totalDamage = 0,
  teamTotalDamage,
  metric = 'dealt',
  trueDamage = 0,
  width = 52,
  height = 6
} = defineProps<{
  physicalDamage?: number
  magicDamage?: number
  trueDamage?: number
  totalDamage?: number
  teamTotalDamage: number
  metric?: 'dealt' | 'taken'
  baselineDamage?: number
  width?: number
  height?: number
}>()

const INNER_WIDTH = 256

const damageParts = computed(() => [
  { type: 'physical', value: physicalDamage, color: 'bg-[#e07856]' },
  { type: 'magic', value: magicDamage, color: 'bg-[#5b9fd7]' },
  { type: 'true', value: trueDamage, color: 'bg-[#a8a8a8]' }
])

const formatShare = (value: number, total: number) =>
  (total > 0 ? (value / total) * 100 : 0).toFixed(2)

const { formatExtremeNumber } = useNumberFormatter()
</script>
