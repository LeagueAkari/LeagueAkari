<template>
  <NSelect
    v-bind="filterSelectDefaults"
    :value="value"
    :options="options"
    :aria-label="t('qq101.role')"
    @update:value="(value, option) => emit('update:value', value, option)"
  />
</template>

<script setup lang="ts">
import {
  filterSelectDefaults,
  type FilterSelectEvents
} from '@champion-data-window/components/query-filter/select-presentation'
import { NSelect } from 'naive-ui'
import type { Qq101Role } from '@shared/http-api-axios-helper/qq101'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

defineProps<{
  value: Qq101Role
}>()
const emit = defineEmits<FilterSelectEvents<Qq101Role>>()

const { t } = useTranslation()

const options = computed(() =>
  (['all', 'tank', 'fighter', 'assassin', 'mage', 'marksman', 'support'] as const).map((value) => ({
    value,
    label: t(value === 'all' ? 'qq101.all' : `qq101.roles.${value}`)
  }))
)
</script>
