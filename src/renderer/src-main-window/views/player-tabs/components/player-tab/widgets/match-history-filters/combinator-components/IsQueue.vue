<template>
  <div
    class="rounded border border-solid border-black/10 bg-black/2 px-4 py-2 dark:border-white/10 dark:bg-white/2"
  >
    <div class="mb-2 flex items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Apps20Regular /></NIcon>
        {{ t('PlayerTab.filter.queue') }}
      </div>

      <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
        <template #icon>
          <NIcon size="14"><Delete20Regular /></NIcon>
        </template>
        {{ t('PlayerTab.filter.delete') }}
      </NButton>
    </div>

    <div class="flex w-60 items-center gap-2">
      <NSelect
        :options="queueOptions"
        size="small"
        :value="node.args[0].value"
        @update:value="handleUpdateQueueId"
      />
    </div>
  </div>
</template>

<script setup lang="tsx">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Apps20Regular } from '@vicons/fluent'
import { Delete20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NSelect } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import { IsQueueCombinator } from '../combinator-nodes'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, updateNode, deleteNode } = useMatchHistoryFilters()

const sgps = useSgpStore()

const node = computed(() => nodeMap.value[nodeId] as IsQueueCombinator)

const lcs = useLeagueClientStore()

const queueOptions = computed(() => {
  return sgps.supportedQueues.map((queue) => {
    return {
      label: lcs.gameData.queueName(queue),
      value: queue
    }
  })
})

const handleUpdateQueueId = (value: number) => {
  updateNode(nodeId, {
    ...node.value,
    args: [{ kind: 'param', value }]
  })
}
</script>
