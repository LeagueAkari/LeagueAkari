<template>
  <div class="flex h-full min-h-0 flex-col">
    <NDataTable
      class="min-h-0 flex-1"
      flex-height
      :data="data"
      :loading="isLoading"
      :columns="combinedColumns"
      :row-key="(item) => item.id"
      virtual-scroll
      :row-props="rowProps"
      size="small"
    >
      <template v-if="emptyDescription" #empty>
        <NEmpty :description="emptyDescription" />
      </template>
    </NDataTable>
  </div>
</template>

<script lang="tsx" setup>
import {
  rankColumnPresentation,
  statisticCellClass
} from '@champion-data-window/components/champion-statistics/table-presentation'
import { useChampionNameMatch } from '@main-window/composables/useChampionNameMatch'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useCompositionAwareInput } from '@renderer-shared/composables/useCompositionAwareInput'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import type { OpggChampionDataRow } from '@shared/types/champion-data/opgg'
import { useMediaQuery } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import {
  DataTableColumn,
  DataTableColumns,
  DataTableCreateRowProps,
  NDataTable,
  NEmpty,
  NInput
} from 'naive-ui'
import { computed } from 'vue'

import { useOpgg } from './context'
import { useWinRateTheme } from '@champion-data-window/components/champion-statistics/theme'
import StatisticPopover from './widgets/StatisticPopover.vue'
import TierBadge from '@champion-data-window/components/champion-statistics/TierBadge.vue'

const { t } = useTranslation()
const { getWinRateColor } = useWinRateTheme()

defineProps<{ emptyDescription?: string }>()

const resources = useAkariResourceProvider()
const { champions, isLoading, setTab } = useOpgg()
const { match } = useChampionNameMatch()
const {
  inputValue: filterInput,
  committedValue: filterText,
  handleUpdateValue: handleFilterUpdate,
  handleCompositionStart,
  handleCompositionEnd
} = useCompositionAwareInput()

const columns: DataTableColumns<OpggChampionDataRow> = [
  {
    ...rankColumnPresentation,
    sorter: (a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity),
    render: (row, index) => row.rank ?? index + 1
  },
  {
    title: () => t('opgg.championTable.columns.champion'),
    key: 'name',
    filter: true,
    filterMultiple: false,
    get filterOptionValue() {
      return filterText.value || null
    },
    renderFilterMenu: () => (
      <div
        class="w-52 p-2"
        onCompositionstart={handleCompositionStart}
        onCompositionend={handleCompositionEnd}
      >
        <NInput
          value={filterInput.value}
          placeholder={t('opgg.championTable.searchPlaceholder')}
          size="small"
          clearable
          autofocus
          onUpdateValue={handleFilterUpdate}
        />
      </div>
    ),
    align: 'center',
    className: statisticCellClass,
    sorter: (a, b) => {
      return resources.champions.name(a.id).localeCompare(resources.champions.name(b.id))
    },
    render: (row) => {
      return (
        <div class="flex items-center justify-center overflow-hidden">
          <LcuImage
            class="size-8 shrink-0"
            src={resources.champions.icon(row.id)?.iconPath ?? ''}
          />
          <div class="ml-2 w-25 truncate text-left text-[13px] text-black/80 dark:text-white/80">
            {resources.champions.name(row.id)}
          </div>
        </div>
      )
    }
  },
  {
    title: () => t('opgg.championTable.columns.tier'),
    key: 'tier',
    align: 'center',
    width: 76,
    className: statisticCellClass,
    sorter: (a, b) => (b.tier ?? Infinity) - (a.tier ?? Infinity),
    render: (row) => <TierBadge tier={row.tier} />
  },
  {
    title: () => t('opgg.championTable.columns.winRate'),
    key: 'winRate',
    align: 'center',
    width: 76,
    className: statisticCellClass,
    sorter: (a, b) => (a.winRate ?? 0) - (b.winRate ?? 0),
    render: (row) => {
      if (row.winRate === null) {
        return '-'
      }

      const value = `${(row.winRate * 100).toFixed(2)}%`

      return (
        <StatisticPopover metric="winRate" value={value} play={row.play} record={row}>
          {{
            default: () => <span style={{ color: getWinRateColor(row.winRate) }}>{value}</span>
          }}
        </StatisticPopover>
      )
    }
  },
  {
    title: () => t('opgg.championTable.columns.pickRate'),
    key: 'pickRate',
    align: 'center',
    width: 86,
    sorter: (a, b) => (a.pickRate ?? 0) - (b.pickRate ?? 0),
    className: statisticCellClass,
    render: (row) => {
      if (row.pickRate === null) {
        return '-'
      }

      const value = `${(row.pickRate * 100).toFixed(2)}%`

      return (
        <StatisticPopover metric="championPickRate" value={value} play={row.play}>
          {{ default: () => <span>{value}</span> }}
        </StatisticPopover>
      )
    }
  }
]

const countersColumn: DataTableColumn<OpggChampionDataRow> = {
  title: () => t('opgg.championTable.columns.counter'),
  key: 'counters',
  align: 'center',
  width: 90,
  className: statisticCellClass,
  render: (row) => {
    if (!row.counters.length) return '-'

    return (
      <div class="flex items-center justify-center gap-0.5">
        {row.counters.slice(0, 3).map((counter) => (
          <LcuImage
            class="size-4.5"
            src={resources.champions.icon(counter.champion_id)?.iconPath ?? ''}
          />
        ))}
      </div>
    )
  }
}

const banRateColumn: DataTableColumn<OpggChampionDataRow> = {
  title: () => t('opgg.championTable.columns.banRate'),
  key: 'banRate',
  align: 'center',
  width: 86,
  sorter: (a, b) => (a.banRate ?? 0) - (b.banRate ?? 0),
  className: statisticCellClass,
  render: (row) => {
    if (row.banRate === null) {
      return '-'
    }

    const value = `${(row.banRate * 100).toFixed(2)}%`

    return (
      <StatisticPopover metric="banRate" value={value}>
        {{ default: () => <span>{value}</span> }}
      </StatisticPopover>
    )
  }
}

const isLargeEnoughToShow = useMediaQuery('(min-width: 520px)')
const isSuperLargeEnoughToShow = useMediaQuery('(min-width: 600px)')

const combinedColumns = computed(() => {
  if (isSuperLargeEnoughToShow.value) {
    return [...columns, banRateColumn, countersColumn]
  }

  if (isLargeEnoughToShow.value) {
    return [...columns, countersColumn]
  }

  return columns
})

const data = computed(() =>
  (champions.value ?? []).filter(
    (row) => !filterText.value || match(filterText.value, resources.champions.name(row.id), row.id)
  )
)

const rowProps: DataTableCreateRowProps<OpggChampionDataRow> = (row) => ({
  onClick: () => setTab('champion', row.id),
  class: 'cursor-pointer'
})
</script>
