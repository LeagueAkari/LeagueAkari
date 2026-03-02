<template>
  <div
    class="rounded-lg border border-solid border-amber-400/25 bg-amber-500/5 px-4 py-3 dark:border-amber-300/20 dark:bg-amber-300/6"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 space-y-1">
        <div class="flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-200">
          <NIcon size="16"><Prohibited20Regular /></NIcon>
          {{ t('PlayerTab.filter.excludeRulesTitle') }}
        </div>

        <div class="text-xs text-black/55 dark:text-white/50">
          {{ t('PlayerTab.filter.excludeRulesHint') }}
        </div>
      </div>

      <div class="flex flex-wrap gap-1">
        <NDropdown
          trigger="click"
          :options="ruleOptions"
          size="small"
          @select="handleAddNode"
          :disabled="childNode !== null"
        >
          <NButton tertiary size="tiny" type="primary" :disabled="childNode !== null">
            <template #icon>
              <NIcon size="14"><Add20Regular /></NIcon>
            </template>
            {{ t('PlayerTab.filter.addRule') }}
          </NButton>
        </NDropdown>

        <NDropdown
          trigger="click"
          :options="groupOptions"
          size="small"
          @select="handleAddNode"
          :disabled="childNode !== null"
        >
          <NButton tertiary size="tiny" :disabled="childNode !== null">
            <template #icon>
              <NIcon size="14"><Add20Regular /></NIcon>
            </template>
            {{ t('PlayerTab.filter.addGroup') }}
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

    <div class="mt-4">
      <CombinatorComp v-if="childNode" :node="childNode" />
      <div
        v-else
        class="flex h-20 items-center justify-center rounded-lg border border-dashed border-amber-400/25 bg-black/3 text-xs text-black/50 dark:bg-white/3 dark:text-white/50"
      >
        {{ t('PlayerTab.filter.addNestedRuleHint') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Add20Regular, Delete20Regular, Prohibited20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import CombinatorComp from '../CombinatorComp.vue'
import { NotCombinator } from '../combinator-nodes'
import { getScope } from '../combinator-runtime'
import { COMBINATOR_FACTORY_MAP, getBuilderConditionOptions, getBuilderGroupOptions } from '../maps'

const { t } = useTranslation()

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

const ruleOptions = computed(() => {
  const scope = getScope(nodeId, nodeMap.value)

  return getBuilderConditionOptions(scope, t)
})

const groupOptions = computed(() => {
  const scope = getScope(nodeId, nodeMap.value)

  return getBuilderGroupOptions(scope, t, {
    exclude: ['not']
  })
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
