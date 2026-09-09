<template>
  <NCard size="small" class="player-card" :title="labels.summary">
    <div v-if="analysis" class="space-y-1.5">
      <SummaryRow :label="labels.akariScore" :value="decimal(analysis.akariScore)" strong />
      <SummaryRow
        :label="labels.kda"
        :value="`${decimal(analysis.averageKda)} (${analysis.kills}/${analysis.deaths}/${analysis.assists})`"
      />
      <SummaryRow
        :label="labels.participation"
        :value="percent(analysis.averageKillParticipation)"
      />
      <SummaryRow
        :label="labels.damageShare"
        :value="percent(analysis.averageDamagePercentageOfTeam)"
      />
      <SummaryRow
        :label="labels.damageTakenShare"
        :value="percent(analysis.averageDamageTakenPercentageOfTeam)"
      />
      <SummaryRow
        :label="labels.goldShare"
        :value="percent(analysis.averageGoldPercentageOfTeam)"
      />
      <SummaryRow :label="labels.csPerMinute" :value="decimal(analysis.averageCsPerMinute, 1)" />
      <SummaryRow
        v-if="analysis.activeSessionWins || analysis.activeSessionLosses"
        :label="labels.activeSession"
        :value="`${analysis.activeSessionWins}${labels.wins} ${analysis.activeSessionLosses}${labels.losses}`"
      />
      <div class="flex items-start gap-2 text-xs">
        <span class="opacity-60">{{ labels.winRate }}</span>
        <span class="ml-auto text-right tabular-nums">
          {{ analysis.wins }}{{ labels.wins }} {{ analysis.losses }}{{ labels.losses }} ({{
            percent(analysis.winRate)
          }})
          <span v-if="streak" :class="streak.winning ? 'streak-win' : 'streak-loss'">
            {{ streak.count }}{{ streak.winning ? labels.winningStreak : labels.losingStreak }}
          </span>
        </span>
      </div>
      <SummaryRow
        :label="labels.teamSides"
        :value="`🔵 ${analysis.blueSideCount} / 🔴 ${analysis.redSideCount}`"
      />
      <div v-if="analysis.champions.length" class="flex items-start gap-2 pt-1 text-xs">
        <span class="shrink-0 opacity-60">{{ labels.frequentChampions }}</span>
        <div class="ml-auto flex flex-wrap justify-end gap-1">
          <div
            v-for="champion in analysis.champions.slice(0, 8)"
            :key="champion.championId"
            class="relative size-7"
            :title="`${champion.gameCount} games · ${percent(champion.winRate)}`"
          >
            <img
              class="size-full rounded"
              :src="api.assetUrl('champion', champion.championId)"
              alt=""
            />
            <span
              class="absolute -right-1 -bottom-1 rounded bg-black/70 px-1 text-[9px] text-white"
            >
              {{ champion.gameCount }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <NEmpty v-else size="small" :description="labels.noMatches" />
  </NCard>
</template>

<script setup lang="ts">
import type { LanWebAnalysisDto } from '@shared/shards/lan-web'
import { NCard, NEmpty } from 'naive-ui'
import { computed } from 'vue'

import type { LanWebApiClient } from '../api'
import { decimal } from '../format'
import type { LanWebLabels } from '../labels'
import SummaryRow from './SummaryRow.vue'

const props = defineProps<{
  analysis: LanWebAnalysisDto | null
  api: LanWebApiClient
  labels: LanWebLabels
}>()

const streak = computed(() => {
  if (!props.analysis) return null
  if (props.analysis.winningStreak >= 2) {
    return { winning: true, count: props.analysis.winningStreak }
  }
  if (props.analysis.losingStreak >= 2) {
    return { winning: false, count: props.analysis.losingStreak }
  }
  return null
})

function percent(value: number) {
  return `${(value * 100).toFixed()}%`
}
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.streak-win,
.streak-loss {
  @apply ml-1 inline-flex rounded border px-1 py-0.5 text-[10px] leading-none font-semibold;
}

.streak-win {
  @apply border-emerald-500/45 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300;
}

.streak-loss {
  @apply border-red-500/45 bg-red-500/12 text-red-700 dark:text-red-300;
}
</style>
