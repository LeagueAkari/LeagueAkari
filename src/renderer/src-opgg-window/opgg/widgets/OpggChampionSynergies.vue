<template>
  <div
    class="mb-1 rounded border border-black/10 p-2 last:mb-0 dark:border-[#37373c]"
    v-if="champion && champion.data.synergies && champion.data.synergies.length"
  >
    <div class="mb-2 flex items-center justify-between text-[13px] font-bold">
      {{ t('OpggChampion.synergies')
      }}<NCheckbox size="small" v-model:checked="isSynergiesExpanded">{{
        t('OpggChampion.showAll')
      }}</NCheckbox>
    </div>
    <div
      class="mb-1 flex items-center gap-1 last:mb-0"
      v-for="(s, i) of champion.data.synergies.slice(0, isSynergiesExpanded ? Infinity : 4)"
    >
      <div class="mr-1 min-w-[16px] text-[10px] text-[#666666] dark:text-[#b2b2b2]">
        #{{ i + 1 }}
      </div>
      <div
        class="flex cursor-pointer items-center gap-1 text-xs transition-[filter] duration-200 hover:brightness-[1.2]"
        @click="setTab('champion', s.champion_id)"
      >
        <LcuImage class="image h-6 w-6" :src="championIconUri(s.champion_id)" />
        <span>{{ lcs.gameData.championName(s.champion_id) }}</span>
      </div>
      <div class="desc ml-auto flex items-center">
        <div class="value-text flex min-w-[76px] flex-col items-center">
          <span class="value text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]">{{
            (s.total_place / (s.play || 1)).toFixed(2)
          }}</span>
          <span class="text text-xs text-[#666666] dark:text-[#bebebe]"
            >{{ t('OpggChampion.avgPlace') }}
          </span>
        </div>
        <div class="value-text flex min-w-[76px] flex-col items-center">
          <span class="value text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
            >{{ ((s.first_place / (s.play || 1)) * 100).toFixed(2) }}%</span
          >
          <span class="text text-xs text-[#666666] dark:text-[#bebebe]">{{
            t('OpggChampion.1st')
          }}</span>
        </div>
        <div class="value-text flex min-w-[76px] flex-col items-center">
          <span
            class="value text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
            :title="t('OpggChampion.pickRate')"
            >{{ (s.pick_rate * 100).toFixed(2) }}%</span
          >
          <span
            class="text text-xs text-[#666666] dark:text-[#bebebe]"
            :title="t('OpggChampion.plays')"
          >
            {{
              t('OpggChampion.times', {
                times: s.play.toLocaleString()
              })
            }}</span
          >
        </div>
        <div class="value-text flex min-w-[76px] flex-col items-center">
          <span
            class="value text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
            :title="t('OpggChampion.winRate')"
            >{{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%</span
          >
          <span
            class="text text-xs text-[#666666] dark:text-[#bebebe]"
            :title="t('OpggChampion.winRate')"
            >{{ t('OpggChampion.winRate') }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { useTranslation } from 'i18next-vue'
import { NCheckbox } from 'naive-ui'
import { ref, watchEffect } from 'vue'

import { useOpgg } from '../context'

const { champion, setTab } = useOpgg()
const { t } = useTranslation()
const lcs = useLeagueClientStore()

const isSynergiesExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isSynergiesExpanded.value = false
  }
})
</script>
