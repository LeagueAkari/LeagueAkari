<template>
  <div
    class="space-y-2 rounded border border-solid border-white/10 bg-black/2 px-4 py-2 dark:bg-white/2"
  >
    <div class="flex items-center gap-2">
      <div v-if="node.type === 'durationBetween'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><AccessTime20Regular /></NIcon>
        游戏时长 (秒)
      </div>
      <div v-else-if="node.type === 'kdaBetween'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><NumberSymbol20Regular /></NIcon>
        KDA
      </div>
      <div v-else-if="node.type === 'killsBetween'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Target20Regular /></NIcon>
        击杀数
      </div>
      <div v-else-if="node.type === 'deathsBetween'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Dismiss20Regular /></NIcon>
        死亡数
      </div>
      <div v-else-if="node.type === 'assistsBetween'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Handshake20Regular /></NIcon>
        助攻数
      </div>
      <div v-else-if="node.type === 'goldBetween'" class="flex items-center gap-1.5 text-sm font-bold">
        <NIcon size="16"><Money20Regular /></NIcon>
        金币
      </div>

      <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
        <template #icon>
          <NIcon size="14"><Delete20Regular /></NIcon>
        </template>
        删除
      </NButton>
    </div>

    <div class="flex items-center gap-2">
      <div class="w-12 text-sm text-black/80 dark:text-white/80">最小</div>

      <NInputNumber
        :show-button="false"
        size="small"
        :value="node.args[0].value"
        @update:value="(val) => handleUpdateDurationBetweenId(val ?? 0, node.args[1].value)"
        :status="isWrong ? 'warning' : 'success'"
      />
    </div>

    <div class="flex items-center gap-2">
      <div class="w-12 text-sm text-black/80 dark:text-white/80">最大</div>

      <NInputNumber
        :show-button="false"
        size="small"
        :value="node.args[1].value"
        @update:value="(val) => handleUpdateDurationBetweenId(node.args[0].value, val ?? 0)"
        :status="isWrong ? 'warning' : 'success'"
      />
    </div>
  </div>
</template>

<script setup lang="tsx">
import {
  AccessTime20Regular,
  Delete20Regular,
  Dismiss20Regular,
  Handshake20Regular,
  Money20Regular,
  NumberSymbol20Regular,
  Target20Regular
} from '@vicons/fluent'
import { NButton, NIcon, NInputNumber } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistoryFilters } from '../../../data/match-history-filters'
import {
  AssistsBetweenCombinator,
  DeathsBetweenCombinator,
  DurationBetweenCombinator,
  GoldBetweenCombinator,
  KdaBetweenCombinator,
  KillsBetweenCombinator
} from '../combinator-nodes'

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, updateNode, deleteNode } = useMatchHistoryFilters()

const node = computed(
  () =>
    nodeMap.value[nodeId] as
      | DurationBetweenCombinator
      | KdaBetweenCombinator
      | KillsBetweenCombinator
      | DeathsBetweenCombinator
      | AssistsBetweenCombinator
      | GoldBetweenCombinator
)

const handleUpdateDurationBetweenId = (min: number, max: number) => {
  updateNode(nodeId, {
    ...node.value,
    args: [
      { kind: 'param', value: min },
      { kind: 'param', value: max }
    ]
  })
}

const isWrong = computed(() => {
  return node.value.args[0].value > node.value.args[1].value
})
</script>
