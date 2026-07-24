<template>
  <StoryPanel
    title="Ordered champion selector"
    description="完整英雄列表来自 Community Dragon champion-summary.json。位置分类由英雄角色模拟；状态和资料缺失示例可通过顶部控件调整。此 Story 不连接 auto-select 状态。"
  >
    <NAlert v-if="errorMessage" class="mb-3" type="error" :title="errorMessage" />

    <div class="mb-2 grid gap-1.5">
      <div class="flex items-center gap-2">
        <span class="w-20 shrink-0 text-right text-xs text-black/55 dark:text-white/55">
          变暗英雄 ID
        </span>
        <NSelect
          v-model:value="unavailableChampionIds"
          class="min-w-0 flex-1"
          multiple
          filterable
          clearable
          size="small"
          max-tag-count="responsive"
          :options="championOptions"
          placeholder="选择需要模拟状态的英雄"
        />
      </div>

      <div class="flex items-center gap-2">
        <span class="w-20 shrink-0 text-right text-xs text-black/55 dark:text-white/55">
          缺少资料 ID
        </span>
        <NSelect
          v-model:value="fallbackChampionIds"
          class="min-w-0 flex-1"
          multiple
          filterable
          clearable
          size="small"
          max-tag-count="responsive"
          :options="championOptions"
          placeholder="选择仅保留 ID 的已选英雄"
        />
      </div>
    </div>

    <OrderedChampionSelector
      v-model="selectedChampionIds"
      :champions="displayChampions"
      :loading="loading"
    />
  </StoryPanel>
</template>

<script setup lang="ts">
import {
  ORDERED_CHAMPION_POSITIONS,
  OrderedChampionSelector,
  type OrderedChampionOption,
  type OrderedChampionPosition
} from '@renderer-shared/components/ordered-champion-selector'
import type { ChampionSimple } from '@shared/types/league-client/game-data'
import { NAlert, NSelect } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'

import StoryPanel from '../StoryPanel.vue'

const CHAMPION_SUMMARY_URL =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_cn/v1/champion-summary.json'

const ROLE_POSITION_MAP: Record<string, OrderedChampionPosition[]> = {
  assassin: ['MIDDLE', 'JUNGLE'],
  fighter: ['TOP', 'JUNGLE'],
  mage: ['MIDDLE', 'UTILITY'],
  marksman: ['BOTTOM'],
  support: ['UTILITY'],
  tank: ['TOP', 'JUNGLE', 'UTILITY']
}

const champions = ref<OrderedChampionOption[]>([])
const selectedChampionIds = ref([22, 81, 145, 202, 51, 64])
const unavailableChampionIds = ref([22, 134, 266])
const fallbackChampionIds = ref([81])
const loading = ref(true)
const errorMessage = ref('')

const unavailableChampionIdSet = computed(() => new Set(unavailableChampionIds.value))
const fallbackChampionIdSet = computed(() => new Set(fallbackChampionIds.value))
const displayChampions = computed(() =>
  champions.value
    .filter((champion) => !fallbackChampionIdSet.value.has(champion.id))
    .map((champion) => ({
      ...champion,
      unavailable: unavailableChampionIdSet.value.has(champion.id)
    }))
)
const championOptions = computed(() =>
  champions.value.map((champion) => ({
    label: `${champion.name} · ${champion.id}`,
    value: champion.id
  }))
)

onMounted(async () => {
  try {
    const response = await fetch(CHAMPION_SUMMARY_URL)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const payload = (await response.json()) as ChampionSimple[]
    champions.value = payload
      .filter((champion) => champion.id > 0)
      .map(({ id, name, roles }) => {
        const positionSet = new Set(roles.flatMap((role) => ROLE_POSITION_MAP[role] || []))

        return {
          id,
          name,
          positions: ORDERED_CHAMPION_POSITIONS.filter((position) => positionSet.has(position))
        }
      })
      .toSorted((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
  } catch (error) {
    errorMessage.value = `英雄数据加载失败：${error instanceof Error ? error.message : String(error)}`
  } finally {
    loading.value = false
  }
})
</script>
