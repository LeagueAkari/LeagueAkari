<template>
  <div
    class="rounded border border-solid border-black/10 bg-black/2 px-4 py-2 dark:border-white/10 dark:bg-white/2"
  >
    <div class="flex items-center gap-2">
      <div v-if="node.type === 'isWin'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Trophy20Regular /></NIcon>
        是胜利对局
      </div>
      <div v-else-if="node.type === 'isLoss'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Dismiss20Regular /></NIcon>
        是失败对局
      </div>
      <div v-else-if="node.type === 'isAbort'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Pause20Regular /></NIcon>
        是终止对局
      </div>
      <div v-else-if="node.type === 'isRemake'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><ArrowRepeatAll20Regular /></NIcon>
        是重开对局
      </div>

      <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
        <template #icon>
          <NIcon size="14"><Delete20Regular /></NIcon>
        </template>
        删除
      </NButton>
    </div>

    <div class="mt-2" v-if="node.type === 'isLoss'">
      <NCheckbox
        size="small"
        :checked="node.args[0].value"
        @update:checked="handleUpdateIsSurrender"
        >以投降失败</NCheckbox
      >
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
import { NButton, NCheckbox, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import {
  IsAbortCombinator,
  IsLossCombinator,
  IsRemakeCombinator,
  IsWinCombinator
} from '../combinator-nodes'

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, deleteNode, updateNode } = useMatchHistoryFilters()

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
