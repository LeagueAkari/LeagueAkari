<template>
  <SettingsSection v-if="items.length" :title="title">
    <template #headerSuffix>
      <div class="flex items-center gap-2">
        <AddItemSetButton />
        <ExpandButton v-if="items.length > visibleCount" v-model:expanded="expanded" />
      </div>
    </template>

    <div class="grid gap-x-3 p-3" :class="columns === 2 ? 'grid-cols-2' : 'grid-cols-1'">
      <RecommendationRow
        v-for="(item, index) in items.slice(0, expanded ? Infinity : visibleCount)"
        :key="item.recommendationId"
        :rank="index + 1"
      >
        <ItemBuildDisplay :item-ids="item.itemIds" />

        <template #metrics>
          <RecommendationStats :record="item" />
        </template>
      </RecommendationRow>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import ExpandButton from '@champion-data-window/components/champion-statistics/ExpandButton.vue'
import ItemBuildDisplay from '@champion-data-window/components/champion-statistics/ItemBuildDisplay.vue'
import RecommendationRow from '@champion-data-window/components/champion-statistics/RecommendationRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import type { OpggItemBuild, OpggRecommendation } from '@shared/types/champion-data/opgg'
import { ref } from 'vue'

import RecommendationStats from '../RecommendationStats.vue'
import AddItemSetButton from './AddItemSetButton.vue'

defineProps<{
  title: string
  items: OpggRecommendation<OpggItemBuild>[]
  columns: 1 | 2
  visibleCount: number
}>()

const expanded = ref(false)
</script>
