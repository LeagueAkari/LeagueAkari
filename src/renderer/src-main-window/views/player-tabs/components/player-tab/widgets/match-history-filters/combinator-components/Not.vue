<template>
  <div
    class="rounded border border-solid border-black/10 bg-black/2 px-4 py-2 dark:border-white/10 dark:bg-white/2"
  >
    <div class="mb-2 flex items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Prohibited20Regular /></NIcon>
        {{ t('PlayerTab.filter.notMatch') }}
      </div>

      <div class="flex gap-1">
        <NDropdown
          trigger="click"
          :options="combinators"
          size="small"
          @select="handleAddNode"
          :disabled="childNode !== null"
        >
          <NButton tertiary size="tiny" type="primary" :disabled="childNode !== null">
            <template #icon>
              <NIcon size="14"><Add20Regular /></NIcon>
            </template>
            {{ t('PlayerTab.filter.selectCondition') }}
          </NButton>
        </NDropdown>

        <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
          <template #icon>
            <NIcon size="14"><Delete20Regular /></NIcon>
          </template>
          {{ t('PlayerTab.filter.delete') }}
        </NButton>
      </div>
    </div>

    <CombinatorComp v-if="childNode" :node="childNode" />
    <div
      v-else
      class="bg flex h-16 items-center justify-center rounded bg-black/5 text-xs text-black/50 dark:bg-white/5 dark:text-white/50"
    >
      {{ t('PlayerTab.filter.needAddCondition') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { Add20Regular, Delete20Regular, Prohibited20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'

const { t } = useTranslation()
import CombinatorComp from '../CombinatorComp.vue'
import { NotCombinator } from '../combinator-nodes'
import { getScope } from '../combinator-runtime'
import { ALLOWED_COMBINATORS_MAP, COMBINATOR_FACTORY_MAP } from '../maps'

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, addNode, updateNode, deleteNode } = useMatchHistoryFilters()

const node = computed(() => nodeMap.value[nodeId] as NotCombinator)

const childNode = computed(() => {
  const [childRef] = node.value.args

  if (childRef.value === null) {
    return null
  }

  return nodeMap.value[childRef.value]
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
    args: [{ kind: 'node', value: newNode.id }]
  })
}
</script>
