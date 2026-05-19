<template>
  <div
    class="relative overflow-hidden rounded border border-solid px-4 py-2"
    :class="
      node.type === 'and'
        ? 'border-emerald-500/35 dark:border-emerald-300/40'
        : 'border-sky-500/35 dark:border-sky-300/40'
    "
  >
    <div
      class="absolute top-0 bottom-0 left-0 w-0.75 rounded-l"
      :class="node.type === 'and' ? 'bg-emerald-500/70' : 'bg-sky-500/70'"
    />

    <div class="flex items-center gap-2">
      <div
        v-if="node.type === 'and'"
        class="flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300"
      >
        <NIcon size="16"><Branch20Regular /></NIcon>
        {{ t('PlayerTab.filter.and') }}
      </div>
      <div
        v-else-if="node.type === 'or'"
        class="flex items-center gap-1.5 text-sm font-bold text-sky-700 dark:text-sky-300"
      >
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
          {{
            node.type === 'and'
              ? t('PlayerTab.filter.switchToOr')
              : t('PlayerTab.filter.switchToAnd')
          }}
        </NButton>

        <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
          <template #icon>
            <NIcon size="14"><Delete20Regular /></NIcon>
          </template>
          {{ t('PlayerTab.filter.delete') }}
        </NButton>
      </div>
    </div>

    <div class="mt-2 space-y-1">
      <CombinatorComp v-for="childNode of childNodes" :node="childNode" />

      <div
        v-if="childNodes.length === 0"
        class="flex h-14 items-center justify-center rounded border border-dashed border-black/20 dark:border-white/20"
      >
        <NDropdown trigger="click" :options="combinators" size="small" @select="handleAddNode">
          <NButton tertiary size="tiny" type="primary">
            <template #icon>
              <NIcon size="14"><Add20Regular /></NIcon>
            </template>
            {{ t('PlayerTab.filter.add') }}
          </NButton>
        </NDropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExchangeAlt } from '@vicons/fa'
import { Add20Regular, Branch20Regular, BranchFork20Regular, Delete20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilterEditor } from '../context'
import CombinatorComp from '../CombinatorComp.vue'
import { AndCombinator, OrCombinator } from '../combinator-nodes'
import { getScope } from '../combinator-runtime'
import { createCombinatorDropdownOptions, createCombinatorNode } from '../registry'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, addNodeAndUpdateNode, updateNode, deleteNode } = useMatchHistoryFilterEditor()

const node = computed(() => nodeMap.value[nodeId] as AndCombinator | OrCombinator)

const childNodes = computed(() => {
  return node.value.args.map((arg) => nodeMap.value[arg.value])
})

const combinators = computed(() => {
  const scope = getScope(nodeId, nodeMap.value)

  return createCombinatorDropdownOptions(scope, t)
})

const handleAddNode = (key: string) => {
  const newNode = createCombinatorNode(key, nodeId)

  if (!newNode) {
    return
  }

  addNodeAndUpdateNode(newNode, nodeId, {
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
