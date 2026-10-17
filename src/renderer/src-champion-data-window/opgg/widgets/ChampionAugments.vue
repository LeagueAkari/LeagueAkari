<template>
  <SettingsSection
    v-if="augments && Object.keys(augments).length"
    :title="t('opgg.champion.augments')"
  >
    <template #headerSuffix>
      <NFlex :size="12" align="center" class="justify-end">
        <NRadioGroup v-model:value="augmentRarity" size="small">
          <NFlex :size="12" class="justify-end">
            <NRadio v-if="augments[1]" :value="1">
              <span class="augment-rarity-silver">
                {{ t('opgg.champion.augmentSilver') }}
              </span>
            </NRadio>
            <NRadio v-if="augments[4]" :value="4">
              <span class="augment-rarity-gold">
                {{ t('opgg.champion.augmentGold') }}
              </span>
            </NRadio>
            <NRadio v-if="augments[8]" :value="8">
              <span class="augment-rarity-prismatic">{{ t('opgg.champion.augmentPrism') }}</span>
            </NRadio>
          </NFlex>
        </NRadioGroup>
        <ExpandButton v-if="selectedAugments.length > 4" v-model:expanded="isAugmentsExpanded" />
      </NFlex>
    </template>

    <div class="p-3">
      <RecommendationRow
        v-for="(a, i) of selectedAugments.slice(0, isAugmentsExpanded ? Infinity : 4)"
        :key="a.augmentId"
        :rank="i + 1"
      >
        <AugmentLabel :augment-id="a.augmentId" />

        <template #metrics>
          <RecommendationStats :record="a" />
        </template>
      </RecommendationRow>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import AugmentLabel from '@champion-data-window/components/champion-statistics/AugmentLabel.vue'
import RecommendationRow from '@champion-data-window/components/champion-statistics/RecommendationRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useTranslation } from 'i18next-vue'
import { NFlex, NRadio, NRadioGroup } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

import { useOpgg } from '../context'
import ExpandButton from '@champion-data-window/components/champion-statistics/ExpandButton.vue'
import RecommendationStats from './RecommendationStats.vue'

const { champion } = useOpgg()
const { t } = useTranslation()

const augmentRarity = ref<1 | 4 | 8>()

const augments = computed(() =>
  champion.value?.kind === 'arena' ? champion.value.augmentGroups : null
)

const selectedAugments = computed(() => {
  const groups = augments.value
  const rarity = augmentRarity.value

  if (!groups || !rarity) {
    return []
  }

  return groups[rarity]?.augments ?? []
})

watchEffect(() => {
  if (!augments.value) {
    augmentRarity.value = undefined

    return
  }

  if (augments.value[1]) {
    augmentRarity.value = 1
  } else if (augments.value[4]) {
    augmentRarity.value = 4
  } else if (augments.value[8]) {
    augmentRarity.value = 8
  } else {
    augmentRarity.value = undefined
  }
})

const isAugmentsExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isAugmentsExpanded.value = false
  }
})
</script>

<style scoped>
@import '../augment-rarity.css';
</style>
