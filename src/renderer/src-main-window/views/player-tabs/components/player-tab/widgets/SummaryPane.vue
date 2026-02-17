<template>
  <div class="rounded bg-black/5 px-4 py-2 dark:bg-white/5" v-if="analysis">
    <div class="mb-3 text-base font-bold text-gray-900 dark:text-white">
      {{ t('PlayerTab.stats.title') }}
    </div>
    <div class="flex flex-col gap-1">
      <!-- Akari Score (Kyoko Mode Only) -->
      <div
        class="flex w-full items-center gap-2"
        v-if="as.settings.isInKyokoMode"
        title="Akari's insight"
      >
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.akariScore')
        }}</span>
        <span
          class="ml-auto text-right text-[13px] text-gray-900 dark:text-white"
          :class="{ 'opacity-60': analysis.akariScore === null }"
        >
          <template v-if="analysis.akariScore !== null">
            <LeagueAkariSpan bold :text="analysis.akariScore.total.toFixed(2)" />
          </template>
          <template v-else>{{ t('PlayerTab.stats.na') }}</template>
        </span>
      </div>

      <!-- Average KDA -->
      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.avgKda')
        }}</span>
        <NPopover>
          <template #trigger>
            <span
              class="ml-auto cursor-default text-right text-[13px] text-gray-900 dark:text-white"
            >
              {{ analysis.summary.avgKda.toFixed(2) }}
            </span>
          </template>
          {{ analysis.summary.kills }} / {{ analysis.summary.deaths }} /
          {{ analysis.summary.assists }}
        </NPopover>
      </div>

      <!-- Average Kill Participation -->
      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.avgKp')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ (analysis.summary.avgKillParticipation * 100).toFixed() }}%
        </span>
      </div>

      <!-- Average Damage -->
      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.avgDmg')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ (analysis.summary.avgChampionDamagePercentageOfTeam * 100).toFixed() }}%
        </span>
      </div>

      <!-- Average Damage Taken -->
      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.avgDmgTaken')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ (analysis.summary.avgDamageTakenPercentageOfTeam * 100).toFixed() }}%
        </span>
      </div>

      <!-- Average Gold -->
      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.avgGold')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ (analysis.summary.avgGoldPercentageOfTeam * 100).toFixed() }}%
        </span>
      </div>

      <!-- Average CS -->
      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.avgCs')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ (analysis.summary.avgCsPercentageOfTeam * 100).toFixed() }}%
        </span>
      </div>

      <!-- Active Session -->
      <div
        class="flex w-full items-center gap-2"
        v-if="
          (analysis.summary.activeSessionWins > 0 || analysis.summary.activeSessionLosses > 0) &&
          pagedMatchHistory &&
          (pagedMatchHistory.queryParams.startIndex === 0 ||
            pagedMatchHistory.queryParams.startIndex === undefined)
        "
      >
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.activeSession', 'active')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ analysis.summary.activeSessionWins }} {{ t('PlayerTab.stats.winShort') }}
          {{ analysis.summary.activeSessionLosses }}
          {{ t('PlayerTab.stats.lossShort') }} ({{
            (
              (analysis.summary.activeSessionWins /
                (analysis.summary.activeSessionWins + analysis.summary.activeSessionLosses)) *
              100
            ).toFixed()
          }}%)
        </span>
      </div>

      <!-- Win/Lose -->
      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.winLose')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ analysis.summary.wins }} {{ t('PlayerTab.stats.winShort') }}
          {{ analysis.summary.losses }} {{ t('PlayerTab.stats.lossShort') }} ({{
            (analysis.summary.winRate * 100).toFixed()
          }}%)
          <span class="ml-1 inline-flex max-w-[220px] flex-wrap items-center justify-end gap-1">
            <span
              v-if="currentStreak"
              class="rounded px-1 py-0.5 text-[12px] leading-none"
              :class="getStreakBadgeClass(currentStreak.isWinning, currentStreak.count)"
            >
              {{
                t(
                  currentStreak.isWinning
                    ? 'PlayerTab.stats.winningStreak'
                    : 'PlayerTab.stats.losingStreak',
                  { countV: currentStreak.count }
                )
              }}
            </span>
          </span>
        </span>
      </div>

      <!-- Team Sides (Blue/Red) -->
      <div
        class="flex w-full items-center gap-2"
        v-if="analysis.summary.blueSideCount > 0 || analysis.summary.redSideCount > 0"
      >
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.teamSides')
        }}</span>
        <div class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          <div class="flex items-center">
            <div class="mr-1 size-3 rounded-full bg-blue-500"></div>
            <span>{{ analysis.summary.blueSideCount }}</span>
            <span class="mx-2 text-xs text-gray-700 dark:text-gray-400">/</span>
            <div class="mr-1 size-3 rounded-full bg-red-400"></div>
            <span>{{ analysis.summary.redSideCount }}</span>
          </div>
        </div>
      </div>

      <!-- Frequently Used Champions -->
      <div class="flex w-full items-center gap-2" v-if="frequentlyUsedChampions.length">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.champions')
        }}</span>
        <div class="ml-auto flex max-w-[110px] flex-wrap justify-end gap-0.5">
          <NPopover
            v-for="c of frequentlyUsedChampions"
            :key="c.id"
            :delay="50"
            :keep-alive-on-hover="false"
          >
            <template #trigger>
              <div class="relative h-5 w-5">
                <LcuImage class="h-full w-full" :src="championIconUri(c.id)" />
                <div
                  class="absolute -right-0.5 -bottom-1 rounded-sm bg-black/60 px-0.5 text-[10px] text-gray-200"
                >
                  {{ c.count }}
                </div>
              </div>
            </template>
            <div class="text-xs">
              <div>
                {{ lcs.gameData.champions[c.id]?.name }} · {{ c.count }}
                {{ t('PlayerTab.stats.times') }}
              </div>
              <div class="mt-0.5 flex gap-1">
                <span class="text-green-600 dark:text-green-400"
                  >{{ c.wins }} {{ t('PlayerTab.stats.win') }}</span
                >
                <span class="text-orange-600 dark:text-orange-400"
                  >{{ c.losses }} {{ t('PlayerTab.stats.lose') }}</span
                >
                <span>({{ t('PlayerTab.stats.wr') }} {{ (c.winRate * 100).toFixed() }}%)</span>
              </div>
            </div>
          </NPopover>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/utils'
import { analyzeMatchHistory } from '@shared/data-adapter/analysis/players'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

import { usePlayerTab } from '../context'
import { useMatchHistory } from '../data/match-history'
import { useMatchHistoryFilters } from '../data/match-history-filters'

const FREQUENT_USE_CHAMPION_THRESHOLD = 1

const { t } = useTranslation()

const as = useAppCommonStore()
const lcs = useLeagueClientStore()

const { puuid } = usePlayerTab()
const { pagedMatchHistory } = useMatchHistory()
const { filters } = useMatchHistoryFilters()

const analysis = computed(() => {
  if (!pagedMatchHistory.value?.games) {
    return null
  }

  return analyzeMatchHistory(pagedMatchHistory.value.games, puuid.value, {
    includeIrregularGames: filters.value.showIrregularGames
  })
})

const currentStreak = computed(() => {
  if (!analysis.value) {
    return null
  }

  if (analysis.value.summary.winningStreak >= 2) {
    return { isWinning: true, count: analysis.value.summary.winningStreak }
  }

  if (analysis.value.summary.losingStreak >= 2) {
    return { isWinning: false, count: analysis.value.summary.losingStreak }
  }

  return null
})

const getStreakBadgeClass = (isWinning: boolean, count: number) => {
  if (count >= 7) {
    return isWinning
      ? 'border border-emerald-500/60 bg-emerald-500/20 font-bold text-emerald-700 dark:border-emerald-300/65 dark:bg-emerald-300/20 dark:text-emerald-200'
      : 'border border-red-500/60 bg-red-500/20 font-bold text-red-700 dark:border-red-300/65 dark:bg-red-300/20 dark:text-red-200'
  }

  if (count >= 4) {
    return isWinning
      ? 'border border-emerald-500/45 bg-emerald-500/12 font-semibold text-emerald-700 dark:border-emerald-300/55 dark:bg-emerald-300/15 dark:text-emerald-300'
      : 'border border-red-500/45 bg-red-500/12 font-semibold text-red-700 dark:border-red-300/55 dark:bg-red-300/15 dark:text-red-300'
  }

  return isWinning
    ? 'font-semibold text-emerald-600 dark:text-emerald-400'
    : 'font-semibold text-red-600 dark:text-red-400'
}

const frequentlyUsedChampions = computed(() => {
  if (!analysis.value) {
    return []
  }

  return Object.values(analysis.value.champions)
    .filter((c) => c.count >= FREQUENT_USE_CHAMPION_THRESHOLD)
    .sort((a, b) => {
      if (a.count !== b.count) {
        return b.count - a.count
      }
      return b.wins - a.wins
    })
})
</script>
