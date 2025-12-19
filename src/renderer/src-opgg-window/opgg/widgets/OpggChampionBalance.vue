<template>
  <div
    class="mb-1 rounded border border-black/10 p-2 last:mb-0 dark:border-white/10"
    v-if="balance"
  >
    <div
      class="mb-2 flex items-center justify-between text-[13px] font-bold text-black dark:text-white"
    >
      {{ t('OpggChampion.balance.title') }}
    </div>

    <div class="grid grid-cols-4 gap-y-2">
      <div
        v-for="item in balanceItems"
        class="relative flex flex-col gap-1 pl-2 before:absolute before:top-0 before:bottom-0 before:left-0 before:w-px before:bg-black/10 before:content-[''] dark:before:bg-white/10"
      >
        <div class="truncate text-xs text-black/60 dark:text-white/60">
          {{ t(`OpggChampion.balance.${item.key}`) }}
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
import { useOpggStore } from '@opgg-window/shards/opgg/store'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import { useOpgg } from '../context'

const store = useOpggStore()
const { champion, mode } = useOpgg()

const { t } = useTranslation()

const balance = computed(() => {
  if (!champion.value || mode.value !== 'aram') {
    return null
  }

  return store.aramBalance[champion.value.data.summary.id]
})

const PREDEFINED = {
  attack_speed: {
    type: 'buff',
    display: 'percentage',
    order: 2
  },
  damage_dealt: {
    type: 'buff',
    display: 'percentage',
    order: 0
  },
  damage_taken: {
    type: 'nerf',
    display: 'percentage',
    order: 1
  },
  cooldown_reduction: {
    type: 'buff',
    display: 'literal',
    order: 3
  },
  healing: {
    type: 'buff',
    display: 'percentage',
    order: 4
  },
  tenacity: {
    type: 'buff',
    display: 'literal',
    order: 5
  },
  shield_amount: {
    type: 'buff',
    display: 'percentage',
    order: 6
  },
  energy_regen: {
    type: 'buff',
    display: 'percentage',
    order: 7
  },
  area_of_effect_damage: {
    type: 'buff',
    display: 'percentage',
    order: 8
  }
}

const formatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero'
})

const balanceItems = computed(() => {
  if (!balance.value) {
    return []
  }

  const b = balance.value

  const mapped = Object.entries(PREDEFINED).map(([key, { type, display, order }]) => {
    const value = b[key] as number

    if (value === undefined) {
      return null
    }

    if (display === 'literal') {
      if (value === 0) {
        return null
      }

      return {
        key,
        effect:
          type === 'buff' ? (value > 0 ? 'buffed' : 'nerfed') : value > 0 ? 'nerfed' : 'buffed',
        display,
        order,
        relativeValueText: formatter.format(value)
      }
    }

    if (value === 100) {
      return null
    }

    return {
      key,
      effect:
        type === 'buff' ? (value > 100 ? 'buffed' : 'nerfed') : value > 100 ? 'nerfed' : 'buffed',
      display,
      order,
      relativeValueText: formatter.format(value - 100) + '%'
    }
  })

  return mapped.filter((v) => v !== null).toSorted((a, b) => a.order - b.order)
})
</script>
