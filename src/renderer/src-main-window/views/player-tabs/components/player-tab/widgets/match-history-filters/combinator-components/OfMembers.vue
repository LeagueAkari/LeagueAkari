<template>
  <div class="space-y-2 rounded border border-solid border-black/10 px-4 py-2 dark:border-white/10">
    <div class="flex items-center gap-2">
      <div v-if="node.type === 'all'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><People20Regular /></NIcon>
        {{ t('playerTabs.matchHistory.filters.forAllMembers') }}
      </div>
      <div v-else-if="node.type === 'allies'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><PeopleTeam20Regular /></NIcon>
        {{ t('playerTabs.matchHistory.filters.forAllies') }}
      </div>
      <div v-else-if="node.type === 'enemies'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><PeopleSwap20Regular /></NIcon>
        {{ t('playerTabs.matchHistory.filters.forEnemies') }}
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
            {{ t('playerTabs.matchHistory.filters.selectCondition') }}
          </NButton>
        </NDropdown>

        <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
          <template #icon>
            <NIcon size="14"><Delete20Regular /></NIcon>
          </template>
          {{ t('playerTabs.matchHistory.filters.delete') }}
        </NButton>
      </div>
    </div>

    <div class="flex items-center gap-2" v-if="node.type === 'allies' || node.type === 'enemies'">
      <div class="w-20 shrink-0 text-sm text-black/80 dark:text-white/80">
        {{ t('playerTabs.matchHistory.filters.relativeTo') }}
      </div>

      <NSelectWithSummonerSearching
        size="small"
        :puuid="node.args[0].value"
        @update:puuid="handleUpdatePuuid"
        class="w-60! max-w-full"
      />

      <div class="text-xs text-black/50 italic dark:text-white/50">
        {{ t('playerTabs.matchHistory.filters.searchHint') }}
      </div>
    </div>

    <CombinatorComp v-if="childNode" :node="childNode" />
    <div
      v-else
      class="flex h-16 items-center justify-center rounded border border-dashed border-black/20 dark:border-white/20"
    >
      <NDropdown trigger="click" :options="combinators" size="small" @select="handleAddNode">
        <NButton tertiary size="tiny" type="primary">
          <template #icon>
            <NIcon size="14"><Add20Regular /></NIcon>
          </template>
          {{ t('playerTabs.matchHistory.filters.selectCondition') }}
        </NButton>
      </NDropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Add20Regular,
  Delete20Regular,
  People20Regular,
  PeopleSwap20Regular,
  PeopleTeam20Regular
} from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilterEditor } from '../context'
import CombinatorComp from '../CombinatorComp.vue'
import NSelectWithSummonerSearching from '../NSelectWithSummonerSearching.vue'
import { AllCombinator, AlliesCombinator, EnemiesCombinator, paramArg } from '../combinator-nodes'
import { getScope } from '../combinator-runtime'
import { createCombinatorDropdownOptions, createCombinatorNode } from '../registry'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, addNodeAndUpdateNode, updateNode, deleteNode } = useMatchHistoryFilterEditor()

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

const combinators = computed(() => {
  const scope = getScope(nodeId, nodeMap.value)

  return createCombinatorDropdownOptions(scope, t)
})

const handleAddNode = (key: string) => {
  const newNode = createCombinatorNode(key, nodeId)

  if (!newNode) {
    return
  }

  if (node.value.type === 'all') {
    addNodeAndUpdateNode(newNode, nodeId, {
      ...node.value,
      args: [{ kind: 'node', value: newNode.id }]
    })
  } else {
    addNodeAndUpdateNode(newNode, nodeId, {
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
