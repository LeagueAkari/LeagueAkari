<template>
  <div class="space-y-2 rounded border border-solid border-black/10 px-4 py-2 dark:border-white/10">
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><component :is="numberBetweenIcon" /></NIcon>
        {{ t(`playerTabs.matchHistory.filters.combinatorLabels.${node.type}`) }}
      </div>

      <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
        <template #icon>
          <NIcon size="14"><Delete20Regular /></NIcon>
        </template>
        {{ t('playerTabs.matchHistory.filters.delete') }}
      </NButton>
    </div>

    <div v-if="supportsMeasureMode" class="flex items-center gap-2">
      <div class="w-20 shrink-0 text-sm text-black/80 dark:text-white/80">
        {{ t('playerTabs.matchHistory.filters.measureMode') }}
      </div>

      <NSelect
        class="w-60! max-w-full"
        :options="measureModeOptions"
        size="small"
        :value="measureMode"
        @update:value="handleUpdateMeasureMode"
      />
    </div>

    <div class="flex items-center gap-2">
      <div class="w-20 shrink-0 text-sm text-black/80 dark:text-white/80">
        {{ rangeLabel('min') }}
      </div>

      <NInputNumber
        class="w-40! max-w-full"
        :show-button="false"
        size="small"
        :value="minValue"
        @update:value="(val) => handleUpdateNumberBetween(val ?? 0, maxValue)"
        :status="isWrong ? 'warning' : 'success'"
      />
    </div>

    <div class="flex items-center gap-2">
      <div class="w-20 shrink-0 text-sm text-black/80 dark:text-white/80">
        {{ rangeLabel('max') }}
      </div>

      <NInputNumber
        class="w-40! max-w-full"
        :show-button="false"
        size="small"
        :value="maxValue"
        @update:value="(val) => handleUpdateNumberBetween(minValue, val ?? 0)"
        :status="isWrong ? 'warning' : 'success'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AccessTime20Regular,
  BuildingRetailShield20Regular,
  CheckmarkStarburst20Regular,
  DataBarVertical20Regular,
  Dismiss20Regular,
  Eye20Regular,
  FoodGrains20Regular,
  Gauge20Regular,
  Handshake20Regular,
  HeartPulse20Regular,
  Money20Regular,
  MoneyHand20Regular,
  NumberSymbol20Regular,
  PeopleTeam20Regular,
  Shield20Regular,
  Target20Regular
} from '@vicons/fluent'
import { Delete20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NInputNumber, NSelect } from 'naive-ui'
import { type Component, computed } from 'vue'

import { useMatchHistoryFilterEditor } from '../context'
import {
  type NumberBetweenCombinator,
  type NumberBetweenMeasureMode,
  paramArg
} from '../combinator-nodes'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, updateNode, deleteNode } = useMatchHistoryFilterEditor()

const NUMBER_BETWEEN_ICON_MAP = {
  durationBetween: AccessTime20Regular,
  kdaBetween: NumberSymbol20Regular,
  killsBetween: Target20Regular,
  deathsBetween: Dismiss20Regular,
  assistsBetween: Handshake20Regular,
  goldBetween: Money20Regular,
  levelBetween: CheckmarkStarburst20Regular,
  csBetween: FoodGrains20Regular,
  killParticipationBetween: PeopleTeam20Regular,
  damageDealtToChampionsBetween: Target20Regular,
  physicalDamageDealtToChampionsBetween: DataBarVertical20Regular,
  magicDamageDealtToChampionsBetween: DataBarVertical20Regular,
  trueDamageDealtToChampionsBetween: DataBarVertical20Regular,
  damageTakenBetween: Shield20Regular,
  physicalDamageTakenBetween: Shield20Regular,
  magicDamageTakenBetween: Shield20Regular,
  trueDamageTakenBetween: Shield20Regular,
  goldSpentBetween: MoneyHand20Regular,
  damageToTowersBetween: BuildingRetailShield20Regular,
  healBetween: HeartPulse20Regular,
  visionScoreBetween: Eye20Regular,
  timeCCingOthersBetween: AccessTime20Regular,
  dgrBetween: Gauge20Regular,
  soloKillsBetween: Target20Regular,
  doubleKillsBetween: CheckmarkStarburst20Regular,
  tripleKillsBetween: CheckmarkStarburst20Regular,
  quadraKillsBetween: CheckmarkStarburst20Regular,
  pentaKillsBetween: CheckmarkStarburst20Regular
} satisfies Record<string, Component>

const MEASURE_MODE_TYPES = new Set([
  'killsBetween',
  'deathsBetween',
  'assistsBetween',
  'goldBetween',
  'csBetween',
  'damageDealtToChampionsBetween',
  'physicalDamageDealtToChampionsBetween',
  'magicDamageDealtToChampionsBetween',
  'trueDamageDealtToChampionsBetween',
  'damageTakenBetween',
  'physicalDamageTakenBetween',
  'magicDamageTakenBetween',
  'trueDamageTakenBetween',
  'goldSpentBetween',
  'damageToTowersBetween',
  'healBetween',
  'visionScoreBetween',
  'timeCCingOthersBetween',
  'soloKillsBetween',
  'doubleKillsBetween',
  'tripleKillsBetween',
  'quadraKillsBetween',
  'pentaKillsBetween'
])

const node = computed(() => nodeMap.value[nodeId] as NumberBetweenCombinator)

const numberBetweenIcon = computed(
  () => NUMBER_BETWEEN_ICON_MAP[node.value.type] ?? NumberSymbol20Regular
)

const supportsMeasureMode = computed(() => MEASURE_MODE_TYPES.has(node.value.type))

const hasMeasureModeArg = computed(() => typeof node.value.args[0]?.value === 'string')

const measureMode = computed<NumberBetweenMeasureMode>(() => {
  if (!supportsMeasureMode.value || !hasMeasureModeArg.value) {
    return 'value'
  }

  return node.value.args[0].value as NumberBetweenMeasureMode
})

const minValue = computed<number>(() => {
  return hasMeasureModeArg.value
    ? Number(node.value.args[1]?.value ?? 0)
    : Number(node.value.args[0]?.value ?? 0)
})

const maxValue = computed<number>(() => {
  return hasMeasureModeArg.value
    ? Number(node.value.args[2]?.value ?? 0)
    : Number(node.value.args[1]?.value ?? 0)
})

const measureModeOptions = computed(() => [
  { label: t('playerTabs.matchHistory.filters.measureModes.value'), value: 'value' },
  { label: t('playerTabs.matchHistory.filters.measureModes.teamShare'), value: 'teamShare' },
  { label: t('playerTabs.matchHistory.filters.measureModes.teamMaxShare'), value: 'teamMaxShare' },
  { label: t('playerTabs.matchHistory.filters.measureModes.gameShare'), value: 'gameShare' },
  { label: t('playerTabs.matchHistory.filters.measureModes.gameMaxShare'), value: 'gameMaxShare' }
])

const rangeLabel = (type: 'min' | 'max') => {
  if (measureMode.value === 'value') {
    return t(`playerTabs.matchHistory.filters.${type}`)
  }

  return t(`playerTabs.matchHistory.filters.${type}Percent`)
}

const toArgs = (mode: NumberBetweenMeasureMode, min: number, max: number) => {
  if (!supportsMeasureMode.value) {
    return [paramArg(min), paramArg(max)]
  }

  return [paramArg(mode), paramArg(min), paramArg(max)]
}

const handleUpdateNumberBetween = (min: number, max: number) => {
  updateNode(nodeId, {
    ...node.value,
    args: toArgs(measureMode.value, min, max)
  })
}

const handleUpdateMeasureMode = (mode: NumberBetweenMeasureMode) => {
  updateNode(nodeId, {
    ...node.value,
    args: toArgs(
      mode,
      mode === 'value' ? minValue.value : 0,
      mode === 'value' ? maxValue.value : 100
    )
  })
}

const isWrong = computed(() => {
  return minValue.value > maxValue.value
})
</script>
