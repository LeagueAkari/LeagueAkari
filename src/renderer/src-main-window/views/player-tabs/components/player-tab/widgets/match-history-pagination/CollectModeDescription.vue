<template>
  <TranslationComponent :translation="t('PlayerTab.collectMode.collectedPageDescription')">
    <template #scanned>
      <TranslationComponent
        :translation="
          t('PlayerTab.collectMode.scannedMatches', {
            count: scannedCount
          })
        "
      >
        <template #count>
          <span class="collect-mode-count">{{ scannedCount }}</span>
        </template>
      </TranslationComponent>
    </template>
    <template #collected>
      <TranslationComponent
        :translation="
          t('PlayerTab.collectMode.collectedMatches', {
            count: collectedGamesCount
          })
        "
      >
        <template #count>
          <span class="collect-mode-count">{{ collectedGamesCount }}</span>
        </template>
      </TranslationComponent>
    </template>
  </TranslationComponent>
</template>

<script setup lang="ts">
import { TranslationComponent, useTranslation } from 'i18next-vue'

defineProps<{
  scannedCount: number
  collectedGamesCount: number
}>()

const { t } = useTranslation()
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.collect-mode-count {
  @apply text-akari-700 dark:text-akari-300 font-bold;
}
</style>
