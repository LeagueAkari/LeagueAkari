<template>
  <div
    class="space-y-2 rounded border border-solid border-black/10 bg-black/2 px-4 py-2 dark:border-white/10 dark:bg-white/2"
  >
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Sparkle20Regular /></NIcon>
        海克斯
      </div>

      <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
        <template #icon>
          <NIcon size="14"><Delete20Regular /></NIcon>
        </template>
        删除
      </NButton>
    </div>

    <div class="flex items-center gap-2">
      <div class="w-12 text-sm text-black/80 dark:text-white/80">拥有</div>

      <NSelect
        :options="augmentOptions"
        :render-label="renderLabel"
        size="small"
        filterable
        :value="node.args[0].value"
        @update:value="handleUpdateAugmentId"
        class="w-60!"
      />
    </div>

    <div class="flex items-center gap-2">
      <div class="w-12 text-sm text-black/80 dark:text-white/80">位于</div>

      <NSelect
        :options="orderOptions"
        size="small"
        :value="node.args[1].value"
        @update:value="handleUpdateAugmentOrder"
        class="w-60!"
      />
    </div>
  </div>
</template>

<script setup lang="tsx">
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { Augment } from '@shared/types/league-client/game-data'
import { Delete20Regular, Sparkle20Regular } from '@vicons/fluent'
import { NButton, NIcon, NSelect, SelectOption } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import { HasAugmentCombinator } from '../combinator-nodes'

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, updateNode, deleteNode } = useMatchHistoryFilters()

const lcs = useLeagueClientStore()

const node = computed(() => nodeMap.value[nodeId] as HasAugmentCombinator)

const groupedAugments = computed(() => {
  const typeMap: Record<string, 'kiwi' | 'cherry' | 'others'> = {}

  const cherry: Augment[] = []
  const kiwi: Augment[] = []
  const others: Augment[] = []

  for (const augment of Object.values(lcs.gameData.augments)) {
    if (augment.id > 0 && augment.id <= 1000) {
      cherry.push(augment)
      typeMap[augment.id] = 'cherry'
    } else if (augment.id >= 1001 && augment.id <= 3000) {
      kiwi.push(augment)
      typeMap[augment.id] = 'kiwi'
    } else {
      others.push(augment)
      typeMap[augment.id] = 'others'
    }
  }

  return {
    typeMap,
    cherry,
    kiwi,
    others
  }
})

const renderTypeBlock = (type: 'kiwi' | 'cherry' | 'others' | undefined) => {
  if (type === 'kiwi') {
    return (
      <div
        class={[
          'flex size-4.5 shrink-0 items-center justify-center rounded bg-blue-500 text-[11px]'
        ]}
      >
        海
      </div>
    )
  } else if (type === 'cherry') {
    return (
      <div
        class={[
          'flex size-4.5 shrink-0 items-center justify-center rounded bg-red-500 text-[11px]'
        ]}
      >
        斗
      </div>
    )
  } else {
    return null
  }
}

const renderLabel = (option: SelectOption) => {
  if (option.type === 'group') {
    return <span>{option.label as string}</span>
  }

  const type = groupedAugments.value.typeMap[option.value as number]

  return (
    <div class="flex items-center gap-2">
      <AugmentDisplay augmentId={option.value as number} size={20} />
      {renderTypeBlock(type)}
      <span class="truncate text-sm">{option.label as string}</span>
    </div>
  )
}

const augmentOptions = computed(() => {
  const { cherry, kiwi, others } = groupedAugments.value

  return [
    {
      type: 'group',
      label: '海克斯大乱斗',
      children: kiwi
        .toSorted((a, b) => (a.nameTRA as string).localeCompare(b.nameTRA as string))
        .map((augment) => ({
          label: augment.nameTRA,
          value: augment.id
        }))
    },
    {
      type: 'group',
      label: '斗魂竞技场',
      children: cherry
        .toSorted((a, b) => (a.nameTRA as string).localeCompare(b.nameTRA as string))
        .map((augment) => ({
          label: augment.nameTRA,
          value: augment.id
        }))
    },
    {
      type: 'group',
      label: '其他',
      children: others
        .toSorted((a, b) => (a.nameTRA as string).localeCompare(b.nameTRA as string))
        .map((augment) => ({
          label: augment.nameTRA,
          value: augment.id
        }))
    }
  ]
})

const orderOptions = computed(() => {
  const oneToFive = Array.from({ length: 5 }, (_, index) => ({
    label: `第 ${index + 1} 个`,
    value: index
  }))

  return [
    {
      label: '任意位置',
      value: -1
    },
    ...oneToFive
  ]
})

const handleUpdateAugmentId = (value: number) => {
  updateNode(nodeId, {
    ...node.value,
    args: [{ kind: 'param', value }, node.value.args[1] ?? { kind: 'param', value: -1 }]
  })
}

const handleUpdateAugmentOrder = (value: number) => {
  updateNode(nodeId, {
    ...node.value,
    args: [node.value.args[0], { kind: 'param', value }]
  })
}
</script>
