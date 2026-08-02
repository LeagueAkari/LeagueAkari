<template>
  <div
    class="match-history-pagination border-akari-500/30 bg-akari-500/10 dark:border-akari-400/25 dark:bg-akari-400/10 flex flex-col gap-3 rounded border border-solid px-4 py-3 transition-colors @[480px]:flex-row @[480px]:items-center @[480px]:px-2 @[480px]:py-1"
    :class="{
      'shadow-xl shadow-neutral-400 dark:shadow-neutral-800/60': isFloating
    }"
  >
    <div
      class="min-w-0 flex-1 text-sm leading-relaxed text-gray-700 @[480px]:truncate @[480px]:leading-5 dark:text-gray-400"
    >
      <div
        class="mb-3 text-base font-bold text-gray-900 @[480px]:mb-0 @[480px]:inline @[480px]:text-sm dark:text-white"
      >
        {{ t('playerTabs.matchHistory.collectMode.collectedPageTitle') }}
      </div>
      <div class="@[480px]:ml-2 @[480px]:inline">
        <CollectModeDescription
          :scanned-count="scannedCount"
          :collected-games-count="collectedGamesCount"
        />
      </div>
    </div>

    <div class="flex shrink-0 items-center justify-end gap-2">
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
