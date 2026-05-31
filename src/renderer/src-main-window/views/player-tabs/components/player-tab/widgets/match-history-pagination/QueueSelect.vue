<template>
  <NSelect
    :value="selectedQueue"
    @update:value="handleTagChange"
    size="small"
    :options="sgpTagOptions"
    :disabled="disabled"
    :class="{ 'w-56!': horizontal }"
    :render-label="renderLabel"
    :consistent-menu-width="false"
  />
</template>

<script setup lang="tsx">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { ALL_SGPTAG_VALUE, useSgpTagOptions } from '@renderer-shared/composables/useSgpTagOptions'
import { NSelect, SelectOption } from 'naive-ui'
import { computed } from 'vue'

import { useMapAssets } from '@main-window/composables/useMapAssets'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'
import { useSelfHostedLcuDataStore } from '@main-window/shards/self-hosted-lcu-data/store'

import { useMatchHistory } from '../../data/match-history'

const { disabled = false, horizontal = false } = defineProps<{
  disabled?: boolean
  horizontal?: boolean
}>()

const pts = usePlayerTabsStore()
const sgpTagOptions = useSgpTagOptions()
const { loadMatchHistory, page } = useMatchHistory()

const selectedQueue = computed(() => {
  if (!page.value) return ALL_SGPTAG_VALUE

  const {
    queryParams: { tag = ALL_SGPTAG_VALUE }
  } = page.value

  return tag
})

const handleTagChange = (tag: string) => {
  if (disabled) {
    return
  }

  pts.frontendSettings.defaultMatchHistoryTag = tag
  loadMatchHistory({ tag: tag === ALL_SGPTAG_VALUE ? undefined : tag, startIndex: 0 })
}

const mapAssets = useMapAssets()
const shs = useSelfHostedLcuDataStore()

const mapIdGameModeIconUri = computed(() => {
  if (!mapAssets.value) {
    return {}
  }

  const uriMap: Record<string, string> = {}

  for (const [mapId, mapAsset] of Object.entries(mapAssets.value)) {
    for (const item of mapAsset) {
      const key = `${mapId}_${item.gameMode}`

      if (uriMap[key]) {
        continue
      }

      uriMap[key] = item.assets?.['game-select-icon-hover']
    }
  }

  return uriMap
})

const getQueueMapIconUri = (queueId: number | undefined) => {
  if (!queueId) {
    return mapIdGameModeIconUri.value['11_CLASSIC']
  }

  const queue = shs.gameQueues[queueId]

  if (queue) {
    return (
      mapIdGameModeIconUri.value[`${queue.mapId}_${queue.gameMode}`] ??
      mapIdGameModeIconUri.value['11_CLASSIC']
    )
  } else {
    return mapIdGameModeIconUri.value['11_CLASSIC']
  }
}

const renderLabel = (option: SelectOption) => {
  if (option.type === 'group') {
    return <span>{option.label as string}</span>
  }

  const value = option.value as string
  const [_, queueId] = value.split('q_')

  return (
    <div class="flex items-center gap-2">
      <LcuImage
        src={getQueueMapIconUri(queueId ? parseInt(queueId) : undefined)}
        class="size-5 rounded"
      />
      <span class="text-sm">{option.label as string}</span>
    </div>
  )
}
</script>
