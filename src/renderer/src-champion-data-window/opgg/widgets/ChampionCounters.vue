<template>
  <SettingsSection
    v-if="matchups.advantage.length || matchups.disadvantage.length"
    :title="t('opgg.champion.matchups')"
  >
    <template #headerSuffix>
      <NRadioGroup v-model:value="matchupFilter" size="small" class="max-w-full">
        <NFlex :size="12" class="justify-end">
          <NRadio value="advantage" :disabled="!matchups.advantage.length">
            {{ t('opgg.champion.advantage') }}
          </NRadio>
          <NRadio value="disadvantage" :disabled="!matchups.disadvantage.length">
            {{ t('opgg.champion.counter') }}
          </NRadio>
        </NFlex>
      </NRadioGroup>
    </template>

    <div class="p-3">
      <div v-if="counters.length" class="counters flex flex-wrap gap-2">
        <div
          class="counter flex w-11.5 cursor-pointer flex-col items-center transition-[filter] duration-200 hover:brightness-120"
          v-for="c of counters"
          :key="c.championId"
          role="button"
          tabindex="0"
          :aria-label="resources.champions.name(c.championId)"
          @click="setTab('champion', c.championId)"
          @keydown.enter="setTab('champion', c.championId)"
          @keydown.space.prevent="setTab('champion', c.championId)"
        >
          <NTooltip>
            <template #trigger>
              <ChampionIcon class="mb-1 size-8 rounded" :champion-id="c.championId" />
            </template>
            {{ resources.champions.name(c.championId) }}
          </NTooltip>
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

      <div
        v-else
        class="flex h-16 w-full items-center justify-center text-xs text-black/50 dark:text-white/50"
      >
        {{ t('opgg.champion.empty') }}
      </div>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useTranslation } from 'i18next-vue'
import { NFlex, NRadio, NRadioGroup, NTooltip } from 'naive-ui'
import { computed, ref, watchEffect } from 'vue'

import { useOpgg } from '../context'
import { useWinRateTheme } from '@champion-data-window/components/champion-statistics/theme'
import StatisticPopover from './StatisticPopover.vue'

const { champion, setTab } = useOpgg()
const resources = useAkariResourceProvider()
const { t } = useTranslation()
const { getWinRateColor, formatWinRate } = useWinRateTheme()

const matchupFilter = ref<'advantage' | 'disadvantage'>('disadvantage')

const matchups = computed(() => {
  const details = champion.value

  if (!details || details.kind === 'arena' || details.kind === 'aram_mayhem') {
    return { advantage: [], disadvantage: [] }
  }

  return {
    advantage: details.counters.all.filter((item) => item.winRate !== null && item.winRate > 0.5),
    disadvantage: details.counters.all
      .filter((item) => item.winRate !== null && item.winRate < 0.5)
      .toReversed()
  }
})
const counters = computed(() => matchups.value[matchupFilter.value])

watchEffect(() => {
  if (!counters.value.length) {
    matchupFilter.value = matchups.value.disadvantage.length ? 'disadvantage' : 'advantage'
  }
})
</script>
