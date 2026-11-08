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

defineProps<{
  value: number
}>()
const emit = defineEmits<FilterSelectEvents<number>>()

const { t } = useTranslation()

const options = computed(() =>
  [100, 200].map((value) => ({ value, label: t(`qq101.details.team${value}`) }))
)
</script>
