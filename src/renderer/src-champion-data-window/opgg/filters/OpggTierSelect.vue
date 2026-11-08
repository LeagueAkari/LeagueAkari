<template>
  <NSelect
    v-bind="filterSelectDefaults"
    :value="value"
    :options="tierOptions"
    :render-label="renderTierLabel"
    :aria-label="t('opgg.filters.rankTier')"
    :placeholder="t('opgg.filters.rankTier')"
    @update:value="(value, option) => emit('update:value', value, option)"
  />
</template>

<script setup lang="ts">
import {
  filterSelectDefaults,
  type FilterSelectEvents,
  renderTierLabel
} from '@champion-data-window/components/query-filter/select-presentation'
import { NSelect } from 'naive-ui'
import type { OpggTierFilter } from '@shared/types/opgg'
import { useTierOptions } from '../utils/options'
import { useTranslation } from 'i18next-vue'

defineProps<{
  value: OpggTierFilter
}>()
const emit = defineEmits<FilterSelectEvents<OpggTierFilter>>()

const { t } = useTranslation()

const { tierOptions } = useTierOptions()
</script>
