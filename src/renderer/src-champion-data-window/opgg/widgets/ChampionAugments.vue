<template>
  <SettingsSection
    v-if="augments && Object.keys(augments).length"
    :title="t('opgg.champion.augments')"
  >
    <template #headerSuffix>
      <NFlex :size="12" align="center" class="justify-end">
        <NRadioGroup v-model:value="augmentRarity" size="small">
          <NFlex :size="12" class="justify-end">
            <NRadio v-if="augments[1]" :value="1">
              <span class="augment-rarity-silver">
                {{ t('opgg.champion.augmentSilver') }}
              </span>
            </NRadio>
            <NRadio v-if="augments[4]" :value="4">
              <span class="augment-rarity-gold">
                {{ t('opgg.champion.augmentGold') }}
              </span>
            </NRadio>
            <NRadio v-if="augments[8]" :value="8">
              <span class="augment-rarity-prismatic">{{ t('opgg.champion.augmentPrism') }}</span>
            </NRadio>
          </NFlex>
        </NRadioGroup>
        <ExpandButton v-if="selectedAugments.length > 4" v-model:expanded="isAugmentsExpanded" />
      </NFlex>
    </template>

    <div class="p-3">
      <div
        class="mb-1 flex items-center gap-1 last:mb-0"
        v-for="(a, i) of selectedAugments.slice(0, isAugmentsExpanded ? Infinity : 4)"
        :key="a.id"
      >
        <div class="min-w-6 shrink-0 text-[10px] text-[#666666] dark:text-[#b2b2b2]">
          #{{ i + 1 }}
        </div>
        <div class="flex min-w-0 items-center gap-1">
          <AugmentDisplay :size="24" :augment-id="a.id" class="mr-1 shrink-0" />
          <span class="name truncate text-xs">{{ resources.augments.name(a.id) }}</span>
        </div>
        <div class="desc ml-auto flex shrink-0 items-center">
          <StatisticPopover
            metric="pickRate"
            :value="(a.pick_rate * 100).toFixed(2) + '%'"
            :play="a.play"
          >
            <div class="pick flex min-w-19 flex-col items-center">
              <span class="pick-rate text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
                >{{ (a.pick_rate * 100).toFixed(2) }}%</span
              >

              <span class="pick-play text-center text-xs text-[#666666] dark:text-[#bebebe]">
                {{
                  t('opgg.champion.times', {
                    times: a.play.toLocaleString()
                  })
                }}</span
              >
            </div>
          </StatisticPopover>
          <StatisticPopover
            metric="winRate"
            :value="formatWinRate(a.winRate)"
            :play="a.play"
            :record="a"
          >
            <div
              class="win-rate min-w-19 text-center text-xs font-bold"
              :style="{ color: getWinRateColor(a.winRate) }"
            >
              {{ formatWinRate(a.winRate) }}
            </div>
          </StatisticPopover>
        </div>
      </div>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useTranslation } from 'i18next-vue'
import { NFlex, NRadio, NRadioGroup } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

import { useOpgg } from '../context'
import { useWinRateTheme } from '@champion-data-window/components/champion-statistics/theme'
import ExpandButton from './ExpandButton.vue'
import StatisticPopover from './StatisticPopover.vue'

const { champion } = useOpgg()
const { t } = useTranslation()
const { getWinRateColor, formatWinRate } = useWinRateTheme()
const resources = useAkariResourceProvider()

const augmentRarity = ref<1 | 4 | 8>()
const augments = computed(() => champion.value?.augmentGroups ?? null)

const selectedAugments = computed(() => {
  const groups = augments.value
  const rarity = augmentRarity.value

  if (!groups || !rarity) {
    return []
  }

  return groups[rarity]?.augments ?? []
})

watchEffect(() => {
  if (!augments.value) {
    augmentRarity.value = undefined

    return
  }

  if (augments.value[1]) {
    augmentRarity.value = 1
  } else if (augments.value[4]) {
    augmentRarity.value = 4
  } else if (augments.value[8]) {
    augmentRarity.value = 8
  } else {
    augmentRarity.value = undefined
  }
})

const isAugmentsExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isAugmentsExpanded.value = false
  }
})
</script>

<style scoped>
@import '../augment-rarity.css';
</style>
