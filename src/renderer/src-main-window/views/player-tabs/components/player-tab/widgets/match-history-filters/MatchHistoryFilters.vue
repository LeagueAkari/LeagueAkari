<template>
  <div
    class="box-border flex size-full flex-col gap-2 rounded border border-solid border-white/10 bg-neutral-100 p-3 dark:bg-neutral-900"
  >
    <div class="flex items-center gap-1">
      <NIcon class="text-base"><Filter20Regular /></NIcon>
      <span class="text-base font-bold">{{ t('PlayerTab.filter.title') }}</span>
    </div>

    <NTabs size="small" type="line" :value="mode" @update:value="setMode">
      <!-- <NTab name="simple">简易筛选</NTab> -->
      <NTab name="advanced">高级筛选</NTab>
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
import { useTranslation } from 'i18next-vue'
import { NIcon, NScrollbar, NTab, NTabs } from 'naive-ui'

import { useMatchHistoryFilters } from '../../data/match-history-filters'
import Game from './combinator-components/Game.vue'

const { t } = useTranslation()

const { mode, rootNode, setMode } = useMatchHistoryFilters()
</script>
