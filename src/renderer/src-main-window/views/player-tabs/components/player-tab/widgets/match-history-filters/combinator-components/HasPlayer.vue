<template>
  <div
    class="rounded border border-solid border-black/10 bg-black/2 px-4 py-2 dark:border-white/10 dark:bg-white/2"
  >
    <div class="mb-2 flex items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Person20Regular /></NIcon>
        对局包含玩家
      </div>

      <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
        <template #icon>
          <NIcon size="14"><Delete20Regular /></NIcon>
        </template>
        删除
      </NButton>
    </div>

    <div class="flex items-center gap-2">
      <div class="w-12 text-sm text-black/80 dark:text-white/80">PUUID</div>
      <NInput
        size="small"
        placeholder="玩家 PUUID"
        :value="node.args[0].value"
        @update:value="handleUpdatePuuid"
        class="w-60!"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Delete20Regular, Person20Regular } from '@vicons/fluent'
import { NButton, NIcon, NInput } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import type { CombinatorNode } from '../combinator-nodes'

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, updateNode, deleteNode } = useMatchHistoryFilters()

const node = computed(
  () => nodeMap.value[nodeId] as CombinatorNode<'hasPlayer', [{ kind: 'param'; value: string }]>
)

const handleUpdatePuuid = (value: string) => {
  updateNode(nodeId, {
    ...node.value,
    args: [{ kind: 'param', value }]
  })
}
</script>
