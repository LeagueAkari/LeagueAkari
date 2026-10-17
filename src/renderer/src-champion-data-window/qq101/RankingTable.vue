<template>
  <div ref="viewport" class="flex min-h-0 min-w-0 flex-1 flex-col">
    <NDataTable
      class="ranking-table min-h-0 flex-1"
      :columns="columns"
      :data="filteredRows"
      :loading="loading"
      :row-key="(row: RankingRow) => row.key"
      :row-props="rowProps"
      :scroll-x="tableWidth"
      flex-height
      virtual-scroll
      size="small"
      @update:sorter="handleSort"
    >
      <template #empty><NEmpty :description="t('qq101.empty')" /></template>
    </NDataTable>
  </div>
</template>

<script setup lang="tsx">
import {
  rankColumnPresentation,
  statisticCellClass
} from '@champion-data-window/components/champion-statistics/table-presentation'
import ChampionLink from '@champion-data-window/components/champion-statistics/ChampionLink.vue'
import PositionLabels from './PositionLabels.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import type { Qq101AkariData } from '@shared/data-adapter/qq101/akari-adapter'
import { useCompositionAwareInput } from '@renderer-shared/composables/useCompositionAwareInput'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useElementSize } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import {
  NDataTable,
  NButton,
  NEmpty,
  NInput,
  NPopover,
  NTag,
  type DataTableColumns,
  type DataTableCreateRowProps,
  type DataTableSortState
} from 'naive-ui'
import { computed, ref, useTemplateRef } from 'vue'
import type { RankingRow } from './rankings'
import TierBadge from '@champion-data-window/components/champion-statistics/TierBadge.vue'
import { useWinRateTheme } from '@champion-data-window/components/champion-statistics/theme'

const {
  rows,
  mode,
  board,
  loading = false,
  classicLanes = []
} = defineProps<{
  rows: RankingRow[]
  mode: string
  board: string
  loading?: boolean
  classicLanes?: Qq101AkariData<'lanes'>['champions']
}>()

const resources = useAkariResourceProvider()

const emit = defineEmits<{ champion: [id: number, position?: string] }>()

const { t } = useTranslation()
const { getWinRateColor } = useWinRateTheme()
const { width } = useElementSize(useTemplateRef('viewport'))
const compact = computed(() => width.value < 640)
const expanded = computed(() => width.value >= 780)
const {
  inputValue,
  committedValue,
  handleUpdateValue,
  handleCompositionStart,
  handleCompositionEnd
} = useCompositionAwareInput()
const sort = ref<DataTableSortState | null>(null)

const useWinRank = computed(
  () => board === 'augments' && sort.value?.columnKey === 'winRate' && sort.value.order
)

const changeOf = (row: RankingRow) => (useWinRank.value ? (row.winChange ?? null) : row.change)

const nameOf = (row: RankingRow, id: number) =>
  row.kind === 'augment' ? resources.augments.name(id) : resources.champions.name(id)

const filteredRows = computed(() => {
  const query = committedValue.value.trim().toLocaleLowerCase()
  // Rift ranks belong to separate lanes. Preserve source order for tied tiers.
  const orderedRows =
    mode === 'ranked' ? rows : [...rows].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))

  return orderedRows.filter(
    (row) =>
      !query ||
      row.ids.some((id) =>
        [
          nameOf(row, id),
          String(id),
          ...(row.kind === 'augment' ? [] : resources.champions.searchKeywords(id))
        ].some((name) => name.toLocaleLowerCase().includes(query))
      )
  )
})

const percent = (value: number | null | undefined) =>
  value == null ? '—' : `${(value * 100).toFixed(2)}%`

const handleSort = (value: DataTableSortState | DataTableSortState[] | null) => {
  sort.value = Array.isArray(value) ? (value[0] ?? null) : value
}

const hasBan = computed(() => mode === 'ranked' || mode === 'classic')
const hasTier = computed(() => hasBan.value || (mode === 'aram_mayhem' && board === 'champions'))

const tableWidth = computed(() =>
  compact.value ? (hasTier.value ? 420 : 360) : expanded.value ? 760 : 620
)

const positionLabel = (position: string) => ({
  value: position,
  label: t(
    `qq101.positions.${position.toLowerCase() === 'support' ? 'utility' : position.toLowerCase()}`
  )
})

const changeLabel = (row: RankingRow) => {
  const value = changeOf(row)
  return value == null ? '—' : value === 0 ? '−' : `${value > 0 ? '↑' : '↓'} ${Math.abs(value)}`
}

const rowProps: DataTableCreateRowProps<RankingRow> = (row) =>
  row.kind === 'champion' && (mode === 'ranked' || mode === 'aram_mayhem')
    ? {
        style: { cursor: 'pointer' },
        onClick: () => {
          if (!loading) {
            emit('champion', row.ids[0], row.position)
          }
        }
      }
    : {}

const renderIdentity = (row: RankingRow, id: number) => {
  if (row.kind === 'pair') {
    return (
      <ChampionLink
        championId={id}
        disabled={loading}
        onSelect={() => emit('champion', id, row.position)}
      />
    )
  }

  return (
    <div class="flex min-w-0 items-center gap-2">
      {row.kind === 'augment' ? (
        <AugmentDisplay augmentId={id} size={28} />
      ) : (
        <LcuImage
          class="size-8 shrink-0 object-cover"
          src={resources.champions.icon(id)?.iconPath}
        />
      )}
      <div class="flex min-w-0 flex-col">
        <div class="flex min-w-0 items-center gap-1.5">
          <span class="truncate text-[13px]">{nameOf(row, id)}</span>
          {row.kind === 'champion' && row.info.mode === 'ranked' && row.info.isHot ? (
            <NTag
              size="small"
              type="warning"
              bordered={false}
              class="h-4! shrink-0 px-1! py-0! text-[10px]! leading-4!"
            >
              {t('qq101.hot')}
            </NTag>
          ) : null}
        </div>
        {!expanded.value && row.position && mode === 'ranked' ? (
          <PositionLabels positions={[positionLabel(row.position)]} />
        ) : null}
        {compact.value && row.kind === 'augment' ? (
          <span class="text-[10px] opacity-45">
            {t(`qq101.rarities.${row.rarity ?? 'unknown'}`)}
          </span>
        ) : null}

        {mode === 'classic' ? (
          <PositionLabels
            positions={(
              classicLanes.find((hero) => hero.classicChampionId === id)?.positions ?? []
            ).map(positionLabel)}
          />
        ) : null}
      </div>
    </div>
  )
}

const columns = computed<DataTableColumns<RankingRow>>(() => {
  const result: DataTableColumns<RankingRow> = [
    {
      ...rankColumnPresentation,
      render: (row, index) =>
        row.kind === 'augment'
          ? ((useWinRank.value ? row.winRank : row.rank) ?? '—')
          : row.kind === 'pair'
            ? (row.rank ?? '—')
            : index + 1
    },
    {
      title: t(
        `qq101.columns.${board === 'augments' ? 'augment' : board === 'synergies' ? 'pair' : 'champion'}`
      ),
      key: 'name',
      minWidth: board === 'synergies' ? 280 : compact.value ? 142 : 170,
      filter: true,
      filterMultiple: false,
      filterOptionValue: committedValue.value || null,
      renderFilterMenu: () => (
        <div
          class="w-52 p-2"
          onCompositionstart={handleCompositionStart}
          onCompositionend={handleCompositionEnd}
        >
          <NInput
            value={inputValue.value}
            onUpdateValue={handleUpdateValue}
            size="small"
            clearable
            autofocus
            placeholder={t('qq101.search')}
          />
        </div>
      ),

      render: (row) => (
        <div
          class={
            row.kind === 'pair'
              ? 'flex min-w-0 items-center gap-2 overflow-hidden'
              : 'flex items-center gap-3 overflow-hidden'
          }
        >
          {row.ids.map((id, index) => {
            const popover =
              row.kind !== 'champion' ? (
                <NPopover trigger="hover" delay={600} showArrow={false}>
                  {{
                    trigger: () => renderIdentity(row, id),

                    default: () => (
                      <div class="flex max-w-64 flex-col gap-2 text-xs">
                        <span class="font-semibold">{nameOf(row, id)}</span>
                        <span>
                          {t('qq101.columns.winRate')} · {percent(row.winRate)}
                        </span>
                        <span>
                          {t('qq101.columns.pickRate')} · {percent(row.pickRate)}
                        </span>
                        {hasBan.value ? (
                          <span>
                            {t('qq101.columns.banRate')} · {percent(row.banRate)}
                          </span>
                        ) : null}
                        {row.kind !== 'pair' ? (
                          <span>
                            {t('qq101.columns.change')} · {changeLabel(row)}
                          </span>
                        ) : null}
                        {row.kind === 'augment'
                          ? row.info.championIds.map((championId) => (
                              <NButton
                                text
                                size="tiny"
                                onClick={() => emit('champion', championId)}
                              >
                                {resources.champions.name(championId)}
                              </NButton>
                            ))
                          : null}
                      </div>
                    )
                  }}
                </NPopover>
              ) : null
            return (
              <div key={id} class="flex min-w-0 items-center gap-2">
                {row.kind === 'pair' && index > 0 ? (
                  <span aria-hidden="true" class="shrink-0 text-black/35 dark:text-white/35">
                    ×
                  </span>
                ) : null}
                {row.kind === 'champion' ? renderIdentity(row, id) : popover}
              </div>
            )
          })}
        </div>
      )
    }
  ]
  if (mode === 'ranked' && expanded.value) {
    result.push({
      title: t('qq101.position'),
      key: 'position',
      width: 68,
      render: (row) => (
        <PositionLabels positions={row.position ? [positionLabel(row.position)] : []} />
      )
    })
  }

  if (hasTier.value) {
    result.push({
      title: t('qq101.columns.tier'),
      key: 'tier',
      width: 64,
      align: 'center',
      sorter: (a, b) => (a.tier ?? 'Z').localeCompare(b.tier ?? 'Z'),

      render: (row) => (
        <TierBadge tier={row.tier && /^T\d$/.test(row.tier) ? Number(row.tier.slice(1)) : null} />
      )
    })
  }

  if (board === 'augments' && !compact.value) {
    result.push({
      title: t('qq101.rarity'),
      key: 'rarity',
      width: 80,
      render: (row) => (
        <span class="text-xs opacity-70">{t(`qq101.rarities.${row.rarity ?? 'unknown'}`)}</span>
      )
    })
  }

  for (const metric of [
    'winRate',
    'pickRate',
    ...(hasBan.value && !compact.value ? (['banRate'] as const) : [])
  ] as const) {
    result.push({
      title: t(`qq101.columns.${metric}`),
      key: metric,
      width: compact.value ? 82 : 96,
      align: 'center',
      sorter: (a, b) => (a[metric] ?? -Infinity) - (b[metric] ?? -Infinity),

      render: (row) => (
        <span style={metric === 'winRate' ? { color: getWinRateColor(row.winRate) } : undefined}>
          {percent(row[metric])}
        </span>
      )
    })
  }

  if (board !== 'synergies' && expanded.value) {
    result.push({
      title: t('qq101.columns.change'),
      key: 'change',
      width: 100,
      align: 'right',
      sorter: (a, b) => (changeOf(a) ?? -Infinity) - (changeOf(b) ?? -Infinity),

      render: (row) => {
        const value = changeOf(row)
        return (
          <span class={value && value > 0 ? '' : 'opacity-50'}>
            {value == null
              ? '—'
              : value === 0
                ? '−'
                : `${value > 0 ? '↑' : '↓'} ${Math.abs(value)}`}
          </span>
        )
      }
    })
  }

  return result.map((column) => ({ className: statisticCellClass, ...column }))
})
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';
.ranking-table :deep(.n-data-table-th) {
  white-space: nowrap;
}
</style>
