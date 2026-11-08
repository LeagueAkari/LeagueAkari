<template>
  <NSelect
    v-bind="filterSelectDefaults"
    :value="value"
    :options="options"
    :render-label="renderPositionLabel"
    :aria-label="t('qq101.position')"
    @update:value="(value, option) => emit('update:value', value, option)"
  />
</template>

<script setup lang="ts" generic="T extends string">
import {
  filterSelectDefaults,
  type FilterSelectEvents,
  renderPositionLabel
} from '@champion-data-window/components/query-filter/select-presentation'
import { NSelect } from 'naive-ui'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

const { positions } = defineProps<{
  value: T | null
  positions: readonly T[]
}>()
const emit = defineEmits<FilterSelectEvents<T>>()

const { t } = useTranslation()

const options = computed(() =>
  positions.map((value) => ({
    value,
    label: t(`qq101.positions.${value === 'SUPPORT' ? 'utility' : value.toLowerCase()}`)
  }))
)
</script>
