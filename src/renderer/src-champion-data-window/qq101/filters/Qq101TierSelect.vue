<template>
  <NSelect
    v-bind="filterSelectDefaults"
    :value="value"
    :options="tierOptions"
    :render-label="renderTierLabel"
    :aria-label="t('qq101.tier')"
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
import { useTierOptions } from './tiers'
import { useTranslation } from 'i18next-vue'

defineProps<{
  value: number
}>()
const emit = defineEmits<FilterSelectEvents<number>>()

const { t } = useTranslation()

const { tierOptions } = useTierOptions()
</script>
