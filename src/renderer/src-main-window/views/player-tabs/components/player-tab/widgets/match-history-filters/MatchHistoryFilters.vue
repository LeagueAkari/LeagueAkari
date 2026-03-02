<template>
  <div
    class="box-border flex size-full flex-col gap-3 rounded-lg border border-solid border-white/10 bg-neutral-100 p-3 dark:bg-neutral-900"
  >
    <div
      class="flex items-start justify-between gap-3 rounded-lg border border-solid border-black/8 bg-black/2 px-3 py-2 dark:border-white/10 dark:bg-white/3"
    >
      <div class="flex min-w-0 items-start gap-3">
        <NIcon class="mt-0.5 text-base"><Filter20Regular /></NIcon>
        <div class="min-w-0 flex-1">
          <div class="text-base font-bold">{{ t('PlayerTab.filter.title') }}</div>
          <div class="mt-1 text-xs text-black/55 dark:text-white/50">
            {{ t('PlayerTab.filter.subtitle') }}
          </div>
        </div>
      </div>

      <NButton v-if="rootHasCombinator" tertiary size="tiny" type="warning" @click="clearFilters">
        <template #icon>
          <NIcon size="14"><RefreshFilled /></NIcon>
        </template>
        {{ t('PlayerTab.filter.resetAll') }}
      </NButton>
    </div>

    <!-- TODO：实现两种模式 -->
    <NTabs v-if="false" size="small" type="line" :value="mode" @update:value="setMode">
      <NTab name="advanced">{{ t('PlayerTab.filter.advancedTab') }}</NTab>
    </NTabs>

    <div class="min-h-0 flex-1">
      <NScrollbar>
        <Game :nodeId="rootNode.id" />
      </NScrollbar>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { Filter20Regular } from '@vicons/fluent'
import { RefreshFilled } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NScrollbar, NTab, NTabs } from 'naive-ui'

import { useMatchHistoryFilters } from '../../data/match-history-filters'
import Game from './combinator-components/Game.vue'

const { t } = useTranslation()

const { mode, rootNode, rootHasCombinator, clearFilters, setMode } = useMatchHistoryFilters()
</script>
