<template>
  <SettingsSection
    v-if="champion && champion.runes.length"
    :title="t('opgg.champion.runes')"
    :footer="t('opgg.champion.runesFooter')"
  >
    <template #headerSuffix>
      <ExpandButton v-if="champion.runes.length > 2" v-model:expanded="isRunesExpanded" />
    </template>

    <div class="p-3">
      <!--  runes -->
      <div
        class="mb-3 flex items-center gap-1 last:mb-0"
        v-for="(r, i) of champion.runes.slice(0, isRunesExpanded ? Infinity : 2)"
      >
        <div class="min-w-4 text-[10px] text-[#666666] dark:text-[#b2b2b2]">#{{ i + 1 }}</div>
        <div>
          <div class="primary mb-1 flex items-end gap-0.5">
            <PerkstyleDisplay class="mr-1" :size="24" :perkstyle-id="r.primary_page_id" />
            <PerkDisplay :max-width="280" :size="18" v-for="p of r.primary_rune_ids" :perk-id="p" />
          </div>
          <div class="secondary flex items-end gap-0.5">
            <PerkstyleDisplay
              class="secondary-style mr-1"
              :size="24"
              :perkstyle-id="r.secondary_page_id"
            />
            <PerkDisplay
              :max-width="280"
              :size="18"
              v-for="p of r.secondary_rune_ids"
              :perk-id="p"
            />
            <div class="gap w-6"></div>
            <PerkDisplay :max-width="280" :size="18" v-for="p of r.stat_mod_ids" :perk-id="p" />
          </div>
        </div>
        <div class="desc ml-auto flex items-center">
          <StatisticPopover
            metric="pickRate"
            :value="(r.pick_rate * 100).toFixed(2) + '%'"
            :play="r.play"
          >
            <div class="pick flex min-w-19 flex-col items-center">
              <span class="pick-rate text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
                >{{ (r.pick_rate * 100).toFixed(2) }}%</span
              >

              <span class="pick-play text-center text-xs text-[#666666] dark:text-[#bebebe]">
                {{
                  t('opgg.champion.times', {
                    times: r.play.toLocaleString()
                  })
                }}</span
              >
            </div>
          </StatisticPopover>
          <StatisticPopover
            metric="winRate"
            :value="formatWinRate(r.winRate)"
            :play="r.play"
            :record="r"
          >
            <div
              class="win-rate min-w-19 text-center text-xs font-bold"
              :style="{ color: getWinRateColor(r.winRate) }"
            >
              {{ formatWinRate(r.winRate) }}
            </div>
          </StatisticPopover>
          <div class="buttons flex min-w-19 justify-center">
            <NButton
              @click="setRunes(r.recommendationId)"
              size="tiny"
              type="primary"
              :disabled="!lcs.isConnected || isApplying || isLoading"
              secondary
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
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@renderer-shared/components/widgets/PerkstyleDisplay.vue'
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
const { setRunes } = useLoadout()
const { t } = useTranslation()
const { getWinRateColor, formatWinRate } = useWinRateTheme()
const lcs = useLeagueClientStore()

const isRunesExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isRunesExpanded.value = false
  }
})
</script>
