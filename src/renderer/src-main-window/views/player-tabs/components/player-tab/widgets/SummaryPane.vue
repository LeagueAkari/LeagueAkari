<template>
  <div class="rounded bg-black/5 px-4 py-2 dark:bg-white/5" v-if="analysis">
    <div class="mb-3 text-base font-bold text-gray-900 dark:text-white">
      {{ t('playerTabs.summary.title') }}
    </div>
    <div class="flex flex-col gap-1">
      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('playerTabs.summary.akariScore')
        }}</span>
        <span
          class="ml-auto text-right text-[13px] text-gray-900 dark:text-white"
          :class="{ 'opacity-60': analysis.akariScore === null }"
        >
          <template v-if="analysis.akariScore !== null">
            <AkariScorePopover :score="analysis.akariScore">
              <LeagueAkariSpan
                bold
                :text="analysis.akariScore.total.toFixed(2)"
                class="cursor-default"
              />
            </AkariScorePopover>
          </template>
          <template v-else>{{ t('playerTabs.summary.na') }}</template>
        </span>
      </div>

      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('playerTabs.summary.avgKda')
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
          t('playerTabs.summary.avgKp')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ (analysis.summary.avgKillParticipation * 100).toFixed() }}%
        </span>
      </div>

      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('playerTabs.summary.avgDmg')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ (analysis.summary.avgChampionDamagePercentageOfTeam * 100).toFixed() }}%
        </span>
      </div>

      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('playerTabs.summary.avgDmgTaken')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ (analysis.summary.avgDamageTakenPercentageOfTeam * 100).toFixed() }}%
        </span>
      </div>

      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('playerTabs.summary.avgGold')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ (analysis.summary.avgGoldPercentageOfTeam * 100).toFixed() }}%
        </span>
      </div>

      <div class="flex w-full items-center gap-2">
        <span class="text-xs text-gray-700 dark:text-gray-400">{{
          t('playerTabs.summary.avgCsPerMinute')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{
            t('playerTabs.summary.perMinuteValue', {
              value: analysis.summary.avgCsPerMinute.toFixed(1)
            })
          }}
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
          t('playerTabs.summary.activeSession', 'active')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ analysis.winLoss.all.activeSessionWins }} {{ t('playerTabs.summary.winShort') }}
          {{ analysis.winLoss.all.activeSessionLosses }}
          {{ t('playerTabs.summary.lossShort') }} ({{
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
          t('playerTabs.summary.winLose')
        }}</span>
        <span class="ml-auto text-right text-[13px] text-gray-900 dark:text-white">
          {{ analysis.winLoss.all.wins }} {{ t('playerTabs.summary.winShort') }}
          {{ analysis.winLoss.all.losses }} {{ t('playerTabs.summary.lossShort') }} ({{
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
                    ? 'playerTabs.summary.winningStreak'
                    : 'playerTabs.summary.losingStreak',
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
          t('playerTabs.summary.teamSides')
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
          t('playerTabs.summary.champions')
        }}</span>
        <div class="ml-auto flex max-w-27.5 flex-wrap justify-end gap-0.5">
          <NPopover
            v-for="c of frequentlyUsedChampions"
            :key="c.championId"
            :delay="50"
            :keep-alive-on-hover="true"
          >
            <template #trigger>
              <div class="relative h-5 w-5 cursor-default rounded transition-[filter]">
                <LcuImage class="h-full w-full" :src="championIconUri(c.championId)" />
                <div
                  class="absolute -right-0.5 -bottom-1 rounded-sm bg-black/60 px-0.5 text-[10px] text-gray-200"
                >
                  {{ c.winLoss.all.count }}
                </div>
              </div>
            </template>
            <div class="w-88 text-xs">
              <div class="mb-2 flex items-center gap-2">
                <LcuImage class="size-7 shrink-0 rounded" :src="championIconUri(c.championId)" />
                <div class="min-w-0 flex-1">
                  <div class="truncate font-semibold text-gray-900 dark:text-white">
                    {{ championName(c.championId) }}
                  </div>
                  <div class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                    {{ c.winLoss.all.count }} {{ t('playerTabs.summary.times') }}
                  </div>
                </div>
                <div class="shrink-0 text-right">
                  <div
                    class="font-semibold tabular-nums"
                    :class="getWinRateTextClass(c.winLoss.all.winRate)"
                  >
                    {{ formatPercent(c.winLoss.all.winRate) }}
                  </div>
                  <div class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                    {{ c.winLoss.all.wins }} {{ t('playerTabs.summary.winShort') }}
                    {{ c.winLoss.all.losses }} {{ t('playerTabs.summary.lossShort') }}
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-1.5">
                <div class="rounded bg-black/5 px-2 py-1 dark:bg-white/8">
                  <div class="text-[11px] text-gray-500 dark:text-gray-400">
                    {{ t('playerTabs.summary.avgKda') }}
                  </div>
                  <div class="mt-0.5 font-semibold text-gray-900 tabular-nums dark:text-white">
                    {{ c.summary.avgKda.toFixed(2) }}
                  </div>
                  <div
                    class="mt-0.5 text-[10px] whitespace-nowrap text-gray-500 tabular-nums dark:text-gray-400"
                  >
                    {{ formatAverageKdaLine(c) }}
                  </div>
                </div>
                <div class="rounded bg-black/5 px-2 py-1 dark:bg-white/8">
                  <div class="text-[11px] text-gray-500 dark:text-gray-400">
                    {{ t('playerTabs.summary.avgKp') }}
                  </div>
                  <div class="mt-0.5 font-semibold text-gray-900 tabular-nums dark:text-white">
                    {{ formatPercent(c.summary.avgKillParticipation) }}
                  </div>
                </div>
                <div class="rounded bg-black/5 px-2 py-1 dark:bg-white/8">
                  <div class="text-[11px] text-gray-500 dark:text-gray-400">
                    {{ t('playerTabs.summary.avgCsPerMinute') }}
                  </div>
                  <div class="mt-0.5 font-semibold text-gray-900 tabular-nums dark:text-white">
                    {{
                      t('playerTabs.summary.perMinuteValue', {
                        value: c.summary.avgCsPerMinute.toFixed(1)
                      })
                    }}
                  </div>
                  <div class="mt-0.5 text-[10px] text-gray-500 tabular-nums dark:text-gray-400">
                    {{
                      t('playerTabs.summary.teamShare', {
                        value: formatPercent(c.summary.avgCsPercentageOfTeam)
                      })
                    }}
                  </div>
                </div>
              </div>

              <div class="mt-1.5 grid grid-cols-3 gap-x-3 gap-y-1 text-[11px]">
                <div>
                  <div class="text-gray-500 dark:text-gray-400">
                    {{ t('playerTabs.summary.avgDmg') }}
                  </div>
                  <div class="text-gray-900 tabular-nums dark:text-white">
                    {{ formatPercent(c.summary.avgChampionDamagePercentageOfTeam) }}
                  </div>
                </div>
                <div>
                  <div class="text-gray-500 dark:text-gray-400">
                    {{ t('playerTabs.summary.avgDmgTaken') }}
                  </div>
                  <div class="text-gray-900 tabular-nums dark:text-white">
                    {{ formatPercent(c.summary.avgDamageTakenPercentageOfTeam) }}
                  </div>
                </div>
                <div>
                  <div class="text-gray-500 dark:text-gray-400">
                    {{ t('playerTabs.summary.avgGold') }}
                  </div>
                  <div class="text-gray-900 tabular-nums dark:text-white">
                    {{ formatPercent(c.summary.avgGoldPercentageOfTeam) }}
                  </div>
                </div>
              </div>

              <div v-if="c.jungle" class="mt-2 border-t border-black/10 pt-2 dark:border-white/10">
                <div class="mb-1 flex items-center justify-between gap-3">
                  <div class="font-semibold text-gray-800 dark:text-gray-100">
                    {{ t('ongoingGame.junglePathing.title') }} ·
                    {{
                      t('ongoingGame.junglePathing.gamesAnalyzed', {
                        count: c.jungle.gamesAnalyzed
                      })
                    }}
                  </div>
                  <div class="tabular-nums" :class="topsideTextColor(c.jungle)">
                    {{ topsideTextTrigger(t, c.jungle) }}
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-1.5 text-[11px]">
                  <div class="rounded bg-indigo-500/8 px-2 py-1">
                    <div class="text-gray-500 dark:text-gray-400">
                      {{ t('playerTabs.summary.level3Short') }}
                    </div>
                    <div class="text-gray-900 tabular-nums dark:text-white">
                      {{ c.jungle.earlyGank.level3GankCount }}/{{ c.jungle.gamesAnalyzed }}
                    </div>
                  </div>
                  <div class="rounded bg-indigo-500/8 px-2 py-1">
                    <div class="text-gray-500 dark:text-gray-400">
                      {{ t('playerTabs.summary.level4Short') }}
                    </div>
                    <div class="text-gray-900 tabular-nums dark:text-white">
                      {{ c.jungle.earlyGank.level4GankCount }}/{{ c.jungle.gamesAnalyzed }}
                    </div>
                  </div>
                  <div class="rounded bg-indigo-500/8 px-2 py-1">
                    <div class="text-gray-500 dark:text-gray-400">
                      {{ t('ongoingGame.junglePathing.firstDragonRateLabel') }}
                    </div>
                    <div class="text-gray-900 tabular-nums dark:text-white">
                      {{ formatPercent(c.jungle.objectives.firstDragonRate) }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-2 border-t border-black/10 pt-2 dark:border-white/10">
                <NButton
                  block
                  secondary
                  size="tiny"
                  type="primary"
                  :loading="isLoading"
                  @click="collectChampionMatches(c.championId)"
                >
                  <template #icon>
                    <NIcon>
                      <ManageSearchFilledIcon />
                    </NIcon>
                  </template>
                  {{
                    t('playerTabs.summary.collectChampionMatches', {
                      champion: championName(c.championId)
                    })
                  }}
                </NButton>
              </div>
            </div>
          </NPopover>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AkariScorePopover } from '@renderer-shared/components/akari-score'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import {
  topsideTextColor,
  topsideTextTrigger
} from '@renderer-shared/components/ongoing-game-panel/widgets/player-info-card/jungle-pathing-info/preference'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { championIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import type { AggregatedChampionAnalysis } from '@shared/data-adapter/analysis/player'
import { ManageSearchFilled as ManageSearchFilledIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NButton, NIcon, NPopover } from 'naive-ui'
import { computed } from 'vue'

import {
  createInitParamCollectFilterState,
  createInitParamCollectSettings
} from '../data/match-history-init-param-collect'
import { useMatchHistory } from '../data/match-history'
import { useMatchHistoryFilters } from '../data/match-history-filters'
import { usePlayerTab } from '../context'
import { toPredicate } from './match-history-filters/filter-state'

const FREQUENT_USE_CHAMPION_THRESHOLD = 1

const { t } = useTranslation()
const lcs = useLeagueClientStore()
const ogs = useOngoingGameStore()

const { page, analysis: analysis, collectMatchHistory, isLoading } = useMatchHistory()
const { puuid, sgpServerId } = usePlayerTab()
const { setActiveMode, setAdvancedFilterState } = useMatchHistoryFilters()

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

const championName = (championId: number) => {
  return lcs.gameData.champions[championId]?.name || championId.toString()
}

const formatPercent = (value: number, digits = 0) => {
  return `${(value * 100).toFixed(digits)}%`
}

const formatAverageKdaLine = (champion: AggregatedChampionAnalysis) => {
  const count = Math.max(champion.winLoss.all.count, 1)
  const kills = champion.summary.kills / count
  const deaths = champion.summary.deaths / count
  const assists = champion.summary.assists / count

  return `${kills.toFixed(1)} / ${deaths.toFixed(1)} / ${assists.toFixed(1)}`
}

const getWinRateTextClass = (winRate: number) => {
  if (winRate >= 0.53) {
    return 'text-green-700 dark:text-green-300'
  }

  if (winRate <= 0.47) {
    return 'text-red-700 dark:text-red-400'
  }

  return 'text-gray-800 dark:text-gray-100'
}

const collectChampionMatches = (championId: number) => {
  const initParams = {
    collectByChampionId: championId,
    expectedCount: ogs.settings.matchHistoryLoadCount
  }
  const filterState = createInitParamCollectFilterState(initParams, puuid.value)

  if (!filterState) {
    return
  }

  setActiveMode('advanced')
  setAdvancedFilterState(filterState)

  void collectMatchHistory({
    ...createInitParamCollectSettings(initParams),
    predicate: toPredicate(filterState),
    queryParams: {
      __sgpServerId: sgpServerId.value
    }
  })
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
