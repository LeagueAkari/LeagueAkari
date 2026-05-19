<template>
  <div class="rounded border border-solid border-black/10 px-4 py-2 dark:border-white/10">
    <div class="mb-2 flex items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Person20Regular /></NIcon>
        {{ t('PlayerTab.filter.hasPlayer') }}
      </div>

      <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
        <template #icon>
          <NIcon size="14"><Delete20Regular /></NIcon>
        </template>
        {{ t('PlayerTab.filter.delete') }}
      </NButton>
    </div>

    <div class="flex items-center gap-2">
      <div class="w-20 shrink-0 text-sm text-black/80 dark:text-white/80">
        {{ t('PlayerTab.filter.playerPuuid') }}
      </div>

      <NSelectWithSummonerSearching
        size="small"
        :puuid="node.args[0].value"
        @update:puuid="handleUpdatePuuid"
        class="w-60! max-w-full"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Person20Regular } from '@vicons/fluent'
import { Delete20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilterEditor } from '../context'
import NSelectWithSummonerSearching from '../NSelectWithSummonerSearching.vue'
import type { CombinatorNode } from '../combinator-nodes'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, updateNode, deleteNode } = useMatchHistoryFilterEditor()

const node = computed(
  () => nodeMap.value[nodeId] as CombinatorNode<'hasPlayer', [{ kind: 'param'; value: string }]>
)

const handleUpdatePuuid = (value: string | null) => {
  updateNode(nodeId, {
    ...node.value,
    args: [{ kind: 'param', value }]
  })
}
</script>
