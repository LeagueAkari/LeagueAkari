<template>
  <div class="space-y-2 rounded border border-solid border-black/10 px-4 py-2 dark:border-white/10">
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><component :is="titleIcon" /></NIcon>
        {{ t(`PlayerTab.filter.combinatorLabels.${node.type}`) }}
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
        {{ t('PlayerTab.filter.have') }}
      </div>

      <NSelect
        :options="selectOptions"
        :render-label="renderLabel"
        size="small"
        filterable
        :value="node.args[0].value"
        @update:value="handleUpdateId"
        class="w-60! max-w-full"
      />
    </div>

    <div class="flex items-center gap-2">
      <div class="w-20 shrink-0 text-sm text-black/80 dark:text-white/80">
        {{ t('PlayerTab.filter.atPosition') }}
      </div>

      <NSelect
        :options="orderOptions"
        size="small"
        :value="node.args[1].value"
        @update:value="handleUpdateOrder"
        class="w-60! max-w-full"
      />
    </div>
  </div>
</template>

<script setup lang="tsx">
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@renderer-shared/components/widgets/PerkstyleDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Delete20Regular, Ribbon20Regular, Sparkle20Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NSelect, SelectOption } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilterEditor } from '../context'
import { type HasPerkCombinator, type HasPerkStyleCombinator } from '../combinator-nodes'

const { t } = useTranslation()

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, updateNode, deleteNode } = useMatchHistoryFilterEditor()
const lcs = useLeagueClientStore()

const node = computed(() => nodeMap.value[nodeId] as HasPerkCombinator | HasPerkStyleCombinator)

const titleIcon = computed(() =>
  node.value.type === 'hasPerkStyle' ? Ribbon20Regular : Sparkle20Regular
)

const selectOptions = computed(() => {
  if (node.value.type === 'hasPerkStyle') {
    return Object.values(lcs.gameData.perkstyles.styles)
      .map((style) => ({
        label: style.name,
        value: style.id
      }))
      .toSorted((a, b) => (a.label as string).localeCompare(b.label as string))
  }

  return Object.values(lcs.gameData.perks)
    .map((perk) => ({
      label: perk.name,
      value: perk.id
    }))
    .toSorted((a, b) => (a.label as string).localeCompare(b.label as string))
})

const orderOptions = computed(() => {
  if (node.value.type === 'hasPerkStyle') {
    return [
      { label: t('PlayerTab.filter.anyPosition'), value: -1 },
      { label: t('PlayerTab.filter.primaryStyle'), value: 0 },
      { label: t('PlayerTab.filter.subStyle'), value: 1 }
    ]
  }

  return [
    { label: t('PlayerTab.filter.anyPosition'), value: -1 },
    { label: t('PlayerTab.filter.positionN', { n: 1 }), value: 0 },
    { label: t('PlayerTab.filter.positionN', { n: 2 }), value: 1 },
    { label: t('PlayerTab.filter.positionN', { n: 3 }), value: 2 },
    { label: t('PlayerTab.filter.positionN', { n: 4 }), value: 3 },
    { label: t('PlayerTab.filter.positionN', { n: 5 }), value: 4 },
    { label: t('PlayerTab.filter.positionN', { n: 6 }), value: 5 }
  ]
})

const renderLabel = (option: SelectOption) => {
  return (
    <div class="flex items-center gap-2">
      {node.value.type === 'hasPerkStyle' ? (
        <PerkstyleDisplay perkstyleId={option.value as number} size={20} />
      ) : (
        <PerkDisplay perkId={option.value as number} size={20} />
      )}
      <span class="truncate text-sm">{option.label as string}</span>
    </div>
  )
}

const handleUpdateId = (value: number) => {
  updateNode(nodeId, {
    ...node.value,
    args: [{ kind: 'param', value }, node.value.args[1] ?? { kind: 'param', value: -1 }]
  })
}

const handleUpdateOrder = (value: number) => {
  updateNode(nodeId, {
    ...node.value,
    args: [node.value.args[0], { kind: 'param', value }]
  })
}
</script>
