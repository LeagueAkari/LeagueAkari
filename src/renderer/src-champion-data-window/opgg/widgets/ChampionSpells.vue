<template>
  <SettingsSection
    v-if="champion && champion.summonerSpells.length"
    :title="t('opgg.champion.spells')"
  >
    <template #headerSuffix>
      <ExpandButton
        v-if="champion.summonerSpells.length > 2"
        v-model:expanded="isSummonerSpellsExpanded"
      />
    </template>

    <div class="p-3">
      <!--  summoner spells -->
      <div
        class="mb-1 flex items-center gap-1 last:mb-0"
        v-for="(s, i) of champion.summonerSpells.slice(0, isSummonerSpellsExpanded ? Infinity : 2)"
      >
        <div class="min-w-4 text-[10px] text-[#666666] dark:text-[#b2b2b2]">#{{ i + 1 }}</div>
        <div class="spells flex gap-1">
          <SummonerSpellDisplay :size="28" :spell-id="spell" v-for="spell of s.ids" />
        </div>
        <div class="desc flex flex-1 items-center justify-end">
          <StatisticPopover
            metric="pickRate"
            :value="(s.pick_rate * 100).toFixed(2) + '%'"
            :play="s.play"
          >
            <div class="pick flex min-w-19 flex-col items-center">
              <span class="pick-rate text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
                >{{ (s.pick_rate * 100).toFixed(2) }}%</span
              >

              <span class="pick-play text-center text-xs text-[#666666] dark:text-[#bebebe]">
                {{
                  t('opgg.champion.times', {
                    times: s.play.toLocaleString()
                  })
                }}</span
              >
            </div>
          </StatisticPopover>
          <StatisticPopover
            metric="winRate"
            :value="formatWinRate(s.winRate)"
            :play="s.play"
            :record="s"
          >
            <div
              class="win-rate min-w-19 text-center text-xs font-bold"
              :style="{ color: getWinRateColor(s.winRate) }"
            >
              {{ formatWinRate(s.winRate) }}
            </div>
          </StatisticPopover>
          <div class="buttons flex min-w-19 justify-center">
            <NButton
              @click="setSummonerSpells(s.recommendationId)"
              size="tiny"
              type="primary"
              secondary
              :disabled="lcs.gameflow.phase !== 'ChampSelect' || isApplying || isLoading"
            >
              {{ t('opgg.champion.apply') }}
            </NButton>
          </div>
        </div>
      </div>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton } from 'naive-ui'
import { ref, watchEffect } from 'vue'

import { useOpgg } from '../context'
import { useWinRateTheme } from '@champion-data-window/components/champion-statistics/theme'
import { useLoadout } from '../utils/loadout'
import ExpandButton from './ExpandButton.vue'
import StatisticPopover from './StatisticPopover.vue'

const { champion, isApplying, isLoading } = useOpgg()
const { setSummonerSpells } = useLoadout()
const { t } = useTranslation()
const { getWinRateColor, formatWinRate } = useWinRateTheme()
const lcs = useLeagueClientStore()

const isSummonerSpellsExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isSummonerSpellsExpanded.value = false
  }
})
</script>
