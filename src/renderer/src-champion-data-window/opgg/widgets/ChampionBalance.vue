<template>
  <SettingsSection v-if="balanceItems.length" :title="t('opgg.champion.balance.title')">
    <div class="p-3">
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
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import { useOpgg } from '../context'

const { champion } = useOpgg()

const { t } = useTranslation()

const formatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero'
})

const balanceItems = computed(() =>
  (champion.value?.balance ?? []).map((adjustment) => ({
    ...adjustment,
    relativeValueText:
      formatter.format(adjustment.relativeValue) + (adjustment.display === 'percentage' ? '%' : '')
  }))
)
</script>
