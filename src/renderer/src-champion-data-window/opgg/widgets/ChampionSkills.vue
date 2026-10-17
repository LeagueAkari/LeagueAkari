<template>
  <SettingsSection
    v-if="champion && champion.kind !== 'aram_mayhem' && champion.skillMasteries.length"
    :title="t('opgg.champion.abilityBuild')"
  >
    <template #headerSuffix>
      <ExpandButton
        v-if="champion.skillMasteries.length > 2"
        v-model:expanded="isSkillMasteriesExpanded"
      />
    </template>

    <div class="p-3">
      <SkillOrderDisplay
        v-for="(m, i) of champion.skillMasteries.slice(0, isSkillMasteriesExpanded ? Infinity : 2)"
        :key="m.recommendationId"
        :rank="i + 1"
        :priority="m.skills"
        :order="m.orders[0] ?? []"
      >
        <template #metrics>
          <RecommendationStats :record="m" inline />
        </template>
      </SkillOrderDisplay>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import SkillOrderDisplay from '@champion-data-window/components/champion-statistics/SkillOrderDisplay.vue'
import { useTranslation } from 'i18next-vue'
import { ref, watchEffect } from 'vue'

import { useOpgg } from '../context'
import ExpandButton from '@champion-data-window/components/champion-statistics/ExpandButton.vue'
import RecommendationStats from './RecommendationStats.vue'

const { champion } = useOpgg()
const { t } = useTranslation()

const isSkillMasteriesExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isSkillMasteriesExpanded.value = false
  }
})
</script>
