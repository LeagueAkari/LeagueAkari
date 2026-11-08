<template>
  <NSelect
    v-bind="filterSelectDefaults"
    :value="value"
    :options="options"
    :aria-label="t('qq101.rarity')"
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

const { includeUnknown } = defineProps<{
  value: string
  includeUnknown?: boolean
}>()
const emit = defineEmits<FilterSelectEvents<string>>()

const { t } = useTranslation()

const options = computed(() => {
  const values = ['all', 'kSilver', 'kGold', 'kPrismatic']
  if (includeUnknown) {
    values.push('unknown')
  }

  return values.map((value) => ({
    value,
    label: t(value === 'all' ? 'qq101.all' : `qq101.rarities.${value}`)
  }))
})
</script>
