<template>
  <SettingsSection
    v-if="
      champion &&
      champion.kind !== 'arena' &&
      champion.kind !== 'aram_mayhem' &&
      champion.summonerSpells.length
    "
    :title="t('opgg.champion.spells')"
  >
    <template #headerSuffix>
      <ExpandButton
        v-if="champion.summonerSpells.length > 2"
        v-model:expanded="isSummonerSpellsExpanded"
      />
    </template>

    <div class="p-3">
      <RecommendationRow
        v-for="(s, i) of champion.summonerSpells.slice(0, isSummonerSpellsExpanded ? Infinity : 2)"
        :key="s.recommendationId"
        :rank="i + 1"
      >
        <SummonerSpellsDisplay :spell-ids="s.spellIds" />

        <template #metrics>
          <RecommendationStats :record="s" />
        </template>

        <template #actions>
          <NButton
            @click="setSummonerSpells(s.recommendationId)"
            size="tiny"
            type="primary"
            secondary
            :disabled="lcs.gameflow.phase !== 'ChampSelect' || isApplying || isLoading"
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
import SummonerSpellsDisplay from '@champion-data-window/components/champion-statistics/SummonerSpellsDisplay.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton } from 'naive-ui'
import { ref, watchEffect } from 'vue'

import { useOpgg } from '../context'
import { useLoadout } from '../utils/loadout'
import ExpandButton from '@champion-data-window/components/champion-statistics/ExpandButton.vue'
import RecommendationStats from './RecommendationStats.vue'

const { champion, isApplying, isLoading } = useOpgg()
const { setSummonerSpells } = useLoadout()
const { t } = useTranslation()
const lcs = useLeagueClientStore()

const isSummonerSpellsExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isSummonerSpellsExpanded.value = false
  }
})
</script>
