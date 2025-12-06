<template>
  <div
    v-if="summoner?.privacy === 'PRIVATE'"
    class="px-4 py-2 dark:bg-red-800/20 bg-red-800 text-white rounded"
  >
    <div class="text-base font-bold mb-2">{{ t('MatchHistoryTab.private.title') }}</div>
    <div class="text-13px">
      {{ t('MatchHistoryTab.private.content') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'

import { useSummoner } from '../data/summoner'

const { t } = useTranslation()

const { summoner } = useSummoner()
</script>
