<template>
  <div
    v-if="childNode"
    class="rounded border border-solid border-black/10 bg-black/2 px-4 py-2 dark:border-white/10 dark:bg-white/2"
  >
    <CombinatorComp :node="childNode" />
  </div>

  <!-- empty placeholder -->
  <div v-else class="flex h-44 items-center justify-center rounded bg-black/5 dark:bg-white/5">
    <div class="flex flex-col items-center gap-6">
      <NDropdown trigger="click" :options="combinators" size="small" @select="handleAddNode">
        <NButton tertiary size="small" type="primary">
          <template #icon>
            <NIcon size="14"><Add20Regular /></NIcon>
          </template>
          {{ t('PlayerTab.filter.addCondition') }}
        </NButton>
      </NDropdown>

      <span class="text-sm text-black/50 dark:text-white/50">{{
        t('PlayerTab.filter.addFirstConditionHint')
      }}</span>
    </div>
  </div>

  <!-- test -->
  <!-- <div class="flex items-center gap-4">
    <div class="ml-4 h-px flex-1 bg-black/10 dark:bg-white/5"></div>
    <div class="flex items-center gap-3">
      <NButton size="tiny" secondary>和</NButton>
      <span class="text-xs text-black/10 dark:text-white/10">/</span>
      <NButton size="tiny" secondary>或</NButton>
    </div>
    <div class="mr-4 h-px flex-1 bg-black/10 dark:bg-white/5"></div>
  </div> -->
</template>

<script setup lang="ts">
import { Add20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import CombinatorComp from '../CombinatorComp.vue'
import { GameCombinator } from '../combinator-nodes'
import { getScope } from '../combinator-runtime'
import { ALLOWED_COMBINATORS_MAP, COMBINATOR_FACTORY_MAP } from '../maps'

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
