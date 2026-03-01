<template>
  <div
    class="rounded border border-solid border-black/10 bg-black/2 px-4 py-2 dark:border-white/10 dark:bg-white/2"
  >
    <div class="flex items-center gap-2">
      <div v-if="node.type === 'isMatchedGame'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Games20Regular /></NIcon>
        是匹配对局
      </div>
      <div
        v-else-if="node.type === 'isPveGame'"
        class="flex items-center gap-1.5 text-sm font-bold"
      >
        <NIcon size="16"><Games20Regular /></NIcon>
        是 PVE 对局
      </div>

      <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
        <template #icon>
          <NIcon size="14"><Delete20Regular /></NIcon>
        </template>
        删除
      </NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Delete20Regular, Games20Regular } from '@vicons/fluent'
import { NButton, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import type { CombinatorNode } from '../combinator-nodes'

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, deleteNode } = useMatchHistoryFilters()

const node = computed(
  () =>
    nodeMap.value[nodeId] as CombinatorNode<'isMatchedGame', []> | CombinatorNode<'isPveGame', []>
)
</script>
