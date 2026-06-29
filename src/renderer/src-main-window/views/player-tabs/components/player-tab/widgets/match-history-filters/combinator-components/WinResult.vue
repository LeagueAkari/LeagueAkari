<template>
  <div class="rounded border border-solid border-black/10 px-4 py-2 dark:border-white/10">
    <div class="flex items-center gap-2">
      <div v-if="node.type === 'isWin'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Trophy20Regular /></NIcon>
        {{ t('playerTabs.matchHistory.filters.isWin') }}
      </div>
      <div v-else-if="node.type === 'isLoss'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Dismiss20Regular /></NIcon>
        {{ t('playerTabs.matchHistory.filters.isLoss') }}
      </div>
      <div v-else-if="node.type === 'isAbort'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Pause20Regular /></NIcon>
        {{ t('playerTabs.matchHistory.filters.isAbort') }}
      </div>
      <div v-else-if="node.type === 'isRemake'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><ArrowRepeatAll20Regular /></NIcon>
        {{ t('playerTabs.matchHistory.filters.isRemake') }}
      </div>

      <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
        <template #icon>
          <NIcon size="14"><Delete20Regular /></NIcon>
        </template>
        {{ t('playerTabs.matchHistory.filters.delete') }}
      </NButton>
    </div>

    <div class="mt-2" v-if="node.type === 'isLoss'">
      <NCheckbox
        size="small"
        :checked="node.args[0].value"
        @update:checked="handleUpdateIsSurrender"
        >{{ t('playerTabs.matchHistory.filters.surrenderLoss') }}</NCheckbox
      >
    </div>
    <div v-else class="mt-2 text-xs text-black/50 dark:text-white/50">
      {{ t(`playerTabs.matchHistory.filters.descriptions.${node.type}`) }}
    </div>
  </div>
</template>

<script setup lang="tsx">
import {
  ArrowRepeatAll20Regular,
  Delete20Regular,
  Dismiss20Regular,
  Pause20Regular,
  Trophy20Regular
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilterEditor } from '../context'
import {
  IsAbortCombinator,
  IsLossCombinator,
  IsRemakeCombinator,
  IsWinCombinator
} from '../combinator-nodes'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, updateNode, deleteNode } = useMatchHistoryFilterEditor()

const node = computed(
  () =>
    nodeMap.value[nodeId] as
      | IsAbortCombinator
      | IsRemakeCombinator
      | IsWinCombinator
      | IsLossCombinator
)

const handleUpdateIsSurrender = (value: boolean) => {
  updateNode(nodeId, {
    ...node.value,
    args: [{ kind: 'param', value }]
  })
}
</script>
