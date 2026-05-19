<template>
  <div class="rounded bg-black/5 px-4 py-2 dark:bg-white/5" v-if="analysis">
    <div class="mb-3 text-base font-bold text-gray-900 dark:text-white">
      {{ t('PlayerTab.stats.title') }}
    </div>
    <div class="flex flex-col gap-1">
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

      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.avgKp')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ (analysis.summary.avgKillParticipation * 100).toFixed() }}%
        </span>
      </div>

      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.avgDmg')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ (analysis.summary.avgChampionDamagePercentageOfTeam * 100).toFixed() }}%
        </span>
      </div>

      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.avgDmgTaken')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ (analysis.summary.avgDamageTakenPercentageOfTeam * 100).toFixed() }}%
        </span>
      </div>

      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.avgGold')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ (analysis.summary.avgGoldPercentageOfTeam * 100).toFixed() }}%
        </span>
      </div>

      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.avgCs')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ (analysis.summary.avgCsPercentageOfTeam * 100).toFixed() }}%
        </span>
      </div>

      <div
        class="flex w-full items-center gap-2"
        v-if="
          (analysis.winLoss.all.activeSessionWins > 0 ||
            analysis.winLoss.all.activeSessionLosses > 0) &&
          page &&
          (page.queryParams.startIndex === 0 || page.queryParams.startIndex === undefined)
        "
      >
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.activeSession', 'active')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ analysis.winLoss.all.activeSessionWins }} {{ t('PlayerTab.stats.winShort') }}
          {{ analysis.winLoss.all.activeSessionLosses }}
          {{ t('PlayerTab.stats.lossShort') }} ({{
            (
              (analysis.winLoss.all.activeSessionWins /
                (analysis.winLoss.all.activeSessionWins +
                  analysis.winLoss.all.activeSessionLosses)) *
              100
            ).toFixed()
          }}%)
        </span>
      </div>

      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.winLose')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ analysis.winLoss.all.wins }} {{ t('PlayerTab.stats.winShort') }}
          {{ analysis.winLoss.all.losses }} {{ t('PlayerTab.stats.lossShort') }} ({{
            (analysis.winLoss.all.winRate * 100).toFixed()
          }}%)
          <span
            v-if="currentStreak"
            class="ml-1 inline-flex max-w-55 flex-wrap items-center justify-end gap-1"
          >
            <span
              class="rounded px-1 py-0.5 text-[12px] leading-none"
              :class="getStreakBadgeClass(currentStreak.isWinning, currentStreak.count)"
            >
              {{
                t(
                  currentStreak.isWinning
                    ? 'PlayerTab.stats.winningStreak'
                    : 'PlayerTab.stats.losingStreak',
                  { count: currentStreak.count }
                )
              }}
            </span>
          </span>
        </span>
      </div>

      <div
        class="flex w-full items-center gap-2"
        v-if="analysis.teamSide.blueSideCount > 0 || analysis.teamSide.redSideCount > 0"
      >
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.teamSides')
        }}</span>
        <div class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          <div class="flex items-center">
            <div class="mr-1 size-3 rounded-full bg-blue-500"></div>
            <span>{{ analysis.teamSide.blueSideCount }}</span>
            <span class="mx-2 text-xs text-gray-700 dark:text-gray-400">/</span>
            <div class="mr-1 size-3 rounded-full bg-red-400"></div>
            <span>{{ analysis.teamSide.redSideCount }}</span>
          </div>
        </div>
      </div>

      <div class="flex w-full items-center gap-2" v-if="frequentlyUsedChampions.length">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('PlayerTab.stats.champions')
        }}</span>
        <div class="ml-auto flex max-w-27.5 flex-wrap justify-end gap-0.5">
          <NPopover
            v-for="c of frequentlyUsedChampions"
            :key="c.championId"
            :delay="50"
            :keep-alive-on-hover="false"
          >
            <template #trigger>
              <div class="relative h-5 w-5 rounded transition-[filter]">
                <LcuImage class="h-full w-full" :src="championIconUri(c.championId)" />
                <div
                  class="absolute -right-0.5 -bottom-1 rounded-sm bg-black/60 px-0.5 text-[10px] text-gray-200"
                >
                  {{ c.winLoss.all.count }}
                </div>
              </div>
            </template>
            <div class="text-xs">
              <div>
                {{ lcs.gameData.champions[c.championId]?.name }} · {{ c.winLoss.all.count }}
                {{ t('PlayerTab.stats.times') }}
              </div>
              <div class="mt-0.5 flex gap-1">
                <span class="text-green-600 dark:text-green-400"
                  >{{ c.winLoss.all.wins }} {{ t('PlayerTab.stats.win') }}</span
                >
                <span class="text-orange-600 dark:text-orange-400"
                  >{{ c.winLoss.all.losses }} {{ t('PlayerTab.stats.lose') }}</span
                >
                <span
                  >({{ t('PlayerTab.stats.wr') }}
                  {{ (c.winLoss.all.winRate * 100).toFixed() }}%)</span
                >
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
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

import { useMatchHistory } from '../data/match-history'

const FREQUENT_USE_CHAMPION_THRESHOLD = 1

const { t } = useTranslation()
const as = useAppCommonStore()
const lcs = useLeagueClientStore()

const { page, analysis: analysis } = useMatchHistory()

const currentStreak = computed(() => {
  // 连胜目前只统计第一页
  if (!analysis.value || (page.value?.queryParams && page.value.queryParams.startIndex !== 0)) {
    return null
  }

  if (analysis.value.winLoss.all.winningStreak >= 2) {
    return { isWinning: true, count: analysis.value.winLoss.all.winningStreak }
  }

  if (analysis.value.winLoss.all.losingStreak >= 2) {
    return { isWinning: false, count: analysis.value.winLoss.all.losingStreak }
  }

  return null
})

const getStreakBadgeClass = (isWinning: boolean, _count: number) => {
  return isWinning
    ? 'border border-emerald-500/45 bg-emerald-500/12 font-semibold text-emerald-700 dark:border-emerald-300/55 dark:bg-emerald-300/15 dark:text-emerald-300'
    : 'border border-red-500/45 bg-red-500/12 font-semibold text-red-700 dark:border-red-300/55 dark:bg-red-300/15 dark:text-red-300'
}

const frequentlyUsedChampions = computed(() => {
  if (!analysis.value) {
    return []
  }

  return Object.values(analysis.value.champions)
    .filter((c) => c.winLoss.all.count >= FREQUENT_USE_CHAMPION_THRESHOLD)
    .sort((a, b) => {
      if (a.winLoss.all.count !== b.winLoss.all.count) {
        return b.winLoss.all.count - a.winLoss.all.count
      }
      return b.winLoss.all.wins - a.winLoss.all.wins
    })
})
</script>
