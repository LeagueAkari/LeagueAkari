<template>
  <NSelect
    v-bind="filterSelectDefaults"
    :value="value"
    :options="options"
    :aria-label="t('opgg.filters.version')"
    :placeholder="t('opgg.filters.version')"
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

const { versions } = defineProps<{
  value: string | null
  versions: string[]
}>()
const emit = defineEmits<FilterSelectEvents<string>>()

const { t } = useTranslation()

const options = computed(() => versions.map((value) => ({ value, label: value })))
</script>
