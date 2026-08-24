<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="mb-1 flex items-center gap-2">
      <NTabs
        v-if="sections.length > 1"
        class="min-w-0 flex-1"
        type="segment"
        size="small"
        :value="activeSection"
        @update:value="activeSection = $event"
      >
        <NTab
          v-for="section in sections"
          :key="section.value"
          :name="section.value"
          :tab="section.label"
        />
      </NTabs>
      <div v-if="dataDate" class="ml-auto shrink-0 text-[11px] text-black/50 dark:text-white/50">
        {{ t('opgg.mayhemOverview.dataDate', { date: dataDate }) }}
      </div>
    </div>

    <OpggChampionTable
      v-if="activeSection === 'champions'"
      class="min-h-0 flex-1"
      :empty-description="t('opgg.mayhemOverview.noDataToday')"
    />

    <NDataTable
      v-else-if="activeSection === 'augments'"
      class="min-h-0 flex-1"
      flex-height
      virtual-scroll
      size="small"
      :columns="augmentColumns"
      :data="augments"
      :row-key="(item) => item.augmentId"
    />

    <NDataTable
      v-else
      class="min-h-0 flex-1"
      flex-height
      virtual-scroll
      size="small"
      :columns="synergyColumns"
      :data="synergies"
      :row-key="(item) => item.championIds.join('-')"
    />
  </div>
</template>

<script setup lang="tsx">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import type { ChampionAugment, ChampionSynergy } from '@shared/data-adapter/champion-data'
import { useTranslation } from 'i18next-vue'
import { type DataTableColumns, NDataTable, NTab, NTabs } from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { useOpgg } from './context'
import OpggChampionTable from './OpggChampionTable.vue'

type MayhemSection = 'champions' | 'augments' | 'synergies'

const { t } = useTranslation()
const resources = useAkariResourceProvider()
const { overview, setTab } = useOpgg()

const activeSection = ref<MayhemSection>('champions')

const augments = computed(() =>
  [...(overview.value?.sections.augments ?? [])].sort(
    (a, b) =>
      (a.rank ?? Number.POSITIVE_INFINITY) - (b.rank ?? Number.POSITIVE_INFINITY) ||
      (b.performance.pickRate ?? -1) - (a.performance.pickRate ?? -1)
  )
)

const synergies = computed(() =>
  [...(overview.value?.sections.synergies ?? [])].sort(
    (a, b) =>
      (a.performance.rank ?? Number.POSITIVE_INFINITY) -
        (b.performance.rank ?? Number.POSITIVE_INFINITY) ||
      (b.performance.winRate ?? -1) - (a.performance.winRate ?? -1)
  )
)

const sections = computed<Array<{ label: string; value: MayhemSection }>>(() => [
  { label: t('opgg.mayhemOverview.sections.champions'), value: 'champions' },
  ...(augments.value.length
    ? [{ label: t('opgg.mayhemOverview.sections.augments'), value: 'augments' as const }]
    : []),
  ...(synergies.value.length
    ? [{ label: t('opgg.mayhemOverview.sections.synergies'), value: 'synergies' as const }]
    : [])
])

watch(sections, (nextSections) => {
  if (!nextSections.some((section) => section.value === activeSection.value)) {
    activeSection.value = 'champions'
  }
})

const dataDate = computed(() => {
  const value = overview.value?.metadata.dataDate
  if (!value) return null
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`
  return value
})

const formatRate = (value: number | null) => (value === null ? '-' : `${(value * 100).toFixed(2)}%`)

const championName = (championId: number) =>
  resources.champions.name(championId) || String(championId)

const championIconSource = (championId: number) =>
  resources.champions.icon(championId)?.iconPath ?? ''

const championIdsWithDetails = computed(
  () => new Set(overview.value?.sections.champions.map((item) => item.championId) ?? [])
)

const rarityTranslationKey = {
  kBronze: 'bronze',
  kSilver: 'silver',
  kGold: 'gold',
  kPrismatic: 'prismatic',
  kEventChoice: 'eventChoice'
} as const

const renderChampionIcons = (championIds: number[], showNames: boolean) => (
  <div class="flex min-w-0 items-center gap-1.5">
    {championIds.map((championId) => {
      const hasDetails = championIdsWithDetails.value.has(championId)
      return (
        <div
          class={[
            'flex min-w-0 items-center gap-1 rounded px-1 py-0.5',
            hasDetails ? 'cursor-pointer hover:bg-black/6 dark:hover:bg-white/8' : 'cursor-default'
          ]}
          title={championName(championId)}
          onClick={hasDetails ? () => setTab('champion', championId) : undefined}
        >
          <LcuImage class="size-6 shrink-0" src={championIconSource(championId)} />
          {showNames ? <span class="truncate text-xs">{championName(championId)}</span> : null}
        </div>
      )
    })}
  </div>
)

const augmentColumns = computed<DataTableColumns<ChampionAugment>>(() => [
  {
    title: '#',
    key: 'rank',
    width: 48,
    align: 'center',
    render: (row, index) => row.rank ?? index + 1
  },
  {
    title: t('opgg.mayhemOverview.columns.augment'),
    key: 'augment',
    minWidth: 150,
    render: (row) => (
      <div class="flex min-w-0 items-center gap-2">
        <AugmentDisplay augmentId={row.augmentId} size={28} />
        <span class="truncate text-xs">{resources.augments.name(row.augmentId)}</span>
      </div>
    )
  },
  {
    title: t('opgg.mayhemOverview.columns.rarity'),
    key: 'rarity',
    width: 68,
    align: 'center',
    render: (row) => {
      const rarity = resources.augments.display(row.augmentId)?.rarity
      if (!rarity) return '-'
      return t(`gameAssets.augment.${rarityTranslationKey[rarity]}`)
    }
  },
  {
    title: t('opgg.champion.winRate'),
    key: 'winRate',
    width: 76,
    align: 'center',
    sorter: (a, b) => (a.performance.winRate ?? -1) - (b.performance.winRate ?? -1),
    render: (row) => formatRate(row.performance.winRate)
  },
  {
    title: t('opgg.champion.pickRate'),
    key: 'pickRate',
    width: 76,
    align: 'center',
    sorter: (a, b) => (a.performance.pickRate ?? -1) - (b.performance.pickRate ?? -1),
    render: (row) => formatRate(row.performance.pickRate)
  },
  {
    title: t('opgg.mayhemOverview.columns.bestChampions'),
    key: 'bestChampions',
    width: 112,
    render: (row) =>
      row.bestChampionIds.length ? renderChampionIcons(row.bestChampionIds.slice(0, 3), false) : '-'
  }
])

const synergyColumns = computed<DataTableColumns<ChampionSynergy>>(() => [
  {
    title: '#',
    key: 'rank',
    width: 48,
    align: 'center',
    render: (row, index) => row.performance.rank ?? index + 1
  },
  {
    title: t('opgg.mayhemOverview.columns.combination'),
    key: 'combination',
    minWidth: 230,
    render: (row) => renderChampionIcons(row.championIds, true)
  },
  {
    title: t('opgg.champion.winRate'),
    key: 'winRate',
    width: 88,
    align: 'center',
    sorter: (a, b) => (a.performance.winRate ?? -1) - (b.performance.winRate ?? -1),
    render: (row) => formatRate(row.performance.winRate)
  },
  {
    title: t('opgg.champion.pickRate'),
    key: 'pickRate',
    width: 88,
    align: 'center',
    sorter: (a, b) => (a.performance.pickRate ?? -1) - (b.performance.pickRate ?? -1),
    render: (row) => formatRate(row.performance.pickRate)
  }
])
</script>
