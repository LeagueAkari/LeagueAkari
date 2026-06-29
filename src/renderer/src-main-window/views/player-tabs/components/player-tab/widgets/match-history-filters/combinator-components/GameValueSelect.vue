<template>
  <div class="rounded border border-solid border-black/10 px-4 py-2 dark:border-white/10">
    <div class="mb-2 flex items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><component :is="titleIcon" /></NIcon>
        {{ t(`playerTabs.matchHistory.filters.combinatorLabels.${node.type}`) }}
      </div>

      <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
        <template #icon>
          <NIcon size="14"><Delete20Regular /></NIcon>
        </template>
        {{ t('playerTabs.matchHistory.filters.delete') }}
      </NButton>
    </div>

    <div class="flex w-60 max-w-full items-center gap-2">
      <NSelect
        class="max-w-full"
        :options="selectOptions"
        size="small"
        filterable
        :value="node.args[0].value"
        @update:value="handleUpdateValue"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Delete20Regular, Games20Regular, Map20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NSelect } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilterEditor } from '../context'
import { type IsGameModeCombinator, type IsMapCombinator } from '../combinator-nodes'

const GAME_MODE_OPTIONS = [
  'CLASSIC',
  'ARAM',
  'URF',
  'CHERRY',
  'KIWI',
  'STRAWBERRY',
  'PRACTICETOOL',
  'TUTORIAL',
  'NEXUSBLITZ',
  'ULTBOOK',
  'ONEFORALL',
  'SNOWURF',
  'DOOMBOTSTEEMO',
  'RUBY',
  'ARSR',
  'ASSASSINATE',
  'FIRSTBLOOD',
  'PROJECT',
  'STARGUARDIAN',
  'BRAWL'
]

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, updateNode, deleteNode } = useMatchHistoryFilterEditor()
const lcs = useLeagueClientStore()

const node = computed(() => nodeMap.value[nodeId] as IsMapCombinator | IsGameModeCombinator)

const titleIcon = computed(() => (node.value.type === 'isMap' ? Map20Regular : Games20Regular))

const selectOptions = computed(() => {
  if (node.value.type === 'isMap') {
    return Object.values(lcs.gameData.maps)
      .map((map) => ({
        label: `${map.name} (${map.id})`,
        value: map.id
      }))
      .toSorted((a, b) => (a.label as string).localeCompare(b.label as string))
  }

  return GAME_MODE_OPTIONS.map((gameMode) => ({
    label: `${t(`playerTabs.matchHistory.filters.gameModes.${gameMode}`, { defaultValue: gameMode })} (${gameMode})`,
    value: gameMode
  }))
})

const handleUpdateValue = (value: number | string) => {
  updateNode(nodeId, {
    ...node.value,
    args: [{ kind: 'param', value }]
  })
}
</script>
