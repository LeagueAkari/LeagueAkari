<template>
  <NSelect
    v-bind="filterSelectDefaults"
    :value="value"
    :options="options"
    :aria-label="t('qq101.board')"
    @update:value="(value, option) => emit('update:value', value, option)"
  />
</template>

<script setup lang="ts">
import {
  filterSelectDefaults,
  type FilterSelectEvents
} from '@champion-data-window/components/query-filter/select-presentation'
import { NSelect } from 'naive-ui'
import type { RankingBoard } from '../rankings'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

defineProps<{
  value: RankingBoard
}>()
const emit = defineEmits<FilterSelectEvents<RankingBoard>>()

const { t } = useTranslation()

const options = computed(() =>
  (['champions', 'augments', 'synergies'] as const).map((value) => ({
    value,
    label: t(`qq101.boards.${value}`)
  }))
)
</script>
