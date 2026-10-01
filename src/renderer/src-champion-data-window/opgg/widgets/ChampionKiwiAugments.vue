<template>
  <SettingsSection v-if="augments.length" class="@container">
    <template #header>
      <div class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
        <span class="settings-section-title row-start-2 whitespace-nowrap">
          {{ t('opgg.champion.augments') }}
        </span>
        <NRadioGroup
          v-model:value="augmentRarity"
          size="small"
          class="col-start-2 row-start-1 max-w-full justify-self-end"
        >
          <NFlex :size="12" class="justify-end">
            <NRadio v-for="group of augments" :key="group.rarity" :value="group.rarity">
              <span
                :class="{
                  'augment-rarity-silver': group.rarity === 'kSilver',
                  'augment-rarity-gold': group.rarity === 'kGold',
                  'augment-rarity-prismatic': group.rarity === 'kPrismatic'
                }"
              >
                {{ group.rarityName }}
              </span>
            </NRadio>
          </NFlex>
        </NRadioGroup>

        <div
          class="col-start-2 row-start-2 flex flex-wrap items-center justify-end gap-x-3 gap-y-2"
        >
          <NCheckbox size="small" v-model:checked="showAdvancedStats">
            {{ t('opgg.champion.showAdvancedStats') }}
          </NCheckbox>
          <NSelect
            v-model:value="augmentSort"
            size="tiny"
            :options="augmentSortOptions"
            class="w-36! max-w-full"
            :consistent-menu-width="false"
            :render-label="renderLabel"
          />
          <ExpandButton v-if="selectedAugments.length > 16" v-model:expanded="isAugmentsExpanded" />
        </div>
      </div>
    </template>

    <div class="p-3">
      <div
        class="grid gap-x-6 gap-y-1"
        :class="{
          'grid-cols-1 @min-[600px]:grid-cols-2': showAdvancedStats,
          'grid-cols-2': !showAdvancedStats
        }"
      >
        <div
          class="flex h-8 min-w-0 items-center gap-1"
          v-for="(a, i) of selectedAugments.slice(0, isAugmentsExpanded ? Infinity : 16)"
          :key="a.id"
        >
          <!-- name -->
          <div class="min-w-6 shrink-0 text-[10px] text-[#666666] dark:text-[#b2b2b2]">
            #{{ i + 1 }}
          </div>

          <!-- tier -->
          <div
            v-if="a.tier !== null"
            class="mr-1 flex size-4 shrink-0 items-center justify-center rounded text-[11px]"
            :class="TIER_COLOR[a.tier]"
          >
            {{ TIER_NAME[a.tier] }}
          </div>

          <div class="flex min-w-0 items-center gap-1">
            <AugmentDisplay :size="24" :augment-id="a.id" class="mr-1" />
            <span class="name truncate text-xs">{{ resources.augments.name(a.id) }}</span>
          </div>

          <StatisticPopover v-if="showAdvancedStats" metric="performance" :value="a.performance">
            <div
              class="ml-auto flex h-4 shrink-0 items-center justify-center rounded bg-black/10 px-1 text-[11px] text-black dark:bg-white/10 dark:text-white"
            >
              {{ t('opgg.champion.augmentPerformance') }}
              <span class="ml-1 font-bold">{{ a.performance }}</span>
            </div>
          </StatisticPopover>

          <StatisticPopover v-if="showAdvancedStats" metric="popular" :value="a.popular">
            <div
              class="flex h-4 shrink-0 items-center justify-center rounded bg-black/10 px-1 text-[11px] text-black dark:bg-white/10 dark:text-white"
            >
              {{ t('opgg.champion.augmentPopular') }}
              <span class="ml-1 font-bold">{{ a.popular }}</span>
            </div>
          </StatisticPopover>
        </div>
      </div>
    </div>
  </SettingsSection>
</template>

<script setup lang="tsx">
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import type { OpggKiwiAugmentRarity } from '@shared/types/champion-data/opgg'
import { ArrowSort16Filled } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NCheckbox, NFlex, NIcon, NRadio, NRadioGroup, NSelect, SelectOption } from 'naive-ui'
import { computed, ref, watch, watchEffect } from 'vue'

import { useOpgg } from '../context'
import ExpandButton from './ExpandButton.vue'
import StatisticPopover from './StatisticPopover.vue'

const { champion } = useOpgg()
const { t } = useTranslation()
const resources = useAkariResourceProvider()

const augmentRarity = ref<OpggKiwiAugmentRarity>()
const augmentSort = ref<AugmentSort>('default')

const TIER_NAME = {
  0: 'S',
  1: 'A',
  2: 'B',
  3: 'C',
  4: 'D',
  5: 'E',
  6: 'F'
}

const TIER_COLOR = {
  0: 'bg-violet-500 text-white dark:bg-violet-500 dark:text-white',
  1: 'bg-blue-500 text-white dark:bg-blue-500 dark:text-white',
  2: 'bg-emerald-500 text-white dark:bg-emerald-500 dark:text-white',
  3: 'bg-yellow-600 text-white dark:bg-yellow-600 dark:text-white',
  4: 'bg-gray-500 text-white dark:bg-gray-500 dark:text-white',
  5: 'bg-gray-500 text-white dark:bg-gray-500 dark:text-white',
  6: 'bg-gray-500 text-white dark:bg-gray-500 dark:text-white'
}

type AugmentSort = 'default' | 'performance' | 'popular'
const augmentSortOptions = computed(() => [
  { label: t('opgg.champion.augmentSort.default'), value: 'default' },
  { label: t('opgg.champion.augmentSort.performance'), value: 'performance' },
  { label: t('opgg.champion.augmentSort.popular'), value: 'popular' }
])

const renderLabel = (option: SelectOption) => {
  return (
    <div class="flex items-center">
      <NIcon>
        <ArrowSort16Filled />
      </NIcon>
      <span class="ml-1">{option.label as string}</span>
    </div>
  )
}

const isAugmentsExpanded = ref(false)
const showAdvancedStats = ref(false)

const rarityLabels = {
  all: 'augmentAll',
  kSilver: 'augmentSilver',
  kGold: 'augmentGold',
  kPrismatic: 'augmentPrism'
} as const
const augments = computed(
  () =>
    champion.value?.kiwiAugmentGroups.map((group) => ({
      rarity: group.rarity,
      rarityName: t(`opgg.champion.${rarityLabels[group.rarity]}`),
      augments: group.augments.toSorted(
        (a, b) => a.sortRanks[augmentSort.value] - b.sortRanks[augmentSort.value]
      )
    })) ?? []
)

const selectedAugments = computed(() => {
  const group = augments.value.find((group) => group.rarity === augmentRarity.value)

  if (!group) {
    return []
  }

  return group.augments
})

watch(
  () => augments.value.map((group) => group.rarity),
  (rarities) => {
    if (!rarities.length) {
      augmentRarity.value = undefined

      return
    }

    const selectedRarity = augmentRarity.value

    if (!selectedRarity || !rarities.includes(selectedRarity)) {
      augmentRarity.value = rarities[0]
    }
  },
  { immediate: true }
)

watchEffect(() => {
  if (!champion.value) {
    isAugmentsExpanded.value = false
  }
})
</script>

<style scoped>
@import '../augment-rarity.css';
</style>
