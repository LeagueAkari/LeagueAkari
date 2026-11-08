<template>
  <NSelect
    v-bind="filterSelectDefaults"
    :value="value"
    :options="options"
    filterable
    clearable
    :aria-label="t('qq101.details.champion')"
    :placeholder="t('qq101.details.champion')"
    @update:value="(value, option) => emit('update:value', value, option)"
  />
</template>

<script setup lang="ts">
import {
  filterSelectDefaults,
  type FilterSelectEvents
} from '@champion-data-window/components/query-filter/select-presentation'
import { NSelect } from 'naive-ui'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

const { championIds, value } = defineProps<{
  value: number | null
  championIds: number[]
}>()
const emit = defineEmits<FilterSelectEvents<number | null>>()

const { t } = useTranslation()

const resources = useAkariResourceProvider()
const options = computed(() =>
  [...new Set(value ? [...championIds, value] : championIds)].map((id) => ({
    value: id,
    label: resources.champions.name(id)
  }))
)
</script>
