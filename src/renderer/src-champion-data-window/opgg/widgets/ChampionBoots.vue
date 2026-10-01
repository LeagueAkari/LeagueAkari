<template>
  <SettingsSection v-if="champion && champion.boots.length" :title="t('opgg.champion.boots')">
    <template #headerSuffix>
      <ExpandButton v-if="champion.boots.length > 4" v-model:expanded="isBootsExpanded" />
    </template>

    <div class="p-3">
      <div class="grid grid-cols-2 gap-x-3">
        <div
          class="mb-1 flex items-center gap-1 last:mb-0"
          v-for="(s, i) of champion.boots.slice(0, isBootsExpanded ? Infinity : 4)"
        >
          <div class="min-w-4 text-[10px] text-[#666666] dark:text-[#b2b2b2]">#{{ i + 1 }}</div>
          <template v-for="(ss, i) of s.ids">
            <ItemDisplay :size="24" :item-id="ss" :max-width="300" />
            <NIcon
              v-if="i < s.ids.length - 1"
              class="separator text-[10px] text-[#999999] dark:text-[#909090]"
            >
              <ArrowForwardIosOutlinedIcon />
            </NIcon>
          </template>
          <div class="desc ml-auto flex items-center">
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
                  }}
                </span>
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
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import { ArrowForwardIosOutlined as ArrowForwardIosOutlinedIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'
import { ref, watchEffect } from 'vue'

import { useOpgg } from '../context'
import { useWinRateTheme } from '@champion-data-window/components/champion-statistics/theme'
import ExpandButton from './ExpandButton.vue'
import StatisticPopover from './StatisticPopover.vue'

const { champion } = useOpgg()
const { t } = useTranslation()
const { getWinRateColor, formatWinRate } = useWinRateTheme()

const isBootsExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isBootsExpanded.value = false
  }
})
</script>
