<template>
  <div
    class="space-y-2 rounded border border-solid border-black/10 bg-black/2 px-4 py-2 dark:border-white/10 dark:bg-white/2"
  >
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Box20Regular /></NIcon>
        {{ t('PlayerTab.filter.hasItem') }}
      </div>

      <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
        <template #icon>
          <NIcon size="14"><Delete20Regular /></NIcon>
        </template>
        {{ t('PlayerTab.filter.delete') }}
      </NButton>
    </div>

    <div class="flex items-center gap-2">
      <div class="w-20 text-sm text-black/80 dark:text-white/80">
        {{ t('PlayerTab.filter.have') }}
      </div>
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
      <div class="w-20 text-sm text-black/80 dark:text-white/80">
        {{ t('PlayerTab.filter.atPosition') }}
      </div>
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
import { Box20Regular } from '@vicons/fluent'
import { Delete20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NSelect, SelectOption } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import { HasItemCombinator } from '../combinator-nodes'

const { t } = useTranslation()

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
  { label: t('PlayerTab.filter.anyPosition'), value: -1 },
  { label: t('PlayerTab.filter.positionN', { n: 1 }), value: 0 },
  { label: t('PlayerTab.filter.positionN', { n: 2 }), value: 1 },
  { label: t('PlayerTab.filter.positionN', { n: 3 }), value: 2 },
  { label: t('PlayerTab.filter.positionN', { n: 4 }), value: 3 },
  { label: t('PlayerTab.filter.positionN', { n: 5 }), value: 4 },
  { label: t('PlayerTab.filter.positionN', { n: 6 }), value: 5 }
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
