<template>
  <NSelect
    v-bind="filterSelectDefaults"
    :value="value"
    :options="options"
    :aria-label="t('qq101.mode')"
    @update:value="(value, option) => emit('update:value', value, option)"
  />
</template>

<script setup lang="ts" generic="T extends Qq101ChampionDataMode">
import {
  filterSelectDefaults,
  type FilterSelectEvents
} from '@champion-data-window/components/query-filter/select-presentation'
import { NSelect } from 'naive-ui'
import type { Qq101ChampionDataMode } from '@shared/types/champion-data'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

const { modes } = defineProps<{
  value: T
  modes: readonly T[]
}>()
const emit = defineEmits<FilterSelectEvents<T>>()

const { t } = useTranslation()

const options = computed(() => modes.map((value) => ({ value, label: t(`qq101.modes.${value}`) })))
</script>
