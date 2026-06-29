<template>
  <div
    v-if="horizontal"
    class="match-history-pagination border-akari-500/30 bg-akari-500/10 dark:border-akari-400/25 dark:bg-akari-400/10 flex items-center gap-3 rounded border border-solid px-2 py-1 transition-colors"
    :class="{
      'shadow-xl shadow-neutral-400 dark:shadow-neutral-800/60': isFloating
    }"
  >
    <div class="min-w-0 flex-1 truncate text-sm leading-5 text-gray-700 dark:text-gray-400">
      <span class="font-bold text-gray-900 dark:text-white">
        {{ t('playerTabs.matchHistory.collectMode.collectedPageTitle') }}
      </span>
      <span class="ml-2">
        <CollectModeDescription
          :scanned-count="scannedCount"
          :collected-games-count="collectedGamesCount"
        />
      </span>
    </div>

    <FilterButton
      size="tiny"
      :active="filterActive"
      :disabled="filterDisabled"
      @click="$emit('openFilter')"
    />

    <NButton
      class="shrink-0"
      size="tiny"
      secondary
      type="primary"
      :disabled="exitDisabled"
      @click="$emit('exit')"
    >
      {{ t('playerTabs.matchHistory.collectMode.reloadNormalPage') }}
    </NButton>
  </div>

  <div
    v-else
    class="match-history-pagination border-akari-500/30 bg-akari-500/10 dark:border-akari-400/25 dark:bg-akari-400/10 rounded border border-solid px-4 py-3 transition-colors"
    :class="{
      'shadow-xl shadow-neutral-400 dark:shadow-neutral-800/60': isFloating
    }"
  >
    <div>
      <div class="mb-3 text-base font-bold text-gray-900 dark:text-white">
        {{ t('playerTabs.matchHistory.collectMode.collectedPageTitle') }}
      </div>
      <div class="text-sm leading-relaxed text-gray-700 dark:text-gray-400">
        <CollectModeDescription
          :scanned-count="scannedCount"
          :collected-games-count="collectedGamesCount"
        />
      </div>
    </div>

    <div class="mt-3 flex items-center justify-end gap-2">
      <FilterButton
        size="tiny"
        :active="filterActive"
        :disabled="filterDisabled"
        @click="$emit('openFilter')"
      />

      <NButton size="tiny" secondary type="primary" :disabled="exitDisabled" @click="$emit('exit')">
        {{ t('playerTabs.matchHistory.collectMode.reloadNormalPage') }}
      </NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { NButton } from 'naive-ui'

import CollectModeDescription from './CollectModeDescription.vue'
import FilterButton from './FilterButton.vue'

defineProps<{
  horizontal: boolean
  isFloating: boolean
  scannedCount: number
  collectedGamesCount: number
  filterActive: boolean
  filterDisabled: boolean
  exitDisabled: boolean
}>()

defineEmits<{
  openFilter: []
  exit: []
}>()

const { t } = useTranslation()
</script>
