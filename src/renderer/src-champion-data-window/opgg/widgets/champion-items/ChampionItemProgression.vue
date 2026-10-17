<template>
  <SettingsSection
    v-if="groups.single.length || groups.combined.length"
    :title="t('opgg.itemProgression.title')"
    :footer="t('opgg.itemProgression.note')"
  >
    <template #headerSuffix>
      <div class="flex max-w-full flex-wrap items-center justify-end gap-2">
        <NRadioGroup v-model:value="kind" size="small" :aria-label="t('opgg.itemProgression.kind')">
          <NFlex :size="12" class="justify-end">
            <NRadio value="single" :disabled="!groups.single.length">
              {{ t('opgg.itemProgression.single') }}
            </NRadio>
            <NRadio value="combined" :disabled="!groups.combined.length">
              {{ t('opgg.itemProgression.combined') }}
            </NRadio>
          </NFlex>
        </NRadioGroup>
        <AddItemSetButton />
        <ExpandButton v-if="builds.length > 5" v-model:expanded="expanded" />
      </div>
    </template>

    <div class="p-3">
      <div class="mb-3 flex flex-wrap items-center justify-end gap-1">
        <NButton
          v-for="stage in stages"
          :key="stage.order"
          size="tiny"
          :type="order === stage.order ? 'primary' : 'default'"
          :secondary="order === stage.order"
          :quaternary="order !== stage.order"
          :aria-pressed="order === stage.order"
          @click="order = stage.order"
        >
          {{ t(`opgg.itemProgression.${kind}Stage`, { order: stage.order }) }}
        </NButton>
      </div>

      <RecommendationRow
        v-for="(item, index) in builds.slice(0, expanded ? undefined : 5)"
        :key="item.recommendationId"
        :rank="index + 1"
      >
        <ItemBuildDisplay :item-ids="item.itemIds" />
        <NEllipsis v-if="kind === 'single'" class="min-w-0 flex-1 text-xs">
          {{ resources.items.display(item.itemIds[0])?.name ?? `#${item.itemIds[0]}` }}
        </NEllipsis>
        <template #metrics><RecommendationStats :record="item" /></template>
      </RecommendationRow>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import ExpandButton from '@champion-data-window/components/champion-statistics/ExpandButton.vue'
import ItemBuildDisplay from '@champion-data-window/components/champion-statistics/ItemBuildDisplay.vue'
import RecommendationRow from '@champion-data-window/components/champion-statistics/RecommendationRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useTranslation } from 'i18next-vue'
import { NButton, NEllipsis, NFlex, NRadio, NRadioGroup } from 'naive-ui'
import { computed, ref, watch, watchEffect } from 'vue'

import { useOpgg } from '../../context'
import RecommendationStats from '../RecommendationStats.vue'
import AddItemSetButton from './AddItemSetButton.vue'

const { champion } = useOpgg()
const { t } = useTranslation()
const resources = useAkariResourceProvider()
const kind = ref<'single' | 'combined'>('single')
const order = ref(4)
const expanded = ref(false)

const groups = computed(() => {
  const details = champion.value
  if (!details || (details.kind !== 'ranked' && details.kind !== 'flex')) {
    return { single: [], combined: [] }
  }

  return {
    single: details.itemBuildsByOrder.single.filter((stage) => stage.builds.length),
    combined: details.itemBuildsByOrder.combined.filter((stage) => stage.builds.length)
  }
})
const stages = computed(() => groups.value[kind.value].toSorted((a, b) => a.order - b.order))
const builds = computed(
  () => stages.value.find((stage) => stage.order === order.value)?.builds ?? []
)

watchEffect(() => {
  if (!stages.value.length) {
    const alternative = kind.value === 'single' ? 'combined' : 'single'
    if (groups.value[alternative].length) kind.value = alternative
  }

  if (stages.value.length && !stages.value.some((stage) => stage.order === order.value)) {
    order.value = stages.value[0].order
  }
})

watch([kind, order], () => {
  expanded.value = false
})
</script>
