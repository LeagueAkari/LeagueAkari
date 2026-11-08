<template>
  <NSelect
    v-bind="filterSelectDefaults"
    :value="value"
    :options="positionOptions"
    :render-label="renderPositionLabel"
    :aria-label="t('opgg.filters.position')"
    :placeholder="t('opgg.filters.position')"
    @update:value="(value, option) => emit('update:value', value, option)"
  />
</template>

<script setup lang="ts">
import {
  filterSelectDefaults,
  type FilterSelectEvents,
  renderPositionLabel
} from '@champion-data-window/components/query-filter/select-presentation'
import { NSelect } from 'naive-ui'
import type { OpggRankedPosition } from '@shared/types/opgg'
import { usePositionOptions } from '../utils/options'
import { useTranslation } from 'i18next-vue'

defineProps<{
  value: OpggRankedPosition
}>()
const emit = defineEmits<FilterSelectEvents<OpggRankedPosition>>()

const { t } = useTranslation()

const { positionOptions } = usePositionOptions()
</script>
