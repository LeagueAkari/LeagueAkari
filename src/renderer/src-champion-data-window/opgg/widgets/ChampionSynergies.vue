<template>
  <SettingsSection
    v-if="champion && champion.synergies.length"
    :title="t('opgg.champion.synergies')"
  >
    <template #headerSuffix>
      <ExpandButton v-if="champion.synergies.length > 4" v-model:expanded="isSynergiesExpanded" />
    </template>

    <div class="p-3">
      <div
        class="mb-1 flex items-center gap-1 last:mb-0"
        v-for="(s, i) of champion.synergies.slice(0, isSynergiesExpanded ? Infinity : 4)"
      >
        <div class="mr-1 min-w-4 text-[10px] text-[#666666] dark:text-[#b2b2b2]">#{{ i + 1 }}</div>
        <div
          class="flex cursor-pointer items-center gap-1 text-xs transition-[filter] duration-200 hover:brightness-120"
          @click="setTab('champion', s.champion_id)"
        >
          <LcuImage
            class="image size-6"
            :src="resources.champions.icon(s.champion_id)?.iconPath ?? ''"
          />
          <span>{{ resources.champions.name(s.champion_id) }}</span>
        </div>
        <div class="desc ml-auto flex items-center">
          <StatisticPopover
            v-if="s.averagePlace != null"
            metric="averagePlace"
            :value="s.averagePlace.toFixed(2)"
            :play="s.play"
          >
            <div class="value-text flex min-w-19 flex-col items-center">
              <span class="value text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]">{{
                s.averagePlace.toFixed(2)
              }}</span>
              <span class="text text-xs text-[#666666] dark:text-[#bebebe]"
                >{{ t('opgg.champion.avgPlace') }}
              </span>
            </div>
          </StatisticPopover>
          <StatisticPopover
            v-if="s.firstPlaceRate != null"
            metric="firstPlaceRate"
            :value="(s.firstPlaceRate * 100).toFixed(2) + '%'"
            :play="s.play"
          >
            <div class="value-text flex min-w-19 flex-col items-center">
              <span class="value text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
                >{{ (s.firstPlaceRate * 100).toFixed(2) }}%</span
              >
              <span class="text text-xs text-[#666666] dark:text-[#bebebe]">{{
                t('opgg.champion.1st')
              }}</span>
            </div>
          </StatisticPopover>
          <StatisticPopover
            metric="synergyPickRate"
            :value="(s.pick_rate * 100).toFixed(2) + '%'"
            :play="s.play"
          >
            <div class="value-text flex min-w-19 flex-col items-center">
              <span class="value text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
                >{{ (s.pick_rate * 100).toFixed(2) }}%</span
              >

              <span class="text text-xs text-[#666666] dark:text-[#bebebe]">{{
                t('opgg.champion.times', { times: s.play.toLocaleString() })
              }}</span>
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
        </div>
      </div>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { useTranslation } from 'i18next-vue'
import { ref, watchEffect } from 'vue'

import { useOpgg } from '../context'
import { useWinRateTheme } from '@champion-data-window/components/champion-statistics/theme'
import ExpandButton from './ExpandButton.vue'
import StatisticPopover from './StatisticPopover.vue'

const { champion, setTab } = useOpgg()
const { t } = useTranslation()
const { getWinRateColor, formatWinRate } = useWinRateTheme()
const resources = useAkariResourceProvider()

const isSynergiesExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isSynergiesExpanded.value = false
  }
})
</script>
