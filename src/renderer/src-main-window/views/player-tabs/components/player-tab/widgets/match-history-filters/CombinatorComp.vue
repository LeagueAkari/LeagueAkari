<template>
  <component v-if="node.type in COMPONENT_MAP" :is="COMPONENT_MAP[node.type]" :node-id="node.id" />
  <div
    class="rounded border border-solid border-black/10 bg-black/2 p-2 dark:border-white/10 dark:bg-white/2"
    v-else
  >
    {{ node.type }}
  </div>
</template>

<script setup lang="ts">
import { CombinatorNode } from './combinator-nodes'
import { COMPONENT_MAP } from './maps'

defineProps<{
  node: CombinatorNode
}>()
</script>
