<template>
  <div>
    <component v-if="nodeComponent" :is="nodeComponent" :node-id="node.id" />
    <div class="rounded border border-solid border-black/10 p-2 dark:border-white/10" v-else>
      {{ node.type }}
    </div>

    <NDropdown
      v-if="canInsertSibling"
      trigger="click"
      :options="siblingCombinators"
      size="small"
      @select="handleInsertSibling"
    >
      <div class="mt-3 mb-1 flex items-center gap-4">
        <div class="min-w-0 flex-1 border-t border-black/10 dark:border-white/10" />
        <NButton tertiary size="tiny" type="primary">
          <template #icon>
            <NIcon size="14"><Add20Regular /></NIcon>
          </template>
          {{ t('PlayerTab.filter.add') }}
        </NButton>
        <div class="min-w-0 flex-1 border-t border-black/10 dark:border-white/10" />
      </div>
    </NDropdown>
  </div>
</template>

<script setup lang="ts">
import { Add20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilterEditor } from './context'
import { CombinatorNode } from './combinator-nodes'
import { getScope } from './combinator-runtime'
import {
  createCombinatorNode,
  getCombinatorComponent,
  createCombinatorDropdownOptions
} from './registry'

const props = defineProps<{
  node: CombinatorNode
}>()

const { t } = useTranslation()
const { nodeMap, insertSiblingWithOr } = useMatchHistoryFilterEditor()

const nodeComponent = computed(() => getCombinatorComponent(props.node.type))

const parentNode = computed(() => {
  if (!props.node.parentId) {
    return null
  }

  return nodeMap.value[props.node.parentId] ?? null
})

const siblingCombinators = computed(() => {
  if (!parentNode.value) {
    return []
  }

  const scope = getScope(parentNode.value.id, nodeMap.value)

  return createCombinatorDropdownOptions(scope, t)
})

const canInsertSibling = computed(() => {
  if (!parentNode.value) {
    return false
  }

  if (parentNode.value.type === 'and' || parentNode.value.type === 'or') {
    return false
  }

  return siblingCombinators.value.length > 0
})

const handleInsertSibling = (key: string) => {
  if (!props.node.parentId) {
    return
  }

  const newNode = createCombinatorNode(key, props.node.parentId)

  if (!newNode) {
    return
  }

  insertSiblingWithOr(props.node.id, newNode)
}
</script>
