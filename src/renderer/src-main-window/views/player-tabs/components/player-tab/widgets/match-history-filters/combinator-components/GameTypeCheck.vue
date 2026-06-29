<template>
  <div class="rounded border border-solid border-black/10 px-4 py-2 dark:border-white/10">
    <div class="flex items-center gap-2">
      <div v-if="node.type === 'isMatchedGame'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Games20Regular /></NIcon>
        {{ t('playerTabs.matchHistory.filters.isMatchedGame') }}
      </div>
      <div
        v-else-if="node.type === 'isPveGame'"
        class="flex items-center gap-1.5 text-sm font-bold"
      >
        <NIcon size="16"><Games20Regular /></NIcon>
        {{ t('playerTabs.matchHistory.filters.isPveGame') }}
      </div>

      <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
        <template #icon>
          <NIcon size="14"><Delete20Regular /></NIcon>
        </template>
        {{ t('playerTabs.matchHistory.filters.delete') }}
      </NButton>
    </div>

    <div class="mt-2 text-xs text-black/50 dark:text-white/50">
      {{ t(`playerTabs.matchHistory.filters.descriptions.${node.type}`) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { Games20Regular } from '@vicons/fluent'
import { Delete20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilterEditor } from '../context'
import type { CombinatorNode } from '../combinator-nodes'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, deleteNode } = useMatchHistoryFilterEditor()

const node = computed(
  () =>
    nodeMap.value[nodeId] as CombinatorNode<'isMatchedGame', []> | CombinatorNode<'isPveGame', []>
)
</script>
