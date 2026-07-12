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
              <span class="cursor-default tabular-nums">
                {{ analysis.akariScore.total.toFixed(2) }}
              </span>
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
            <ChampionAnalysisContent
              :analysis="c"
              :mastery="championMasteryById[c.championId]"
              :collecting="isLoading"
              :on-collect-matches="() => collectChampionMatches(c.championId)"
            />
          </NPopover>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AkariScorePopover } from '@renderer-shared/components/akari-score'
import { ChampionAnalysisContent } from '@renderer-shared/components/champion-analysis'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import { championIconUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

import {
  createInitParamCollectFilterState,
  createInitParamCollectSettings
} from '../data/match-history-init-param-collect'
import { useChampionMastery } from '../data/champion-mastery'
import { useMatchHistory } from '../data/match-history'
import { useMatchHistoryFilters } from '../data/match-history-filters'
import { usePlayerTab } from '../context'
import { toPredicate } from './match-history-filters/filter-state'

const FREQUENT_USE_CHAMPION_THRESHOLD = 1

const { t } = useTranslation()
const ogs = useOngoingGameStore()

const { page, analysis: analysis, collectMatchHistory, isLoading } = useMatchHistory()
const { championMastery } = useChampionMastery()
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

const championMasteryById = computed(() =>
  Object.fromEntries(
    (championMastery.value?.masteries ?? []).map((mastery) => [mastery.championId, mastery])
  )
)
</script>
