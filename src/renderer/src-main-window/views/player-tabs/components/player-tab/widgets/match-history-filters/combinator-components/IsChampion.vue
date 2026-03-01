<template>
  <div
    class="rounded border border-solid border-black/10 bg-black/2 px-4 py-2 dark:border-white/10 dark:bg-white/2"
  >
    <div class="mb-2 flex items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Games20Regular /></NIcon>
        选用英雄
      </div>

      <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
        <template #icon>
          <NIcon size="14"><Delete20Regular /></NIcon>
        </template>
        删除
      </NButton>
    </div>

    <div class="flex w-60 items-center gap-2">
      <NSelect
        :options="championOptions"
        :render-label="renderLabel"
        :filter="(a, b) => isNameMatch(a, b.label as string, b.value as number)"
        size="small"
        filterable
        :value="node.args[0].value"
        @update:value="handleUpdateChampionId"
      />
    </div>
  </div>
</template>

<script setup lang="tsx">
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Delete20Regular, Games20Regular } from '@vicons/fluent'
import { NButton, NIcon, NSelect, SelectOption } from 'naive-ui'
import { computed } from 'vue'

import { useChampionNameMatch } from '@main-window/composables/useChampionNameMatch'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import { IsChampionCombinator } from '../combinator-nodes'

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, updateNode, deleteNode } = useMatchHistoryFilters()

const node = computed(() => nodeMap.value[nodeId] as IsChampionCombinator)

const lcs = useLeagueClientStore()

const { match: isNameMatch } = useChampionNameMatch()

const renderLabel = (option: SelectOption) => {
  if (option.type === 'group') {
    return <span>{option.label as string}</span>
  }

  return (
    <div class="flex items-center gap-2">
      <ChampionIcon class="size-5 shrink-0 rounded" championId={option.value as number} />
      <span class="text-sm">{option.label as string}</span>
    </div>
  )
}

const championOptions = computed(() => {
  const list = Object.values(lcs.gameData.champions).reduce((arr, current) => {
    if (current.id === -1) {
      return arr
    }

    arr.push({
      label: current.name,
      value: current.id
    })
    return arr
  }, [] as SelectOption[])

  return list.toSorted((a, b) => (a.label as string).localeCompare(b.label as string))
})

const handleUpdateChampionId = (value: number) => {
  updateNode(nodeId, {
    ...node.value,
    args: [{ kind: 'param', value }]
  })
}
</script>
