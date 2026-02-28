<template>
  <div
    class="space-y-2 rounded border border-solid border-white/10 bg-black/2 px-4 py-2 dark:bg-white/2"
  >
    <div class="flex items-center gap-2">
      <div v-if="node.type === 'all'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><People20Regular /></NIcon>
        对于所有成员
      </div>
      <div v-else-if="node.type === 'allies'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><PeopleTeam20Regular /></NIcon>
        对于其友方成员
      </div>
      <div v-else-if="node.type === 'enemies'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><PeopleSwap20Regular /></NIcon>
        对于其敌方成员
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
            选择条件
          </NButton>
        </NDropdown>

        <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
          <template #icon>
            <NIcon size="14"><Delete20Regular /></NIcon>
          </template>
          删除
        </NButton>
      </div>
    </div>

    <div class="flex items-center gap-2" v-if="node.type === 'allies' || node.type === 'enemies'">
      <div class="w-12 text-sm text-black/80 dark:text-white/80">相对于</div>

      <NSelectWithSummonerSearching
        size="small"
        :puuid="node.args[0].value"
        @update:puuid="handleUpdatePuuid"
        class="w-60!"
      />

      <div class="text-xs text-black/50 italic dark:text-white/50">(提供名称和编号将进行搜索)</div>
    </div>

    <CombinatorComp v-if="childNode" :node="childNode" />
    <div
      v-else
      class="bg flex h-16 items-center justify-center rounded bg-black/5 text-xs text-black/50 dark:bg-white/5 dark:text-white/50"
    >
      需选择条件
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
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import CombinatorComp from '../CombinatorComp.vue'
import NSelectWithSummonerSearching from '../NSelectWithSummonerSearching.vue'
import { AllCombinator, AlliesCombinator, EnemiesCombinator, paramArg } from '../combinator-nodes'
import { getScope } from '../combinator-runtime'
import { ALLOWED_COMBINATORS_MAP, COMBINATOR_FACTORY_MAP } from '../maps'

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, addNode, updateNode, deleteNode } = useMatchHistoryFilters()

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

  return ALLOWED_COMBINATORS_MAP[scope].map((c) => ({
    label: c,
    key: c
  }))
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
