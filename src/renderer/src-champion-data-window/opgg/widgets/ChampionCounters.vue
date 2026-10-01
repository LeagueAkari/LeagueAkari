<template>
  <SettingsSection
    v-if="champion && champion.counters.recommended.length"
    :title="t('opgg.champion.matchups')"
  >
    <template #headerSuffix>
      <NRadioGroup v-model:value="matchupFilter" size="small" class="max-w-full">
        <NFlex :size="12" class="justify-end">
          <NRadio value="all">{{ t('opgg.champion.allCounters') }}</NRadio>
          <NRadio value="disadvantage">{{ t('opgg.champion.counter') }}</NRadio>
        </NFlex>
      </NRadioGroup>
    </template>

    <div class="p-3">
      <!-- Main supplies the recommended and complete matchup lists separately. -->
      <div class="counters flex flex-wrap gap-2" v-if="matchupFilter === 'all'">
        <div
          class="counter flex w-11.5 cursor-pointer flex-col items-center transition-[filter] duration-200 hover:brightness-[1.2]"
          v-if="champion.counters.all.length"
          @click="setTab('champion', c.champion_id)"
          v-for="c of champion.counters.all"
          :key="c.champion_id"
        >
          <LcuImage class="image mb-1 h-8 w-8" :src="championIconUri(c.champion_id)" />
          <StatisticPopover
            metric="matchupWinRate"
            :value="formatWinRate(c.winRate)"
            :play="c.play"
            :record="c"
          >
            <div
              class="win-rate text-[11px] font-bold"
              :style="{ color: getWinRateColor(c.winRate) }"
            >
              {{ formatWinRate(c.winRate) }}
            </div>
          </StatisticPopover>
          <StatisticPopover metric="plays" :value="c.play.toLocaleString()">
            <div class="play text-center text-[10px] text-[#666666] dark:text-[#a4a4a4]">
              {{
                t('opgg.champion.times', {
                  times: c.play.toLocaleString()
                })
              }}
            </div>
          </StatisticPopover>
        </div>

        <div
          class="flex h-16 w-full items-center justify-center text-sm text-white/50 dark:text-white/50"
          v-else
        >
          {{ t('opgg.champion.empty') }}
        </div>
      </div>

      <!-- not expanded -->
      <div class="counters flex flex-wrap gap-2" v-else>
        <div
          class="counter flex w-11.5 cursor-pointer flex-col items-center transition-[filter] duration-200 hover:brightness-[1.2]"
          v-for="c of champion.counters.recommended"
          :key="c.champion_id"
          @click="setTab('champion', c.champion_id)"
        >
          <LcuImage class="image mb-1 h-8 w-8" :src="championIconUri(c.champion_id)" />
          <StatisticPopover
            metric="matchupWinRate"
            :value="formatWinRate(c.winRate)"
            :play="c.play"
            :record="c"
          >
            <div
              class="win-rate text-[11px] font-bold"
              :style="{ color: getWinRateColor(c.winRate) }"
            >
              {{ formatWinRate(c.winRate) }}
            </div>
          </StatisticPopover>
          <StatisticPopover metric="plays" :value="c.play.toLocaleString()">
            <div class="play text-center text-[10px] text-[#666666] dark:text-[#a4a4a4]">
              {{
                t('opgg.champion.times', {
                  times: c.play.toLocaleString()
                })
              }}
            </div>
          </StatisticPopover>
        </div>
      </div>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { championIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { useTranslation } from 'i18next-vue'
import { NFlex, NRadio, NRadioGroup } from 'naive-ui'
import { ref, watchEffect } from 'vue'

import { useOpgg } from '../context'
import { useWinRateTheme } from '@champion-data-window/components/champion-statistics/theme'
import StatisticPopover from './StatisticPopover.vue'

const { champion, setTab } = useOpgg()
const { t } = useTranslation()
const { getWinRateColor, formatWinRate } = useWinRateTheme()

const matchupFilter = ref<'all' | 'disadvantage'>('disadvantage')

watchEffect(() => {
  if (!champion.value) {
    matchupFilter.value = 'disadvantage'
  }
})
</script>
