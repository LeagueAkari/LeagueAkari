<template>
  <div class="flex shrink-0 items-center gap-0.5">
    <NTooltip v-for="position in ORDERED_CHAMPION_POSITIONS" :key="position">
      <template #trigger>
        <NButton
          circle
          size="tiny"
          :secondary="positionModel === position"
          :quaternary="positionModel !== position"
          :type="positionModel === position ? 'primary' : 'default'"
          :focusable="false"
          :aria-label="positionFilterLabel(position)"
          :aria-pressed="positionModel === position"
          @click="togglePosition(position)"
        >
          <template #icon>
            <PositionIcon :position="position" class="text-sm" />
          </template>
        </NButton>
      </template>
      {{ positionLabel(position) }}
    </NTooltip>
  </div>
</template>

<script setup lang="ts">
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { useTranslation } from 'i18next-vue'
import { NButton, NTooltip } from 'naive-ui'

import { ORDERED_CHAMPION_POSITIONS, type OrderedChampionPosition } from './types'

const positionModel = defineModel<OrderedChampionPosition | null>({ default: null })
const { t } = useTranslation()

const positionLabel = (position: OrderedChampionPosition) =>
  t(`positions.${position}`, { ns: 'common' })

const positionFilterLabel = (position: OrderedChampionPosition) =>
  t('automation.orderedChampionList.positionFilter', {
    position: positionLabel(position)
  })

const togglePosition = (position: OrderedChampionPosition) => {
  positionModel.value = positionModel.value === position ? null : position
}
</script>
