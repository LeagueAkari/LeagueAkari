<template>
  <div
    class="rounded border border-solid border-black/10 bg-black/2 px-4 py-2 dark:border-white/10 dark:bg-white/2"
  >
    <div class="mb-2 flex items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm font-bold">
        <PositionIcon class="text-base" :position="node.args[0].value" />
        {{ t('PlayerTab.filter.position') }}
      </div>

      <NodeActionButtons :node-id="nodeId" />
    </div>

    <div class="flex w-60 items-center gap-2">
      <NSelect
        :options="positionOptions"
        size="small"
        :value="node.args[0].value"
        @update:value="handleUpdatePositionId"
      />
    </div>
  </div>
</template>

<script setup lang="tsx">
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { useTranslation } from 'i18next-vue'
import { NSelect } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import NodeActionButtons from '../NodeActionButtons.vue'
import { IsPositionCombinator } from '../combinator-nodes'

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, updateNode } = useMatchHistoryFilters()

const { t } = useTranslation()

const node = computed(() => nodeMap.value[nodeId] as IsPositionCombinator)

const positionOptions = computed(() => {
  return ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'].map((position) => {
    return {
      label: t(`positions.${position}`, { ns: 'common' }),
      value: position
    }
  })
})

const handleUpdatePositionId = (value: string) => {
  updateNode(nodeId, {
    ...node.value,
    args: [{ kind: 'param', value }]
  })
}
</script>
