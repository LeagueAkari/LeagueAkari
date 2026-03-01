<template>
  <div
    class="rounded border border-solid border-black/10 bg-black/2 px-4 py-2 dark:border-white/10 dark:bg-white/2"
  >
    <div class="mb-2 flex items-center gap-2">
      <div v-if="node.type === 'and'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Branch20Regular /></NIcon>
        {{ t('PlayerTab.filter.and') }}
      </div>
      <div v-else-if="node.type === 'or'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><BranchFork20Regular /></NIcon>
        {{ t('PlayerTab.filter.or') }}
      </div>

      <div class="flex gap-1">
        <NDropdown trigger="click" :options="combinators" size="small" @select="handleAddNode">
          <NButton tertiary size="tiny" type="primary">
            <template #icon>
              <NIcon size="14"><Add20Regular /></NIcon>
            </template>
            {{ t('PlayerTab.filter.add') }}
          </NButton>
        </NDropdown>

        <NButton tertiary size="tiny" @click="handleChangeType">
          <template #icon>
            <NIcon size="14"><ExchangeAlt /></NIcon>
          </template>
          {{ node.type === 'and' ? t('PlayerTab.filter.switchToOr') : t('PlayerTab.filter.switchToAnd') }}
        </NButton>

        <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
          <template #icon>
            <NIcon size="14"><Delete20Regular /></NIcon>
          </template>
          {{ t('PlayerTab.filter.delete') }}
        </NButton>
      </div>
    </div>

    <div class="space-y-1" v-if="childNodes.length > 0">
      <CombinatorComp v-for="childNode of childNodes" :node="childNode" />
    </div>
    <div
      v-else
      class="bg flex h-16 items-center justify-center rounded bg-black/5 text-xs text-black/50 dark:bg-white/5 dark:text-white/50"
    >
      {{ t('PlayerTab.filter.needAddCondition') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExchangeAlt } from '@vicons/fa'
import { Add20Regular, Branch20Regular, BranchFork20Regular, Delete20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import CombinatorComp from '../CombinatorComp.vue'
import { AndCombinator, OrCombinator } from '../combinator-nodes'
import { getScope } from '../combinator-runtime'
import { ALLOWED_COMBINATORS_MAP, COMBINATOR_FACTORY_MAP } from '../maps'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, addNode, updateNode, deleteNode } = useMatchHistoryFilters()

const node = computed(() => nodeMap.value[nodeId] as AndCombinator | OrCombinator)

const childNodes = computed(() => {
  return node.value.args.map((arg) => nodeMap.value[arg.value])
})

const combinators = computed(() => {
  const scope = getScope(nodeId, nodeMap.value)

  return ALLOWED_COMBINATORS_MAP[scope].map((c) => ({
    label: t(`PlayerTab.filter.combinatorLabels.${c}`),
    key: c
  }))
})

const handleAddNode = (key: string) => {
  const newNode = COMBINATOR_FACTORY_MAP[key as keyof typeof COMBINATOR_FACTORY_MAP](nodeId)

  addNode(newNode)
  updateNode(nodeId, {
    ...node.value,
    args: [...node.value.args, { kind: 'node', value: newNode.id }]
  })
}

const handleChangeType = () => {
  updateNode(nodeId, {
    ...node.value,
    type: node.value.type === 'and' ? 'or' : 'and'
  })
}
</script>
