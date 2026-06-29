<template>
  <div
    v-if="childNode"
    class="rounded border border-solid border-black/10 px-4 py-2 dark:border-white/10"
  >
    <CombinatorComp :node="childNode" />
  </div>

  <div
    v-else
    class="flex items-center justify-center rounded border border-dashed border-black/20 px-4 py-12 dark:border-white/20"
  >
    <div class="flex w-full max-w-180 flex-col items-center">
      <div class="flex flex-col items-center gap-5">
        <NDropdown trigger="click" :options="combinators" size="small" @select="handleAddNode">
          <NButton tertiary size="small" type="primary">
            <template #icon>
              <NIcon size="14"><Add20Regular /></NIcon>
            </template>
            {{ t('playerTabs.matchHistory.filters.addCondition') }}
          </NButton>
        </NDropdown>

        <span class="text-sm text-black/50 dark:text-white/50">{{
          t('playerTabs.matchHistory.filters.addFirstConditionHint')
        }}</span>
      </div>

      <div class="mt-12 w-full">
        <FilterPresetExamples />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Add20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilterEditor } from '../context'
import CombinatorComp from '../CombinatorComp.vue'
import { GameCombinator } from '../combinator-nodes'
import { getScope } from '../combinator-runtime'
import FilterPresetExamples from '../presets/FilterPresetExamples.vue'
import { createCombinatorDropdownOptions, createCombinatorNode } from '../registry'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, addNodeAndUpdateNode } = useMatchHistoryFilterEditor()

const node = computed(() => nodeMap.value[nodeId] as GameCombinator)
const childNode = computed(() => {
  if (node.value.args[0].value === null) {
    return null
  }

  return nodeMap.value[node.value.args[0].value]
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
