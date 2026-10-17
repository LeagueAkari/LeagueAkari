<template>
  <SettingsSection
    v-if="champion && champion.kind === 'arena' && champion.synergies.length"
    :title="t('opgg.champion.synergies')"
  >
    <template #headerSuffix>
      <ExpandButton v-if="champion.synergies.length > 4" v-model:expanded="isSynergiesExpanded" />
    </template>

    <div class="p-3">
      <RecommendationRow
        v-for="(s, i) of champion.synergies.slice(0, isSynergiesExpanded ? Infinity : 4)"
        :key="s.championId"
        :rank="i + 1"
      >
        <ChampionLink :champion-id="s.championId" @select="setTab('champion', $event)" />

        <template #metrics>
          <StatisticPopover
            v-if="s.averagePlace != null"
            metric="averagePlace"
            :value="s.averagePlace.toFixed(2)"
            :play="s.play"
          >
            <StatisticValue
              >{{ s.averagePlace.toFixed(2)
              }}<template #caption>{{ t('opgg.champion.avgPlace') }} </template></StatisticValue
            >
          </StatisticPopover>
          <StatisticPopover
            v-if="s.firstPlaceRate != null"
            metric="firstPlaceRate"
            :value="(s.firstPlaceRate * 100).toFixed(2) + '%'"
            :play="s.play"
          >
            <StatisticValue
              >{{ (s.firstPlaceRate * 100).toFixed(2) }}%<template #caption>{{
                t('opgg.champion.1st')
              }}</template></StatisticValue
            >
          </StatisticPopover>
          <RecommendationStats :record="s" pick-rate-metric="synergyPickRate" />
        </template>
      </RecommendationRow>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import ChampionLink from '@champion-data-window/components/champion-statistics/ChampionLink.vue'
import RecommendationRow from '@champion-data-window/components/champion-statistics/RecommendationRow.vue'
import StatisticValue from '@champion-data-window/components/champion-statistics/StatisticValue.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useTranslation } from 'i18next-vue'
import { ref, watchEffect } from 'vue'

import { useOpgg } from '../context'
import ExpandButton from '@champion-data-window/components/champion-statistics/ExpandButton.vue'
import StatisticPopover from './StatisticPopover.vue'
import RecommendationStats from './RecommendationStats.vue'

const { champion, setTab } = useOpgg()
const { t } = useTranslation()

const isSynergiesExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isSynergiesExpanded.value = false
  }
})
</script>
