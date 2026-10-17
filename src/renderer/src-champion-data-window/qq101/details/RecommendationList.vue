<template>
  <div class="p-3" :class="{ 'grid grid-cols-2 gap-x-3': hasTwoColumns }">
    <component
      :is="section.title === 'skillOrder' ? SkillOrderDisplay : RecommendationRow"
      v-for="(row, index) in rows"
      :key="index"
      :rank="index + 1"
      v-bind="
        section.title === 'skillOrder'
          ? { priority: abilities(row, 0), order: abilities(row, 1) }
          : {}
      "
    >
      <template
        v-for="(cell, cellIndex) in section.title === 'skillOrder' ? [] : row"
        :key="cellIndex"
      >
        <div v-if="!isMetric(section.columns[cellIndex])" class="min-w-0">
          <template v-if="cell.kind === 'entities'">
            <ItemBuildDisplay v-if="cell.entity === 'item'" :item-ids="cell.ids" />
            <SummonerSpellsDisplay v-else-if="cell.entity === 'spell'" :spell-ids="cell.ids" />
            <PerkSelection v-else-if="cell.entity === 'perk'" :perk-ids="cell.ids" />
            <div v-else class="flex min-w-0 flex-wrap items-center gap-1">
              <template v-for="(id, idIndex) in cell.ids" :key="`${id}:${idIndex}`">
                <ChampionLink
                  v-if="cell.entity === 'champion'"
                  :champion-id="id"
                  @select="emit('champion', $event)"
                />
                <AugmentLabel v-else :augment-id="id" />
              </template>
            </div>
          </template>
          <FilterLabel
            v-else-if="cell.kind === 'position'"
            :position="cell.value"
            :label="
              t(
                `qq101.positions.${cell.value === 'SUPPORT' ? 'utility' : cell.value.toLowerCase()}`
              )
            "
          />
          <FilterLabel
            v-else-if="cell.kind === 'tier'"
            icon="tier"
            :rank="tierIcons[cell.value]"
            :label="t(`qq101.tiers.${cell.value}`)"
          />
          <span v-else-if="cell.kind === 'text'" class="leading-6">{{ cell.text || '—' }}</span>
        </div>
      </template>
      <template #metrics>
        <template v-for="(cell, cellIndex) in row" :key="cellIndex">
          <StatisticValue
            v-if="isMetric(section.columns[cellIndex]) && cell.kind === 'text'"
            :inline="section.title === 'skillOrder'"
            :label="t(`qq101.details.${section.columns[cellIndex]}`)"
            :color="metricStyle(section.columns[cellIndex], cell.text)?.color"
          >
            {{ cell.text || '—' }}
            <template
              v-if="section.title !== 'skillOrder' && section.columns[cellIndex] !== 'winRate'"
              #caption
              >{{ t(`qq101.details.${section.columns[cellIndex]}`) }}</template
            >
          </StatisticValue>
        </template>
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import {
  useWinRateTheme,
  useTierTheme
} from '@champion-data-window/components/champion-statistics/theme'
import { useTranslation } from 'i18next-vue'
import AugmentLabel from '@champion-data-window/components/champion-statistics/AugmentLabel.vue'
import ChampionLink from '@champion-data-window/components/champion-statistics/ChampionLink.vue'
import ItemBuildDisplay from '@champion-data-window/components/champion-statistics/ItemBuildDisplay.vue'
import PerkSelection from '@champion-data-window/components/champion-statistics/PerkSelection.vue'
import SummonerSpellsDisplay from '@champion-data-window/components/champion-statistics/SummonerSpellsDisplay.vue'
import StatisticValue from '@champion-data-window/components/champion-statistics/StatisticValue.vue'
import RecommendationRow from '@champion-data-window/components/champion-statistics/RecommendationRow.vue'
import SkillOrderDisplay from '@champion-data-window/components/champion-statistics/SkillOrderDisplay.vue'
import type { DetailCell, DetailTable } from './presentation'
import FilterLabel from '@champion-data-window/components/query-filter/FilterLabel.vue'
import { tierIcons } from '../filters'
import { computed } from 'vue'

const { section } = defineProps<{ section: DetailTable; rows: DetailCell[][] }>()

const emit = defineEmits<{ champion: [id: number] }>()

const { t } = useTranslation()
const { getWinRateColor } = useWinRateTheme()
const { getTierColors } = useTierTheme()

const hasTwoColumns = computed(() =>
  ['boots', 'items', 'fourth', 'fifth', 'sixth'].includes(section.title)
)

const abilities = (row: DetailCell[], index: number) => {
  const cell = row[index]

  return cell?.kind === 'abilities' ? cell.values : []
}

const isMetric = (key: string) =>
  ['pickRate', 'winRate', 'banRate', 'games', 'rank', 'grade', 'share', 'matchupRate'].includes(key)

const metricStyle = (key: string, value: string) => {
  if (key === 'winRate') {
    return { color: getWinRateColor(value === '—' ? null : Number.parseFloat(value) / 100) }
  }

  if (key === 'grade') {
    return { color: getTierColors(['S', 'A', 'B', 'C', 'D', 'E', 'F'].indexOf(value)).color }
  }

  return undefined
}
</script>
