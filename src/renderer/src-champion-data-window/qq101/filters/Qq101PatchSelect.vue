<template>
  <NSelect
    v-bind="filterSelectDefaults"
    :value="value ?? (includeLatest ? '' : null)"
    :options="options"
    :aria-label="t('qq101.patch')"
    @update:value="
      (patch, option) => emit('update:value', includeLatest && patch === '' ? null : patch, option)
    "
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

const { patches, includeLatest } = defineProps<{
  value: string | null
  patches: string[]
  includeLatest?: boolean
}>()
const emit = defineEmits<FilterSelectEvents<string | null>>()

const { t } = useTranslation()

const options = computed(() => {
  const versions = patches.map((value) => ({ value, label: value }))
  return includeLatest ? [{ value: '', label: t('qq101.latest') }, ...versions] : versions
})
</script>
