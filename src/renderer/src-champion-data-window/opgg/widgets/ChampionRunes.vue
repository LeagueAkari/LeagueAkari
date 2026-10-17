<template>
  <SettingsSection
    v-if="
      champion &&
      champion.kind !== 'arena' &&
      champion.kind !== 'aram_mayhem' &&
      champion.runes.length
    "
    :title="t('opgg.champion.runes')"
    :footer="t('opgg.champion.runesFooter')"
  >
    <template #headerSuffix>
      <ExpandButton v-if="champion.runes.length > 2" v-model:expanded="isRunesExpanded" />
    </template>

    <div class="p-3">
      <RecommendationRow
        v-for="(r, i) of champion.runes.slice(0, isRunesExpanded ? Infinity : 2)"
        :key="r.recommendationId"
        :rank="i + 1"
        layout="runes"
      >
        <RunePageDisplay :page="r" />

        <template #metrics>
          <RecommendationStats :record="r" />
        </template>

        <template #actions>
          <NButton
            @click="setRunes(r.recommendationId)"
            size="tiny"
            type="primary"
            :disabled="!lcs.isConnected || isApplying || isLoading"
            secondary
          >
            {{ t('opgg.champion.apply') }}
          </NButton>
        </template>
      </RecommendationRow>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import RecommendationRow from '@champion-data-window/components/champion-statistics/RecommendationRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import RunePageDisplay from '@champion-data-window/components/champion-statistics/RunePageDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton } from 'naive-ui'
import { ref, watchEffect } from 'vue'

import { useOpgg } from '../context'
import { useLoadout } from '../utils/loadout'
import ExpandButton from '@champion-data-window/components/champion-statistics/ExpandButton.vue'
import RecommendationStats from './RecommendationStats.vue'

const { champion, isApplying, isLoading } = useOpgg()
const { setRunes } = useLoadout()
const { t } = useTranslation()
const lcs = useLeagueClientStore()

const isRunesExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isRunesExpanded.value = false
  }
})
</script>
