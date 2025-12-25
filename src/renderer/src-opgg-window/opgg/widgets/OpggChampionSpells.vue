<template>
  <div
    class="mb-1 rounded border border-black/10 p-2 last:mb-0 dark:border-[#37373c]"
    v-if="champion && champion.data.summoner_spells && champion.data.summoner_spells.length"
  >
    <!-- title line (title + expand) -->
    <div class="mb-2 flex items-center justify-between text-[13px] font-bold">
      {{ t('OpggChampion.spells') }}
      <NCheckbox size="small" v-model:checked="isSummonerSpellsExpanded">
        {{ t('OpggChampion.showAll') }}
      </NCheckbox>
    </div>

    <!--  summoner spells -->
    <div
      class="mb-1 flex items-center gap-1 last:mb-0"
      v-for="(s, i) of champion.data.summoner_spells.slice(
        0,
        isSummonerSpellsExpanded ? Infinity : 2
      )"
    >
      <div class="min-w-[16px] text-[10px] text-[#666666] dark:text-[#b2b2b2]">#{{ i + 1 }}</div>
      <div class="spells flex gap-1">
        <SummonerSpellDisplay :size="28" :spell-id="spell" v-for="spell of s.ids" />
      </div>
      <div class="desc flex flex-1 items-center justify-end">
        <div class="pick flex min-w-[76px] flex-col items-center">
          <span
            class="pick-rate text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
            :title="t('OpggChampion.pickRate')"
            >{{ (s.pick_rate * 100).toFixed(2) }}%</span
          >
          <span
            class="pick-play text-center text-xs text-[#666666] dark:text-[#bebebe]"
            :title="t('OpggChampion.plays')"
          >
            {{
              t('OpggChampion.times', {
                times: s.play.toLocaleString()
              })
            }}</span
          >
        </div>
        <div
          class="win-rate min-w-[76px] text-center text-xs font-bold text-[#2563eb] dark:text-[#a0c6f8]"
          :title="t('OpggChampion.winRate')"
        >
          {{ ((s.win / (s.play || 1)) * 100).toFixed(2) }}%
        </div>
        <div class="buttons flex min-w-[76px] justify-center">
          <NButton
            @click="setSummonerSpells(s.ids, flashPosition)"
            size="tiny"
            type="primary"
            secondary
            :disabled="lcs.gameflow.phase !== 'ChampSelect'"
          >
            {{ t('OpggChampion.apply') }}
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox } from 'naive-ui'
import { ref, watchEffect } from 'vue'

import { useOpgg } from '../context'
import { useLoadout } from '../utils/loadout'

const { champion, flashPosition } = useOpgg()
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
