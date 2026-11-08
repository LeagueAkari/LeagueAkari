<template>
  <NSelect
    v-bind="filterSelectDefaults"
    :value="value"
    :options="regionOptions"
    :render-label="renderRegionLabel"
    :aria-label="t('opgg.filters.region')"
    :placeholder="t('opgg.filters.region')"
    @update:value="(value, option) => emit('update:value', value, option)"
  />
</template>

<script setup lang="tsx">
import {
  filterSelectDefaults,
  type FilterSelectEvents
} from '@champion-data-window/components/query-filter/select-presentation'
import { NSelect, type SelectRenderLabel } from 'naive-ui'
import type { OpggRegion } from '@shared/types/opgg'
import FilterLabel from '@champion-data-window/components/query-filter/FilterLabel.vue'
import { useRegionOptions } from '../utils/options'
import { useTranslation } from 'i18next-vue'

defineProps<{
  value: OpggRegion
}>()
const emit = defineEmits<FilterSelectEvents<OpggRegion>>()

const { t } = useTranslation()

const { regionOptions } = useRegionOptions()

const renderRegionLabel: SelectRenderLabel = (option) => (
  <FilterLabel
    label={String(option.label ?? '')}
    flag={typeof option.flag === 'string' ? option.flag : undefined}
    icon="region"
  />
)
</script>
