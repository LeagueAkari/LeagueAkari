<template>
  <div class="rounded border border-solid border-black/10 px-4 py-2 dark:border-white/10">
    <div class="mb-2 flex items-center gap-2">
      <div v-if="node.type === 'anyone'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><PeopleTeam20Regular /></NIcon>
        {{ t('PlayerTab.filter.anyone') }}
      </div>
      <div v-else-if="node.type === 'everyone'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><People20Regular /></NIcon>
        {{ t('PlayerTab.filter.everyone') }}
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
      class="flex h-16 items-center justify-center rounded border border-dashed border-black/20 dark:border-white/20"
    >
      <NDropdown trigger="click" :options="combinators" size="small" @select="handleAddNode">
        <NButton tertiary size="tiny" type="primary">
          <template #icon>
            <NIcon size="14"><Add20Regular /></NIcon>
          </template>
          {{ t('PlayerTab.filter.selectCondition') }}
        </NButton>
      </NDropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Add20Regular, Delete20Regular, People20Regular, PeopleTeam20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilterEditor } from '../context'
import CombinatorComp from '../CombinatorComp.vue'
import { AnyoneCombinator, EveryoneCombinator } from '../combinator-nodes'
import { getScope } from '../combinator-runtime'
import { createCombinatorDropdownOptions, createCombinatorNode } from '../registry'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, addNodeAndUpdateNode, deleteNode } = useMatchHistoryFilterEditor()

const node = computed(() => nodeMap.value[nodeId] as AnyoneCombinator | EveryoneCombinator)

const childNode = computed(() => {
  const [childRef] = node.value.args

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

  addNodeAndUpdateNode(newNode, nodeId, {
    ...node.value,
    args: [{ kind: 'node', value: newNode.id }]
  })
}
</script>
