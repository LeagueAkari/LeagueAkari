<template>
  <NSelect
    v-bind="filterSelectDefaults"
    :value="value"
    :options="options"
    @update:value="(value, option) => emit('update:value', value, option)"
  />
</template>

<script setup lang="ts">
import {
  filterSelectDefaults,
  type FilterSelectEvents
} from '@champion-data-window/components/query-filter/select-presentation'
import { NSelect } from 'naive-ui'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

const { camps, campLabel } = defineProps<{
  value: string
  camps: (string | null)[]
  campLabel: (code: string) => string
}>()
const emit = defineEmits<FilterSelectEvents<string>>()

const { t } = useTranslation()

const options = computed(() => [
  { value: 'all', label: t('qq101.all') },
  ...[...new Set(camps)]
    .filter((camp): camp is string => Boolean(camp))
    .map((value) => ({ value, label: campLabel(value) }))
])
</script>
