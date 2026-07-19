<template>
  <div class="flex shrink-0 items-center gap-2">
    <FilterButton
      :label="t('playerTabs.matchHistory.filters.pageFilter')"
      :active="active"
      :disabled="disabled"
      @click="$emit('openFilter')"
    />

    <NButton
      v-if="active"
      size="small"
      tertiary
      type="warning"
      :disabled="disabled"
      @click="$emit('clearFilters')"
    >
      {{ t('playerTabs.profile.clearFilters') }}
    </NButton>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { NButton } from 'naive-ui'

import FilterButton from './FilterButton.vue'

defineProps<{
  active: boolean
  disabled: boolean
}>()

defineEmits<{
  openFilter: []
  clearFilters: []
}>()

const { t } = useTranslation()
</script>
