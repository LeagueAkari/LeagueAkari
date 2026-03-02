<template>
  <div class="space-y-3">
    <div
      v-if="childNode && canPromoteToRootGroup"
      class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-solid border-black/10 bg-black/2 px-4 py-3 dark:border-white/10 dark:bg-white/2"
    >
      <div class="text-xs text-black/55 dark:text-white/50">
        {{ t('PlayerTab.filter.addNestedRuleHint') }}
      </div>

      <div class="flex flex-wrap gap-1">
        <NDropdown
          trigger="click"
          :options="rootRuleOptions"
          size="small"
          @select="handlePromoteAndAddNode"
        >
          <NButton tertiary size="tiny" type="primary">
            <template #icon>
              <NIcon size="14"><Add20Regular /></NIcon>
            </template>
            {{ t('PlayerTab.filter.addRule') }}
          </NButton>
        </NDropdown>

        <NDropdown
          trigger="click"
          :options="rootGroupOptions"
          size="small"
          @select="handlePromoteAndAddNode"
        >
          <NButton tertiary size="tiny">
            <template #icon>
              <NIcon size="14"><Add20Regular /></NIcon>
            </template>
            {{ t('PlayerTab.filter.addGroup') }}
          </NButton>
        </NDropdown>
      </div>
    </div>

    <CombinatorComp v-if="childNode" :node="childNode" />

    <div
      v-else
      class="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-black/10 bg-black/3 p-6 dark:border-white/10 dark:bg-white/2"
    >
      <div class="flex max-w-md flex-col items-center gap-4 text-center">
        <div
          class="flex size-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/5"
        >
          <NIcon size="20"><Add20Regular /></NIcon>
        </div>
        <div class="space-y-1">
          <div class="text-sm font-semibold">{{ t('PlayerTab.filter.addFirstRule') }}</div>
          <div class="text-xs text-black/55 dark:text-white/50">
            {{ t('PlayerTab.filter.addFirstRuleHint') }}
          </div>
        </div>
        <div class="flex flex-wrap justify-center gap-2">
          <NDropdown
            trigger="click"
            :options="rootRuleOptions"
            size="small"
            @select="handleAddFirstNode"
          >
            <NButton size="small" type="primary">
              <template #icon>
                <NIcon size="14"><Add20Regular /></NIcon>
              </template>
              {{ t('PlayerTab.filter.addRule') }}
            </NButton>
          </NDropdown>

          <NDropdown
            trigger="click"
            :options="rootGroupOptions"
            size="small"
            @select="handleAddFirstNode"
          >
            <NButton size="small">
              <template #icon>
                <NIcon size="14"><Add20Regular /></NIcon>
              </template>
              {{ t('PlayerTab.filter.addGroup') }}
            </NButton>
          </NDropdown>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Add20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import CombinatorComp from '../CombinatorComp.vue'
import { createAndCombinator } from '../combinator-factories'
import { GameCombinator, nodeArg } from '../combinator-nodes'
import { getScope } from '../combinator-runtime'
import { COMBINATOR_FACTORY_MAP, getBuilderConditionOptions, getBuilderGroupOptions } from '../maps'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, addNode, updateNode } = useMatchHistoryFilters()

const node = computed(() => nodeMap.value[nodeId] as GameCombinator)
const childNode = computed(() => {
  if (node.value.args[0].value === null) {
    return null
  }

  return nodeMap.value[node.value.args[0].value]
})

const canPromoteToRootGroup = computed(() => {
  return !!childNode.value && !['and', 'or'].includes(childNode.value.type)
})

const rootRuleOptions = computed(() => {
  const scope = getScope(nodeId, nodeMap.value)

  return getBuilderConditionOptions(scope, t)
})

const rootGroupOptions = computed(() => {
  const scope = getScope(nodeId, nodeMap.value)

  return getBuilderGroupOptions(scope, t, {
    exclude: ['and']
  })
})

const attachFirstNode = (key: string) => {
  const rootGroup = createAndCombinator(nodeId)
  const newNode = COMBINATOR_FACTORY_MAP[key as keyof typeof COMBINATOR_FACTORY_MAP](rootGroup.id)

  addNode(rootGroup)
  addNode(newNode)

  updateNode(rootGroup.id, {
    ...rootGroup,
    args: [nodeArg(newNode.id)]
  })
  updateNode(nodeId, {
    ...node.value,
    args: [nodeArg(rootGroup.id)]
  })
}

const handleAddFirstNode = (key: string) => {
  attachFirstNode(key)
}

const handlePromoteAndAddNode = (key: string) => {
  if (!childNode.value) {
    attachFirstNode(key)
    return
  }

  const currentChild = childNode.value
  const rootGroup = createAndCombinator(nodeId, {
    args: [{ kind: 'node', value: currentChild.id }]
  })
  const newNode = COMBINATOR_FACTORY_MAP[key as keyof typeof COMBINATOR_FACTORY_MAP](rootGroup.id)

  updateNode(currentChild.id, {
    ...currentChild,
    parentId: rootGroup.id
  })
  addNode(rootGroup)
  addNode(newNode)

  updateNode(rootGroup.id, {
    ...rootGroup,
    args: [nodeArg(currentChild.id), nodeArg(newNode.id)]
  })
  updateNode(nodeId, {
    ...node.value,
    args: [nodeArg(rootGroup.id)]
  })
}
</script>
