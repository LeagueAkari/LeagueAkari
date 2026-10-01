<template>
  <SettingsSection
    v-if="champion && champion.skillMasteries.length"
    :title="t('opgg.champion.abilityBuild')"
  >
    <template #headerSuffix>
      <ExpandButton
        v-if="champion.skillMasteries.length > 2"
        v-model:expanded="isSkillMasteriesExpanded"
      />
    </template>

    <div class="p-3">
      <div
        class="mb-2 flex min-h-14 items-center last:mb-0"
        v-for="(m, i) of champion.skillMasteries.slice(0, isSkillMasteriesExpanded ? Infinity : 2)"
      >
        <div class="mr-1 min-w-4 text-[10px] text-[#666666] dark:text-[#b2b2b2]">#{{ i + 1 }}</div>
        <div>
          <div class="mb-2 flex flex-wrap items-center gap-1">
            <template v-for="(s, i) of m.ids">
              <div
                class="skill relative box-border flex h-6 min-w-6 items-center justify-center rounded-sm px-0.5"
                :class="{
                  'bg-gray-200 text-[#00a085] dark:bg-[#3f3f46] dark:text-[#00d7b0]':
                    s.startsWith('W'),
                  'bg-gray-200 text-[#0178c4] dark:bg-[#3f3f46] dark:text-[#01a8fb]':
                    s.startsWith('Q'),
                  'bg-gray-200 text-[#cc6600] dark:bg-[#3f3f46] dark:text-[#ff8200]':
                    s.startsWith('E'),
                  'bg-[#5f32e6] text-white': s.startsWith('R')
                }"
              >
                {{ s }}
              </div>
              <NIcon
                v-if="i < m.ids.length - 1"
                class="separator text-[10px] text-[#999999] dark:text-[#909090]"
              >
                <ArrowForwardIosOutlinedIcon />
              </NIcon>
            </template>
          </div>
          <div class="flex flex-wrap gap-0.5">
            <!-- display only one group of it -->
            <div
              class="skill relative box-border flex h-4 items-center justify-center rounded-xs text-[10px]"
              :class="[
                isSingleLetterAbilityName(s) ? 'w-4 min-w-4 px-0' : 'min-w-6 px-0.5',
                {
                  'bg-gray-200 text-[#00a085] dark:bg-[#3f3f46] dark:text-[#00d7b0]':
                    s.startsWith('W'),
                  'bg-gray-200 text-[#0178c4] dark:bg-[#3f3f46] dark:text-[#01a8fb]':
                    s.startsWith('Q'),
                  'bg-gray-200 text-[#cc6600] dark:bg-[#3f3f46] dark:text-[#ff8200]':
                    s.startsWith('E'),
                  'bg-[#5f32e6] text-white': s.startsWith('R')
                }
              ]"
              v-for="s of m.builds[0]?.order ?? []"
            >
              {{ s }}
            </div>
          </div>
        </div>
        <div class="desc ml-auto flex items-center">
          <StatisticPopover
            metric="pickRate"
            :value="(m.pick_rate * 100).toFixed(2) + '%'"
            :play="m.play"
          >
            <div class="pick flex min-w-19 flex-col items-center">
              <span class="pick-rate text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
                >{{ (m.pick_rate * 100).toFixed(2) }}%</span
              >

              <span class="pick-play text-center text-xs text-[#666666] dark:text-[#bebebe]">
                {{
                  t('opgg.champion.times', {
                    times: m.play.toLocaleString()
                  })
                }}</span
              >
            </div>
          </StatisticPopover>
          <StatisticPopover
            metric="winRate"
            :value="formatWinRate(m.winRate)"
            :play="m.play"
            :record="m"
          >
            <div
              class="win-rate min-w-19 text-center text-xs font-bold"
              :style="{ color: getWinRateColor(m.winRate) }"
            >
              {{ formatWinRate(m.winRate) }}
            </div>
          </StatisticPopover>
        </div>
      </div>
    </div>
  </SettingsSection>
</template>

<script setup lang="ts">
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
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

const isSkillMasteriesExpanded = ref(false)
const isSingleLetterAbilityName = (name: string) => /^[QWER]$/.test(name)

watchEffect(() => {
  if (!champion.value) {
    isSkillMasteriesExpanded.value = false
  }
})
</script>
