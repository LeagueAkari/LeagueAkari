<template>
  <div
    class="mb-1 rounded border border-black/10 p-2 last:mb-0 dark:border-white/10"
    v-if="balance && balanceItems.length"
  >
    <div
      class="mb-2 flex items-center justify-between text-[13px] font-bold text-black dark:text-white"
    >
      {{ t('opgg.champion.balance.title') }}
    </div>

    <div class="grid grid-cols-4 gap-y-2">
      <div
        v-for="item in balanceItems"
        :key="item.type"
        class="relative flex flex-col pl-2 before:absolute before:top-0 before:bottom-0 before:left-0 before:w-px before:bg-black/10 before:content-[''] dark:before:bg-white/10"
      >
        <div class="truncate text-xs text-black/60 dark:text-white/60">
          {{ t(`opgg.champion.balance.${item.field}`) }}
        </div>
        <div
          class="text-sm font-bold"
          :class="{
            'text-green-600 dark:text-green-400': item.effect === 'buffed',
            'text-red-700 dark:text-red-400': item.effect === 'nerfed'
          }"
        >
          {{ item.relativeValueText }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { getOpggAramBalanceAdjustments } from '@shared/data-adapter/opgg-aram-balance'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import { useOpgg } from '../context'

const resources = useAkariResourceProvider()
const { champion, mode } = useOpgg()

const { t } = useTranslation()

const balance = computed(() => {
  if (!champion.value || mode.value !== 'aram') {
    return null
  }

  return resources.champions.aramBalance(champion.value.data.summary.id)
})

const formatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero'
})

const balanceItems = computed(() => {
  if (!balance.value) {
    return []
  }

  return getOpggAramBalanceAdjustments(balance.value).map((adjustment) => ({
    ...adjustment,
    relativeValueText:
      adjustment.display === 'literal'
        ? formatter.format(adjustment.value)
        : formatter.format(adjustment.value - 100) + '%'
  }))
})
</script>
