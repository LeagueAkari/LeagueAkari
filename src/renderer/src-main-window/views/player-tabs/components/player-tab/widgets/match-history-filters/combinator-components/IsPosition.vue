<template>
  <div class="rounded border border-solid border-black/10 px-4 py-2 dark:border-white/10">
    <div class="mb-2 flex items-center gap-2">
      <div class="flex items-center gap-1.5 text-sm font-bold">
        <PositionIcon class="text-base" :position="node.args[0].value" />
        {{ t('PlayerTab.filter.position') }}
      </div>

      <NButton tertiary size="tiny" type="warning" @click="deleteNode(nodeId)">
        <template #icon>
          <NIcon size="14"><Delete20Regular /></NIcon>
        </template>
        {{ t('PlayerTab.filter.delete') }}
      </NButton>
    </div>

    <div class="flex w-60 max-w-full items-center gap-2">
      <NSelect
        class="max-w-full"
        :options="positionOptions"
        size="small"
        :value="node.args[0].value"
        @update:value="handleUpdatePositionId"
      />
    </div>

    <div
      v-if="!isSgpMatchHistorySource"
      class="mt-2 flex items-center gap-1.5 rounded border border-solid border-amber-500/20 bg-amber-500/8 px-2 py-1 text-xs text-amber-700 dark:text-amber-300"
    >
      <NIcon class="shrink-0 text-sm"><Info16Regular /></NIcon>
      <span>{{ t('PlayerTab.filter.positionUnsupportedHint') }}</span>
    </div>
  </div>
</template>

<script setup lang="tsx">
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import { Delete20Regular, Info16Regular } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NSelect } from 'naive-ui'
import { computed } from 'vue'

import { usePlayerTab } from '../../../context'
import { useMatchHistoryFilterEditor } from '../context'
import { IsPositionCombinator } from '../combinator-nodes'

const { nodeId } = defineProps<{
  nodeId: string
}>()

const { nodeMap, updateNode, deleteNode } = useMatchHistoryFilterEditor()
const { preferredSource, isCrossRegion, sgpApiStatus } = usePlayerTab()

const { t } = useTranslation()

const node = computed(() => nodeMap.value[nodeId] as IsPositionCombinator)
const isSgpMatchHistorySource = computed(
  () => (preferredSource.value === 'sgp' || isCrossRegion.value) && sgpApiStatus.value.canUse
)

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
