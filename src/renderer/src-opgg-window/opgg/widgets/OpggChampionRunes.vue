<template>
  <div
    class="mb-1 rounded border border-[#37373c] p-2 last:mb-0"
    v-if="champion && champion.data.runes && champion.data.runes.length"
  >
    <div class="mb-2 flex items-center justify-between text-[13px] font-bold">
      {{ t('OpggChampion.runes') }}
      <NCheckbox size="small" v-model:checked="isRunesExpanded">
        {{ t('OpggChampion.showAll') }}
      </NCheckbox>
    </div>

    <!--  runes -->
    <div
      class="mb-3 flex items-center gap-1 last:mb-0"
      v-for="(r, i) of champion.data.runes.slice(0, isRunesExpanded ? Infinity : 2)"
    >
      <div class="min-w-[16px] text-[10px] text-[#b2b2b2]">#{{ i + 1 }}</div>
      <div>
        <div class="primary items.end mb-1 flex gap-[2px]">
          <PerkstyleDisplay class="mr-1" :size="24" :perkstyle-id="r.primary_page_id" />
          <PerkDisplay :max-width="280" :size="18" v-for="p of r.primary_rune_ids" :perk-id="p" />
        </div>
        <div class="secondary items.end flex gap-[2px]">
          <PerkstyleDisplay
            class="secondary-style mr-1"
            :size="24"
            :perkstyle-id="r.secondary_page_id"
          />
          <PerkDisplay :max-width="280" :size="18" v-for="p of r.secondary_rune_ids" :perk-id="p" />
          <div class="gap w-6"></div>
          <PerkDisplay :max-width="280" :size="18" v-for="p of r.stat_mod_ids" :perk-id="p" />
        </div>
      </div>
      <div class="desc ml-auto flex items-center">
        <div class="pick flex min-w-[76px] flex-col items-center">
          <span
            class="pick-rate text-xs font-bold text-[#ebebeb]"
            :title="t('OpggChampion.pickRate')"
            >{{ (r.pick_rate * 100).toFixed(2) }}%</span
          >
          <span
            class="pick-play text-center text-xs text-[#bebebe]"
            :title="t('OpggChampion.plays')"
          >
            {{
              t('OpggChampion.times', {
                times: r.play.toLocaleString()
              })
            }}</span
          >
        </div>
        <div
          class="win-rate min-w-[76px] text-center text-xs font-bold text-[#a0c6f8]"
          :title="t('OpggChampion.winRate')"
        >
          {{ ((r.win / (r.play || 1)) * 100).toFixed(2) }}%
        </div>
        <div class="buttons flex min-w-[76px] justify-center">
          <NButton
            @click="setRunes(r, { championId: champion.data.summary.id, position: position })"
            size="tiny"
            type="primary"
            :disabled="lcs.connectionState !== 'connected'"
            secondary
          >
            {{ t('OpggChampion.apply') }}
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@renderer-shared/components/widgets/PerkstyleDisplay.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NCheckbox } from 'naive-ui'
import { ref, watchEffect } from 'vue'

import { useOpgg } from '../context'
import { useLoadout } from '../utils/loadout'

const { champion, position } = useOpgg()
const { setRunes } = useLoadout()
const { t } = useTranslation()
const lcs = useLeagueClientStore()

const isRunesExpanded = ref(false)

watchEffect(() => {
  if (!champion.value) {
    isRunesExpanded.value = false
  }
})
</script>
