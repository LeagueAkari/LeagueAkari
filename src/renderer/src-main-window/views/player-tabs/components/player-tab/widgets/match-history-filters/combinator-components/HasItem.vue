<template>
  <div
    class="space-y-2 rounded border border-solid border-white/10 bg-black/2 px-4 py-2 dark:bg-white/2"
  >
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Box20Regular /></NIcon>
        拥有装备
      </div>

      <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
        <template #icon>
          <NIcon size="14"><Delete20Regular /></NIcon>
        </template>
        删除
      </NButton>
    </div>

    <div class="flex items-center gap-2">
      <div class="w-12 text-sm text-black/80 dark:text-white/80">拥有</div>
      <NSelect
        :options="itemOptions"
        :render-label="renderLabel"
        size="small"
        filterable
        :value="node.args[0].value"
        @update:value="handleUpdateItemId"
        class="w-60!"
      />
    </div>

    <div class="flex items-center gap-2">
      <div class="w-12 text-sm text-black/80 dark:text-white/80">位于</div>
      <NSelect
        :options="orderOptions"
        size="small"
        :value="orderValue"
        @update:value="handleUpdateOrder"
        class="w-60!"
      />
    </div>
  </div>
</template>

<script setup lang="tsx">
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Box20Regular, Delete20Regular } from '@vicons/fluent'
import { NButton, NIcon, NSelect, SelectOption } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import { HasItemCombinator } from '../combinator-nodes'

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, updateNode, deleteNode } = useMatchHistoryFilters()

const lcs = useLeagueClientStore()

const node = computed(() => nodeMap.value[nodeId] as HasItemCombinator)

const orderValue = computed(() => node.value.args[1]?.value ?? -1)

const renderLabel = (option: SelectOption) => {
  if (option.type === 'group') {
    return <span>{option.label as string}</span>
  }
  return (
    <div class="flex items-center gap-2">
      <ItemDisplay itemId={option.value as number} size={20} />
      <span class="truncate text-sm">{option.label as string}</span>
    </div>
  )
}

const itemOptions = computed(() => {
  return Object.values(lcs.gameData.items)
    .filter((item) => item.id > 0)
    .map((item) => ({ label: item.name, value: item.id }))
    .toSorted((a, b) => (a.label as string).localeCompare(b.label as string))
})

const orderOptions = computed(() => [
  { label: '任意位置', value: -1 },
  { label: '第 1 个', value: 0 },
  { label: '第 2 个', value: 1 },
  { label: '第 3 个', value: 2 },
  { label: '第 4 个', value: 3 },
  { label: '第 5 个', value: 4 },
  { label: '第 6 个', value: 5 }
])

const handleUpdateItemId = (value: number) => {
  updateNode(nodeId, {
    ...node.value,
    args: [{ kind: 'param', value }, node.value.args[1] ?? { kind: 'param', value: -1 }]
  })
}

const handleUpdateOrder = (value: number) => {
  updateNode(nodeId, {
    ...node.value,
    args: [node.value.args[0], { kind: 'param', value }]
  })
}
</script>
