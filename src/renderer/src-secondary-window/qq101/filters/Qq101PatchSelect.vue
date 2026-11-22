<template>
  <NSelect
    v-bind="filterSelectDefaults"
    :value="value"
    :options="options"
    :aria-label="t('qq101.patch')"
    :placeholder="t('qq101.patch')"
    :disabled="disabled || patches.length === 0"
    @update:value="(patch, option) => emit('update:value', patch, option)"
  />
</template>

<script setup lang="ts">
import {
  filterSelectDefaults,
  type FilterSelectEvents
} from '@secondary-window/components/query-filter/select-presentation'
import { NSelect } from 'naive-ui'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

const { patches, disabled = false } = defineProps<{
  value: string | null
  patches: string[]
  disabled?: boolean
}>()
const emit = defineEmits<FilterSelectEvents<string>>()

const { t } = useTranslation()

const options = computed(() => patches.map((value) => ({ value, label: value })))
</script>
