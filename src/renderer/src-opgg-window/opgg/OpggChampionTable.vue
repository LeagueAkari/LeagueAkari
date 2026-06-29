<template>
  <div class="flex h-full flex-col">
    <NInput
      v-model:value="filterText"
      :placeholder="t('opgg.championTable.searchPlaceholder')"
      size="small"
      class="mb-1 text-xs"
      clearable
    />
    <NDataTable
      class="flex-1"
      flex-height
      :data="data"
      :columns="combinedColumns"
      :row-key="(item) => item.id"
      virtual-scroll
      :row-props="rowProps"
      :loading="isLoading"
      size="small"
    >
      <template #loading>
        <div class="flex flex-col items-center gap-2">
          <NSpin size="small" />
          <NButton size="tiny" secondary @click="cancel">{{
            t('opgg.championTable.cancel')
          }}</NButton>
        </div>
      </template>
    </NDataTable>
  </div>
</template>

<script lang="tsx" setup>
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { OpggChampionItem } from '@shared/types/opgg'
import { useMediaQuery } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import {
  DataTableColumn,
  DataTableColumns,
  DataTableCreateRowProps,
  NButton,
  NDataTable,
  NInput,
  NSpin
} from 'naive-ui'
import { computed, ref } from 'vue'

import { useChampionNameMatch } from '@main-window/composables/useChampionNameMatch'

import { useOpgg } from './context'
import { getTierTextColorClass } from './utils/theme'

const { t } = useTranslation()

const filterText = ref('')

const lcs = useLeagueClientStore()

const { mode, position, champions, isLoading, cancel, setTab } = useOpgg()

const columns: DataTableColumns<OpggChampionItem> = [
  {
    title: '#',
    key: 'rank',
    align: 'center',
    className: 'text-[13px] dark:text-white/80 text-black/80',
    width: 46,
    render: (row, index) => {
      if (mode.value === 'ranked' && position.value !== 'none') {
        const positionData = row.positions?.find(
          (p) => p.name.toUpperCase() === position.value?.toUpperCase()
        )
        return positionData?.stats?.tier_data?.rank || index + 1
      }

      return row.average_stats?.rank || index + 1
    }
  },
  {
    title: () => t('opgg.championTable.columns.champion'),
    key: 'name',
    align: 'center',
    className: 'text-[13px] dark:text-white/80 text-black/80',
    sorter: (a, b) => {
      const aName = lcs.gameData.champions[a.id]?.name
      const bName = lcs.gameData.champions[b.id]?.name

      if (aName && bName) {
        return aName.localeCompare(bName)
      }

      return a.id - b.id
    },
    render: (row) => {
      return (
        <div class="flex items-center justify-center overflow-hidden">
          <LcuImage class="size-8 shrink-0" src={championIconUri(row.id)} />
          <div class="ml-2 w-25 truncate text-left text-[13px] text-black/80 dark:text-white/80">
            {lcs.gameData.champions[row.id]?.name || row.id}
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
    className: 'text-[13px] dark:text-white/80 text-black/80',
    sorter: (a, b) => {
      return (b.average_stats?.tier || Infinity) - (a.average_stats?.tier || Infinity)
    },
    render: (row) => {
      if (mode.value === 'ranked' && position.value !== 'none') {
        const positionData = row.positions?.find(
          (p) => p.name.toUpperCase() === position.value?.toUpperCase()
        )

        let tierText: string
        if (positionData === undefined || positionData === null) {
          tierText = '-'
        } else if (positionData.stats?.tier_data?.tier === 0) {
          tierText = 'OP'
        } else if (positionData.stats?.tier_data?.tier) {
          tierText = positionData.stats?.tier_data?.tier.toString()
        } else {
          tierText = '-'
        }

        return (
          <span class={getTierTextColorClass(positionData?.stats?.tier_data?.tier)}>
            {tierText}
          </span>
        )
      }

      let tierText: string
      if (!row.average_stats) {
        tierText = '-'
      } else if (row.average_stats.tier === 0) {
        tierText = 'OP'
      } else if (row.average_stats.tier) {
        tierText = row.average_stats.tier.toString()
      } else {
        tierText = '-'
      }

      return <span class={getTierTextColorClass(row.average_stats?.tier)}>{tierText}</span>
    }
  },
  {
    title: () => t('opgg.championTable.columns.winRate'),
    key: 'winRate',
    align: 'center',
    width: 76,
    className: 'text-[13px] dark:text-white/80 text-black/80',
    sorter: (a, b) => {
      if (mode.value === 'ranked') {
        const aPosition = a.positions?.find(
          (p) => p.name.toUpperCase() === position.value?.toUpperCase()
        )
        const bPosition = b.positions?.find(
          (p) => p.name.toUpperCase() === position.value?.toUpperCase()
        )

        return (aPosition?.stats?.win_rate || 0) - (bPosition?.stats?.win_rate || 0)
      }

      if (mode.value === 'arena') {
        return (
          (a.average_stats?.win || 0) / (a.average_stats?.play || 1) -
          (b.average_stats?.win || 0) / (b.average_stats?.play || 1)
        )
      } else {
        return (a.average_stats?.win_rate || 0) - (b.average_stats?.win_rate || 0)
      }
    },
    render: (row) => {
      if (mode.value === 'ranked' && position.value !== 'none') {
        const positionData = row.positions?.find(
          (p) => p.name.toUpperCase() === position.value?.toUpperCase()
        )

        if (!positionData) {
          return '-'
        }

        return `${(positionData.stats?.win_rate * 100 || 0).toFixed(2)}%`
      }

      if (!row.average_stats) {
        return '-'
      }

      if (row.average_stats.win_rate) {
        return `${(row.average_stats.win_rate * 100).toFixed(2)}%`
      }

      if (mode.value === 'arena' && row.average_stats.win && row.average_stats.play) {
        return `${((row.average_stats.win / row.average_stats.play) * 100).toFixed(2)}%`
      }

      return '-'
    }
  },
  {
    title: () => t('opgg.championTable.columns.pickRate'),
    key: 'pickRate',
    align: 'center',
    width: 86,
    sorter: (a, b) => {
      if (mode.value === 'ranked' && position.value !== 'none') {
        const aPosition = a.positions?.find(
          (p) => p.name.toUpperCase() === position.value?.toUpperCase()
        )
        const bPosition = b.positions?.find(
          (p) => p.name.toUpperCase() === position.value?.toUpperCase()
        )

        return (aPosition?.stats.pick_rate || 0) - (bPosition?.stats.pick_rate || 0)
      }

      return (a.average_stats?.pick_rate || 0) - (b.average_stats?.pick_rate || 0)
    },
    className: 'text-[13px] dark:text-white/80 text-black/80',
    render: (row) => {
      if (mode.value === 'ranked' && position.value !== 'none') {
        const positionData = row.positions?.find(
          (p) => p.name.toUpperCase() === position.value?.toUpperCase()
        )

        if (!positionData) {
          return '-'
        }

        return `${(positionData.stats?.pick_rate * 100 || 0).toFixed(2)}%`
      }

      if (!row.average_stats) {
        return '-'
      }

      return `${(row.average_stats.pick_rate * 100).toFixed(2)}%`
    }
  }
]

const countersColumn: DataTableColumn<OpggChampionItem> = {
  title: () => t('opgg.championTable.columns.counter'),
  key: 'counters',
  align: 'center',
  width: 90,
  className: 'text-[13px] dark:text-white/80 text-black/80',
  render: (row) => {
    if (mode.value === 'ranked' && position.value !== 'none') {
      const positionData = row.positions?.find(
        (p) => p.name.toUpperCase() === position.value?.toUpperCase()
      )

      if (!positionData || !positionData.counters || !positionData.counters.length) {
        return '-'
      }

      return (
        <div class="flex items-center justify-center gap-0.5">
          {positionData.counters.slice(0, 3).map((c) => (
            <LcuImage class="size-[18px]" src={championIconUri(c.champion_id)} />
          ))}
        </div>
      )
    }

    return '-'
  }
}

const banRateColumn: DataTableColumn<OpggChampionItem> = {
  title: () => t('opgg.championTable.columns.banRate'),
  key: 'banRate',
  align: 'center',
  width: 86,
  sorter: (a, b) => {
    if (mode.value === 'ranked' && position.value !== 'none') {
      const aPosition = a.positions?.find(
        (p) => p.name.toUpperCase() === position.value?.toUpperCase()
      )
      const bPosition = b.positions?.find(
        (p) => p.name.toUpperCase() === position.value?.toUpperCase()
      )

      return (aPosition?.stats.ban_rate || 0) - (bPosition?.stats.ban_rate || 0)
    }

    return (a.average_stats?.ban_rate || 0) - (b.average_stats?.ban_rate || 0)
  },
  className: 'text-[13px] dark:text-white/80 text-black/80',
  render: (row) => {
    if (mode.value === 'ranked' && position.value !== 'none') {
      const positionData = row.positions?.find(
        (p) => p.name.toUpperCase() === position.value?.toUpperCase()
      )

      if (!positionData || !positionData.stats || positionData.stats.ban_rate === null) {
        return '-'
      }

      return `${(positionData.stats?.ban_rate * 100 || 0).toFixed(2)}%`
    }

    if (!row.average_stats || row.average_stats.ban_rate === null) {
      return '-'
    }

    return `${(row.average_stats.ban_rate * 100).toFixed(2)}%`
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

const { match } = useChampionNameMatch()

const data = computed(() => {
  if (!champions.value) {
    return []
  }

  const { data } = champions.value

  // 排位数据按照位置的 tier 排序
  if (mode.value === 'ranked' && position.value !== 'none') {
    const arr: OpggChampionItem[] = []

    for (const c of data) {
      if (!c.positions) {
        continue
      }

      for (const p of c.positions) {
        if (p.name.toUpperCase() === position.value?.toUpperCase()) {
          arr.push(c)
          break
        }
      }
    }

    return arr
      .toSorted((a, b) => {
        const aPosition = a.positions?.find(
          (p) => p.name.toUpperCase() === position.value?.toUpperCase()
        )
        const bPosition = b.positions?.find(
          (p) => p.name.toUpperCase() === position.value?.toUpperCase()
        )

        return (
          (aPosition?.stats?.tier_data?.rank || Infinity) -
          (bPosition?.stats?.tier_data?.rank || Infinity)
        )
      })
      .filter((value) => {
        if (filterText.value === '') {
          return true
        }

        return match(filterText.value, lcs.gameData.champions[value.id]?.name, value.id)
      })
  }

  return data
    .toSorted((a, b) => {
      return (a.average_stats?.rank || Infinity) - (b.average_stats?.rank || Infinity)
    })
    .filter((value) => {
      if (filterText.value === '') {
        return true
      }

      return match(filterText.value, lcs.gameData.champions[value.id]?.name, value.id)
    })
})

const rowProps: DataTableCreateRowProps<OpggChampionItem> = (row) => {
  return {
    onClick: () => {
      setTab('champion', row.id)
    },
    class: 'cursor-pointer'
  }
}
</script>
