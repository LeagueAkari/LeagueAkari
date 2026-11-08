<template>
  <NSelect
    v-bind="filterSelectDefaults"
    :value="value"
    :options="modeOptions"
    :aria-label="t('opgg.filters.mode')"
    :placeholder="t('opgg.filters.mode')"
    @update:value="(value, option) => emit('update:value', value, option)"
  />
</template>

<script setup lang="ts">
import {
  filterSelectDefaults,
  type FilterSelectEvents
} from '@champion-data-window/components/query-filter/select-presentation'
import { NSelect } from 'naive-ui'
import type { OpggChampionDataMode } from '@shared/types/opgg'
import { useModeOptions } from '../utils/options'
import { useTranslation } from 'i18next-vue'

defineProps<{
  value: OpggChampionDataMode
}>()
const emit = defineEmits<FilterSelectEvents<OpggChampionDataMode>>()

const { t } = useTranslation()

const { modeOptions } = useModeOptions()
</script>
