<template>
  <div
    class="space-y-3 rounded-lg border border-solid border-black/10 bg-black/2 px-4 py-3 dark:border-white/10 dark:bg-white/2"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0 flex-1 space-y-1">
        <div class="flex items-center gap-1.5 text-sm font-bold">
          <NIcon size="16">
            <People20Regular v-if="node.type === 'all'" />
            <PeopleTeam20Regular v-else-if="node.type === 'allies'" />
            <PeopleSwap20Regular v-else />
          </NIcon>
          {{ title }}
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

    <div
      v-if="node.type === 'allies' || node.type === 'enemies'"
      class="grid gap-2 rounded-lg border border-solid border-black/8 bg-black/2 px-3 py-2 md:grid-cols-[88px_minmax(0,1fr)] md:items-center dark:border-white/10 dark:bg-white/2"
    >
      <div class="text-xs font-medium text-black/65 dark:text-white/55">
        {{ t('PlayerTab.filter.referencePlayer') }}
      </div>

      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <NSelectWithSummonerSearching
          size="small"
          :puuid="node.args[0].value"
          @update:puuid="handleUpdatePuuid"
          class="min-w-[240px] flex-1"
        />

        <div class="text-xs text-black/50 italic dark:text-white/50">
          {{ t('PlayerTab.filter.searchHint') }}
        </div>
      </div>
    </div>

    <CombinatorComp v-if="childNode" :node="childNode" />
    <div
      v-else
      class="flex h-20 items-center justify-center rounded-lg border border-dashed border-black/10 bg-black/3 text-xs text-black/50 dark:border-white/10 dark:bg-white/3 dark:text-white/50"
    >
      {{ t('PlayerTab.filter.addNestedRuleHint') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Add20Regular,
  People20Regular,
  PeopleSwap20Regular,
  PeopleTeam20Regular
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import CombinatorComp from '../CombinatorComp.vue'
import NSelectWithSummonerSearching from '../NSelectWithSummonerSearching.vue'
import NodeActionButtons from '../NodeActionButtons.vue'
import { AllCombinator, AlliesCombinator, EnemiesCombinator, paramArg } from '../combinator-nodes'
import { getScope } from '../combinator-runtime'
import { COMBINATOR_FACTORY_MAP, getBuilderConditionOptions, getBuilderGroupOptions } from '../maps'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, addNode, updateNode } = useMatchHistoryFilters()

const node = computed(
  () => nodeMap.value[nodeId] as AllCombinator | AlliesCombinator | EnemiesCombinator
)

const childNode = computed(() => {
  if (node.value.type === 'all') {
    const [childRef] = node.value.args

    if (childRef.value === null) {
      return null
    }

    return nodeMap.value[childRef.value]
  }

  const [, childRef] = node.value.args

  if (childRef.value === null) {
    return null
  }

  return nodeMap.value[childRef.value]
})

const title = computed(() => {
  if (node.value.type === 'all') {
    return t('PlayerTab.filter.targetAllMembers')
  }

  if (node.value.type === 'allies') {
    return t('PlayerTab.filter.targetPlayerTeam')
  }

  return t('PlayerTab.filter.targetPlayerOpponents')
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
  if (node.value.type === 'all') {
    updateNode(nodeId, {
      ...node.value,
      args: [{ kind: 'node', value: newNode.id }]
    })
  } else {
    updateNode(nodeId, {
      ...node.value,
      args: [node.value.args[0], { kind: 'node', value: newNode.id }]
    })
  }
}

const handleUpdatePuuid = (summoner: string | null) => {
  if (node.value.type === 'allies' || node.value.type === 'enemies') {
    updateNode(nodeId, {
      ...node.value,
      args: [paramArg(summoner), node.value.args[1]]
    })
  }
}
</script>
