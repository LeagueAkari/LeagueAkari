<template>
  <div
    class="rounded border border-solid border-black/10 bg-black/2 px-4 py-2 dark:border-white/10 dark:bg-white/2"
  >
    <div class="flex items-center gap-2">
      <div v-if="node.type === 'isWin'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Trophy20Regular /></NIcon>
        {{ t('PlayerTab.filter.isWin') }}
      </div>
      <div v-else-if="node.type === 'isLoss'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Dismiss20Regular /></NIcon>
        {{ t('PlayerTab.filter.isLoss') }}
      </div>
      <div v-else-if="node.type === 'isAbort'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Pause20Regular /></NIcon>
        {{ t('PlayerTab.filter.isAbort') }}
      </div>
      <div v-else-if="node.type === 'isRemake'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><ArrowRepeatAll20Regular /></NIcon>
        {{ t('PlayerTab.filter.isRemake') }}
      </div>

      <NodeActionButtons :node-id="nodeId" />
    </div>

    <div class="mt-2" v-if="node.type === 'isLoss'">
      <NCheckbox
        size="small"
        :checked="node.args[0].value"
        @update:checked="handleUpdateIsSurrender"
        >{{ t('PlayerTab.filter.surrenderLoss') }}</NCheckbox
      >
    </div>
  </div>
</template>

<script setup lang="tsx">
import {
  ArrowRepeatAll20Regular,
  Dismiss20Regular,
  Pause20Regular,
  Trophy20Regular
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NCheckbox, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import NodeActionButtons from '../NodeActionButtons.vue'
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

const { nodeMap, updateNode } = useMatchHistoryFilters()

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
