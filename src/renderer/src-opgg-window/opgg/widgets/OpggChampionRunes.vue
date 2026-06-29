<template>
  <div
    class="mb-1 rounded border border-black/10 p-2 last:mb-0 dark:border-[#37373c]"
    v-if="champion && champion.data.runes && champion.data.runes.length"
  >
    <div class="mb-2 flex items-center justify-between text-[13px] font-bold">
      {{ t('opgg.champion.runes') }}
      <NCheckbox size="small" v-model:checked="isRunesExpanded">
        {{ t('opgg.champion.showAll') }}
      </NCheckbox>
    </div>

    <!--  runes -->
    <div
      class="mb-3 flex items-center gap-1 last:mb-0"
      v-for="(r, i) of champion.data.runes.slice(0, isRunesExpanded ? Infinity : 2)"
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
          <PerkDisplay :max-width="280" :size="18" v-for="p of r.secondary_rune_ids" :perk-id="p" />
          <div class="gap w-6"></div>
          <PerkDisplay :max-width="280" :size="18" v-for="p of r.stat_mod_ids" :perk-id="p" />
        </div>
      </div>
      <div class="desc ml-auto flex items-center">
        <div class="pick flex min-w-19 flex-col items-center">
          <span
            class="pick-rate text-xs font-bold text-[#1a1a1a] dark:text-[#ebebeb]"
            :title="t('opgg.champion.pickRate')"
            >{{ (r.pick_rate * 100).toFixed(2) }}%</span
          >
          <span
            class="pick-play text-center text-xs text-[#666666] dark:text-[#bebebe]"
            :title="t('opgg.champion.plays')"
          >
            {{
              t('opgg.champion.times', {
                times: r.play.toLocaleString()
              })
            }}</span
          >
        </div>
        <div
          class="win-rate min-w-19 text-center text-xs font-bold text-[#2563eb] dark:text-[#a0c6f8]"
          :title="t('opgg.champion.winRate')"
        >
          {{ ((r.win / (r.play || 1)) * 100).toFixed(2) }}%
        </div>
        <div class="buttons flex min-w-19 justify-center">
          <NButton
            @click="setRunes(r, { championId: champion.data.summary.id, position: position })"
            size="tiny"
            type="primary"
            :disabled="!lcs.isConnected"
            secondary
          >
            {{ t('opgg.champion.apply') }}
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
