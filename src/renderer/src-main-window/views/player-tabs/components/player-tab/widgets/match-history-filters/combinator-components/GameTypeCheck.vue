<template>
  <div
    class="rounded border border-solid border-black/10 bg-black/2 px-4 py-2 dark:border-white/10 dark:bg-white/2"
  >
    <div class="flex items-center gap-2">
      <div v-if="node.type === 'isMatchedGame'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Games20Regular /></NIcon>
        {{ t('PlayerTab.filter.isMatchedGame') }}
      </div>
      <div
        v-else-if="node.type === 'isPveGame'"
        class="flex items-center gap-1.5 text-sm font-bold"
      >
        <NIcon size="16"><Games20Regular /></NIcon>
        {{ t('PlayerTab.filter.isPveGame') }}
      </div>

      <NodeActionButtons :node-id="nodeId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Games20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import NodeActionButtons from '../NodeActionButtons.vue'
import type { CombinatorNode } from '../combinator-nodes'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap } = useMatchHistoryFilters()

const node = computed(
  () =>
    nodeMap.value[nodeId] as CombinatorNode<'isMatchedGame', []> | CombinatorNode<'isPveGame', []>
)
</script>
