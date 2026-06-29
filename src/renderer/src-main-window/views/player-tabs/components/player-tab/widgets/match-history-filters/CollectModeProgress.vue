<template>
  <div
    v-if="collectState && page"
    class="border-akari-500/60 absolute top-8 right-8 z-15 flex items-center gap-3 rounded border bg-neutral-100 p-3 opacity-90 shadow-lg shadow-black/10 dark:bg-neutral-800 dark:shadow-black/30"
  >
    <div class="flex min-w-0 items-center gap-2 text-xs text-gray-800 dark:text-gray-100">
      <NSpin :size="16" />
      <div class="flex min-w-0 flex-col gap-0.5">
        <span class="whitespace-nowrap">
          {{
            t(
              collectState.isStopping
                ? 'playerTabs.matchHistory.collectMode.stoppingProgress'
                : 'playerTabs.matchHistory.collectMode.collectingProgress',
              {
                count: page.games.length,
                expected: collectState.params.expectedCount
              }
            )
          }}
        </span>
        <span class="text-[11px] whitespace-nowrap text-gray-600 dark:text-gray-400">
          {{
            t('playerTabs.matchHistory.collectMode.roundProgress', {
              current: currentRound,
              max: collectState.params.maxIteration
            })
          }}
        </span>
      </div>
    </div>

    <NButton
      size="tiny"
      secondary
      type="warning"
      :disabled="collectState.isStopping"
      @click="stopCollectMatchHistory"
    >
      <template #icon>
        <NIcon size="14"><Stop20Regular /></NIcon>
      </template>
      {{ t('playerTabs.matchHistory.collectMode.stopCollect') }}
    </NButton>
  </div>
</template>

<script setup lang="ts">
import { Stop20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NSpin } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistory } from '../../data/match-history'

const { t } = useTranslation()
const { collectState, page, stopCollectMatchHistory } = useMatchHistory()

const currentRound = computed(() => {
  if (!collectState.value) {
    return 0
  }

  const maxIteration = collectState.value.params.maxIteration
  const round = collectState.value.isStopping
    ? collectState.value.currentIteration
    : collectState.value.currentIteration + 1

  return Math.min(Math.max(round, 1), maxIteration)
})
</script>
