<template>
  <div
    class="rounded-lg border border-solid border-black/10 bg-black/2 px-4 py-3 dark:border-white/10 dark:bg-white/2"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 space-y-1">
        <div v-if="node.type === 'and'" class="flex items-center gap-1.5 text-sm font-bold">
          <NIcon size="16"><Branch20Regular /></NIcon>
          {{ t('PlayerTab.filter.matchAllRules') }}
        </div>
        <div v-else-if="node.type === 'or'" class="flex items-center gap-1.5 text-sm font-bold">
          <NIcon size="16"><BranchFork20Regular /></NIcon>
          {{ t('PlayerTab.filter.matchAnyRules') }}
        </div>

        <div class="text-xs text-black/55 dark:text-white/50">
          {{
            node.type === 'and'
              ? t('PlayerTab.filter.groupDescriptionAll')
              : t('PlayerTab.filter.groupDescriptionAny')
          }}
        </div>
      </div>

      <div class="flex flex-wrap gap-1">
        <NDropdown trigger="click" :options="ruleOptions" size="small" @select="handleAddNode">
          <NButton tertiary size="tiny" type="primary">
            <template #icon>
              <NIcon size="14"><Add20Regular /></NIcon>
            </template>
            {{ t('PlayerTab.filter.addRule') }}
          </NButton>
        </NDropdown>

        <NDropdown trigger="click" :options="groupOptions" size="small" @select="handleAddNode">
          <NButton tertiary size="tiny">
            <template #icon>
              <NIcon size="14"><Add20Regular /></NIcon>
            </template>
            {{ t('PlayerTab.filter.addGroup') }}
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

        <NodeActionButtons :node-id="nodeId" />
      </div>
    </div>

    <div v-if="childNodes.length > 0" class="mt-4 space-y-3">
      <template v-for="(childNode, index) of childNodes" :key="childNode.id">
        <div
          v-if="index > 0"
          class="flex items-center gap-2 px-2 text-[11px] text-black/45 dark:text-white/40"
        >
          <div class="h-px flex-1 bg-black/10 dark:bg-white/10" />
          <span class="rounded-full border border-black/10 px-2 py-0.5 dark:border-white/10">
            {{ node.type === 'and' ? t('PlayerTab.filter.and') : t('PlayerTab.filter.or') }}
          </span>
          <div class="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>

        <CombinatorComp :node="childNode" />
      </template>
    </div>
    <div
      v-else
      class="mt-4 flex h-20 items-center justify-center rounded-lg border border-dashed border-black/10 bg-black/3 text-xs text-black/50 dark:border-white/10 dark:bg-white/3 dark:text-white/50"
    >
      {{ t('PlayerTab.filter.addNestedRuleHint') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExchangeAlt } from '@vicons/fa'
import { Add20Regular, Branch20Regular, BranchFork20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import CombinatorComp from '../CombinatorComp.vue'
import NodeActionButtons from '../NodeActionButtons.vue'
import { AndCombinator, OrCombinator } from '../combinator-nodes'
import { getScope } from '../combinator-runtime'
import { COMBINATOR_FACTORY_MAP, getBuilderConditionOptions, getBuilderGroupOptions } from '../maps'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, addNode, updateNode } = useMatchHistoryFilters()

const node = computed(() => nodeMap.value[nodeId] as AndCombinator | OrCombinator)

const childNodes = computed(() => {
  return node.value.args.map((arg) => nodeMap.value[arg.value])
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
