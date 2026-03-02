<template>
  <component v-if="renderComponent" :is="renderComponent" :node-id="renderNode.id" />
  <div
    class="rounded border border-solid border-black/10 bg-black/2 p-2 dark:border-white/10 dark:bg-white/2"
    v-else
  >
    {{ renderNode.type }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../data/match-history-filters'
import { CombinatorNode, isNodeArg } from './combinator-nodes'
import { COMPONENT_MAP } from './maps'

const props = defineProps<{
  node: CombinatorNode
}>()

const { nodeMap } = useMatchHistoryFilters()

const renderNode = computed(() => {
  if (props.node.type !== 'not') {
    return props.node
  }

  const childRef = props.node.args[0]

  if (!isNodeArg(childRef) || !childRef.value) {
    return props.node
  }

  return nodeMap.value[childRef.value] ?? props.node
})

const renderComponent = computed(() => {
  return COMPONENT_MAP[renderNode.value.type as keyof typeof COMPONENT_MAP] ?? null
})
</script>
