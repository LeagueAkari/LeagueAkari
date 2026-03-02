<template>
  <div
    class="space-y-2 rounded border border-solid border-black/10 bg-black/2 px-4 py-2 dark:border-white/10 dark:bg-white/2"
  >
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Flash20Regular /></NIcon>
        {{ t('PlayerTab.filter.summonerSpell') }}
      </div>

      <NodeActionButtons :node-id="nodeId" />
    </div>

    <div class="flex items-center gap-2">
      <div class="w-20 text-sm text-black/80 dark:text-white/80">
        {{ t('PlayerTab.filter.select') }}
      </div>

      <NSelect
        :options="spellOptions"
        :render-label="renderLabel"
        size="small"
        filterable
        :value="node.args[0].value"
        @update:value="handleUpdateSpellId"
        class="w-60!"
      />
    </div>

    <div class="flex items-center gap-2">
      <div class="w-20 text-sm text-black/80 dark:text-white/80">
        {{ t('PlayerTab.filter.atPosition') }}
      </div>

      <NSelect
        :options="orderOptions"
        size="small"
        :value="orderValue"
        @update:value="handleUpdateSpellOrder"
        class="w-60!"
      />
    </div>
  </div>
</template>

<script setup lang="tsx">
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Flash20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NIcon, NSelect, SelectOption } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import NodeActionButtons from '../NodeActionButtons.vue'
import { HasSpellCombinator } from '../combinator-nodes'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, updateNode } = useMatchHistoryFilters()

const lcs = useLeagueClientStore()

const node = computed(() => nodeMap.value[nodeId] as HasSpellCombinator)

const orderValue = computed(() => node.value.args[1]?.value ?? -1)

const renderLabel = (option: SelectOption) => {
  if (option.type === 'group') {
    return <span>{option.label as string}</span>
  }

  return (
    <div class="flex items-center gap-2">
      <SummonerSpellDisplay spellId={option.value as number} size={20} />
      <span class="truncate text-sm">{option.label as string}</span>
    </div>
  )
}

const spellOptions = computed(() => {
  const all = Object.values(lcs.gameData.summonerSpells)

  const normal = all.filter((s) => s.id < 2000)
  const special = all.filter((s) => s.id >= 2000)

  return [
    {
      type: 'group',
      label: t('PlayerTab.filter.spellGroupNormal'),
      children: normal
        .map((s) => ({
          label: s.name,
          value: s.id
        }))
        .toSorted((a, b) => (a.label as string).localeCompare(b.label as string))
    },
    {
      type: 'group',
      label: t('PlayerTab.filter.spellGroupSpecial'),
      children: special
        .map((s) => ({
          label: s.name,
          value: s.id
        }))
        .toSorted((a, b) => (a.label as string).localeCompare(b.label as string))
    }
  ]
})

const orderOptions = computed(() => {
  return [
    { label: t('PlayerTab.filter.anyPosition'), value: -1 },
    { label: t('PlayerTab.filter.positionN', { n: 1 }), value: 0 },
    { label: t('PlayerTab.filter.positionN', { n: 2 }), value: 1 }
  ]
})

const handleUpdateSpellId = (value: number) => {
  updateNode(nodeId, {
    ...node.value,
    args: [{ kind: 'param', value }, node.value.args[1] ?? { kind: 'param', value: -1 }]
  })
}

const handleUpdateSpellOrder = (value: number) => {
  updateNode(nodeId, {
    ...node.value,
    args: [node.value.args[0], { kind: 'param', value }]
  })
}
</script>
