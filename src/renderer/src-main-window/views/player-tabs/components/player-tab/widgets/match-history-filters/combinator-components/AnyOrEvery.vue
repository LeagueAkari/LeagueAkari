<template>
  <div
    class="rounded-lg border border-solid border-black/10 bg-black/2 px-4 py-3 dark:border-white/10 dark:bg-white/2"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 space-y-1">
        <div v-if="node.type === 'anyone'" class="flex items-center gap-1.5 text-sm font-bold">
          <NIcon size="16"><PeopleTeam20Regular /></NIcon>
          {{ t('PlayerTab.filter.targetAnyMember') }}
        </div>
        <div
          v-else-if="node.type === 'everyone'"
          class="flex items-center gap-1.5 text-sm font-bold"
        >
          <NIcon size="16"><People20Regular /></NIcon>
          {{ t('PlayerTab.filter.targetEveryMember') }}
        </div>

        <div class="text-xs text-black/55 dark:text-white/50">
          {{ t('PlayerTab.filter.addNestedRuleHint') }}
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

        <NodeActionButtons :node-id="nodeId" />
      </div>
    </div>

    <div class="mt-4">
      <CombinatorComp v-if="childNode" :node="childNode" />
      <div
        v-else
        class="flex h-20 items-center justify-center rounded-lg border border-dashed border-black/10 bg-black/3 text-xs text-black/50 dark:border-white/10 dark:bg-white/3 dark:text-white/50"
      >
        {{ t('PlayerTab.filter.addNestedRuleHint') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Add20Regular, People20Regular, PeopleTeam20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import CombinatorComp from '../CombinatorComp.vue'
import NodeActionButtons from '../NodeActionButtons.vue'
import { AnyoneCombinator, EveryoneCombinator } from '../combinator-nodes'
import { getScope } from '../combinator-runtime'
import { COMBINATOR_FACTORY_MAP, getBuilderConditionOptions, getBuilderGroupOptions } from '../maps'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, addNode, updateNode } = useMatchHistoryFilters()

const node = computed(() => nodeMap.value[nodeId] as AnyoneCombinator | EveryoneCombinator)

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

  return getBuilderGroupOptions(scope, t)
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
