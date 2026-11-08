<template>
  <div class="h-full">
    <div v-if="error" class="p-4">
      <NAlert type="error" :show-icon="true" :title="t('selfImprovement.errors.loadFailedTitle')">
        {{ t('selfImprovement.errors.loadFailed', { reason: error }) }}
      </NAlert>
    </div>

    <NEmpty
      v-if="!isConnected"
      class="py-16"
      :description="t('selfImprovement.player.notConnected')"
    />

    <div v-else-if="isWaitingForSgp" class="p-4">
      <NAlert type="info" :show-icon="true">
        {{ t('selfImprovement.waitingSgp') }}
      </NAlert>
    </div>

    <div
      v-else-if="isLoading && visibleMatches.length === 0"
      class="flex flex-col items-center gap-3 py-16"
    >
      <NSpin size="large" />
      <span class="text-xs text-black/50 dark:text-white/50">{{ loadingText }}</span>
    </div>

    <NEmpty
      v-else-if="visibleMatches.length === 0 && !error"
      class="py-16"
      :description="t('selfImprovement.empty.noMatches')"
    />

    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue'
import { NAlert, NEmpty, NSpin } from 'naive-ui'

import { useSelfImprovementPageContext } from '../context'

const { t } = useTranslation()
const { error, isConnected, isWaitingForSgp, isLoading, loadingText, visibleMatches } =
  useSelfImprovementPageContext()
</script>
