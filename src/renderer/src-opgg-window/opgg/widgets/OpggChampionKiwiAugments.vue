<template>
  <div
    class="@container mb-1 rounded border border-black/10 p-2 last:mb-0 dark:border-[#37373c]"
    v-if="augments && Object.keys(augments).length"
  >
    <NTabs v-model:value="augmentTab" size="small" :animated="false">
      <NTabPane v-for="group of augments" :key="group.rarity" :name="group.rarity">
        <template #tab>
          <span class="text-xs font-bold">{{ group.rarityName }}</span>
        </template>

        <div class="my-2 flex items-center gap-2">
          <NCheckbox size="small" v-model:checked="showAdvancedStats">
            {{ t('OpggChampion.showAdvancedStats') }}
          </NCheckbox>
          <NCheckbox size="small" v-model:checked="isAugmentsExpanded">
            {{ t('OpggChampion.showAll') }}
          </NCheckbox>
          <NSelect
            v-model:value="augmentSort"
            size="tiny"
            :options="augmentSortOptions"
            class="w-22!"
            :consistent-menu-width="false"
            :render-label="renderLabel"
          />
        </div>

        <div
          class="grid gap-x-6 gap-y-1"
          :class="{
            'grid-cols-1 @min-[600px]:grid-cols-2': showAdvancedStats,
            'grid-cols-2': !showAdvancedStats
          }"
        >
          <div
            class="flex h-8 min-w-0 items-center gap-1"
            v-for="(a, i) of group.augments.slice(0, isAugmentsExpanded ? Infinity : 16)"
          >
            <!-- name -->
            <div class="min-w-6 shrink-0 text-[10px] text-[#666666] dark:text-[#b2b2b2]">
              #{{ i + 1 }}
            </div>

            <!-- tier -->
            <div
              class="mr-1 flex size-4 shrink-0 items-center justify-center rounded text-[11px]"
              :class="TIER_COLOR[a.tier]"
            >
              {{ TIER_NAME[a.tier] }}
            </div>

            <div class="flex min-w-0 items-center gap-1">
              <AugmentDisplay :size="24" :augment-id="a.id" class="mr-1" />
              <span class="name truncate text-xs">{{ lcs.gameData.augmentName(a.id) }}</span>
            </div>

            <div
              v-if="showAdvancedStats"
              class="ml-auto flex h-4 shrink-0 items-center justify-center rounded bg-black/10 px-1 text-[11px] text-black dark:bg-white/10 dark:text-white"
            >
              {{ t('OpggChampion.augmentPerformance') }}
              <span class="ml-1 font-bold">{{ a.performance }}</span>
            </div>

            <div
              v-if="showAdvancedStats"
              class="flex h-4 shrink-0 items-center justify-center rounded bg-black/10 px-1 text-[11px] text-black dark:bg-white/10 dark:text-white"
            >
              {{ t('OpggChampion.augmentPopular') }}
              <span class="ml-1 font-bold">{{ a.popular }}</span>
            </div>
          </div>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>

<script setup lang="ts">
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { OpggAramMayhemChampionAugmentItem } from '@shared/types/opgg'
import { useTranslation } from 'i18next-vue'
import { NCheckbox, NIcon, NSelect, NTabPane, NTabs, SelectOption } from 'naive-ui'
import { computed, h, ref, watchEffect } from 'vue'

import { useOpgg } from '../context'
import { ArrowSort16Filled } from '@vicons/fluent'

const { champion, kiwiAugments } = useOpgg()
const { t } = useTranslation()
const lcs = useLeagueClientStore()

const augmentTab = ref<AugmentTab | undefined>(undefined)
const augmentSort = ref<AugmentSort>('default')

const enum AugmentTab {
  All = '<akari:all>',
  kSilver = 'kSilver',
  kGold = 'kGold',
  kPrismatic = 'kPrismatic'
}

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
type KiwiAugmentWithRarity = OpggAramMayhemChampionAugmentItem & {
  rarity: string | null
}

const augmentSortOptions = computed(() => [
  { label: t('OpggChampion.augmentSort.default'), value: 'default' },
  { label: t('OpggChampion.augmentSort.performance'), value: 'performance' },
  { label: t('OpggChampion.augmentSort.popular'), value: 'popular' }
])

const renderLabel = (option: SelectOption) => {
  return h('div', { class: 'flex items-center' }, [
    h(NIcon, {}, () => h(ArrowSort16Filled)),
    h('span', { class: 'ml-1' }, option.label as string)
  ])
}

const sortAugments = (items: KiwiAugmentWithRarity[]) => {
  if (augmentSort.value === 'performance') {
    return items.toSorted((a, b) => {
      if (a.popular === 0 && b.popular !== 0) {
        return 1
      }

      if (a.popular !== 0 && b.popular === 0) {
        return -1
      }

      return b.performance - a.performance
    })
  }

  if (augmentSort.value === 'popular') {
    return items.toSorted((a, b) => b.popular - a.popular)
  }

  return items.toSorted((a, b) => a.tier - b.tier)
}

const isAugmentsExpanded = ref(false)
const showAdvancedStats = ref(false)

const augments = computed(() => {
  if (!kiwiAugments.value) {
    return null
  }

  const mappedByRarity = kiwiAugments.value.data.map((item) => {
    return {
      ...item,
      rarity: lcs.gameData.augments[item.id]?.rarity ?? null
    }
  })

  const sortedAugments = sortAugments(mappedByRarity)

  const kSilver = sortAugments(mappedByRarity.filter((item) => item.rarity === 'kSilver'))
  const kGold = sortAugments(mappedByRarity.filter((item) => item.rarity === 'kGold'))
  const kPrismatic = sortAugments(mappedByRarity.filter((item) => item.rarity === 'kPrismatic'))

  const groups: {
    rarity: 'kSilver' | 'kGold' | 'kPrismatic' | '<akari:all>'
    rarityName: string
    augments: KiwiAugmentWithRarity[]
  }[] = []

  // all
  if (sortedAugments.length) {
    groups.push({
      rarity: '<akari:all>',
      rarityName: t('OpggChampion.augmentAll'),
      augments: sortedAugments
    })
  }

  // kSilver
  if (kSilver.length) {
    groups.push({
      rarity: 'kSilver',
      rarityName: t('OpggChampion.augmentSilver'),
      augments: kSilver
    })
  }

  // kGold
  if (kGold.length) {
    groups.push({
      rarity: 'kGold',
      rarityName: t('OpggChampion.augmentGold'),
      augments: kGold
    })
  }

  // kPrismatic
  if (kPrismatic.length) {
    groups.push({
      rarity: 'kPrismatic',
      rarityName: t('OpggChampion.augmentPrism'),
      augments: kPrismatic
    })
  }

  return groups
})

watchEffect(() => {
  if (!augments.value) {
    augmentTab.value = undefined
    return
  }

  augmentTab.value = AugmentTab.All
})

watchEffect(() => {
  if (!champion.value) {
    isAugmentsExpanded.value = false
  }
})
</script>
