<template>
  <NPopover :keep-alive-on-hover="true" :delay="50">
    <template #trigger>
      <div
        class="mb-1 flex cursor-pointer items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 transition-[filter] hover:brightness-110 dark:border-emerald-400/20 dark:bg-emerald-400/10"
      >
        <!-- mini map -->
        <div class="relative flex-shrink-0" :style="{ width: `${MINI_SIZE}px`, height: `${MINI_SIZE}px` }">
          <img class="absolute h-full w-full rounded" :src="map11" />
          <svg class="absolute h-full w-full" viewBox="0 0 100 100">
            <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="3,2" />
          </svg>
          <div
            v-for="(pt, i) of miniMapPoints.slice(0, 20)"
            :key="i"
            class="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2"
            :style="{ left: `${pt.left}px`, top: `${pt.top}px` }"
          >
            <span class="absolute left-1/2 top-1/2 h-0.5 w-2 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-sm" :class="laneColors[pt.lane]" />
            <span class="absolute left-1/2 top-1/2 h-0.5 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm" :class="laneColors[pt.lane]" />
          </div>
        </div>

        <!-- text stats -->
        <div class="flex min-w-0 flex-1 flex-col gap-0.5 text-[11px]">
          <div class="flex items-center gap-1">
            <span class="font-bold text-emerald-700 dark:text-emerald-300">{{ t('JunglePathing.title') }}</span>
            <span v-if="analysis.currentChampion" class="text-[10px] text-amber-600 dark:text-amber-400">{{ t('JunglePathing.currentChampion') }}</span>
            <span class="text-[10px] text-black/50 dark:text-white/50">{{ t('JunglePathing.gamesAnalyzed', { count: displayStats.gamesAnalyzed }) }}</span>
          </div>
          <div class="flex gap-1 text-black/80 dark:text-white/80">
            <span class="whitespace-nowrap" :class="topsideTextColor(displayStats)">{{ topsideTextShort(displayStats) }}</span>
            <span class="text-black/40 dark:text-white/40">|</span>
            <span class="whitespace-nowrap">
              <span class="text-red-400">{{ t('JunglePathing.topShort') }}</span>{{ formatWeightSum(displayStats.topZoneWeightSum) }}
              <span class="text-yellow-400">{{ t('JunglePathing.midShort') }}</span>{{ formatWeightSum(displayStats.midZoneWeightSum) }}
              <span class="text-blue-400">{{ t('JunglePathing.botShort') }}</span>{{ formatWeightSum(displayStats.botZoneWeightSum) }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- popover detail -->
    <div class="flex flex-col gap-2">
      <!-- tab switch + copy -->
      <div class="flex items-center gap-2" :class="analysis.currentChampion ? 'justify-between' : 'justify-end'">
        <div v-if="analysis.currentChampion" class="flex gap-1 text-xs">
          <button
            v-for="tab of tabs"
            :key="tab.key"
            class="cursor-pointer rounded px-2 py-0.5 transition-colors"
            :class="activeTab === tab.key
              ? 'bg-emerald-500/20 font-bold text-emerald-700 dark:text-emerald-300'
              : 'text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5'"
            @click="activeTab = tab.key"
          >
            {{ tab.label }} ({{ tab.stats.gamesAnalyzed }})
          </button>
        </div>
        <button
          class="flex-shrink-0 cursor-pointer rounded px-2 py-1 text-[11px] text-black/60 transition-colors hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5"
          @click="handleCopyAll"
        >
          <NIcon class="mr-0.5 align-middle" :component="CopyIcon" />
          {{ t('JunglePathing.copyAll') }}
        </button>
      </div>

      <div class="flex gap-3">
        <!-- larger map -->
        <div class="flex flex-shrink-0 flex-col gap-1">
          <div class="relative" :style="{ width: `${LARGE_SIZE}px`, height: `${LARGE_SIZE}px` }">
            <img class="absolute h-full w-full rounded" :src="map11" />
            <svg class="absolute h-full w-full" viewBox="0 0 100 100">
              <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(255,255,255,0.4)" stroke-width="0.8" stroke-dasharray="4,3" />
            </svg>
            <svg class="absolute h-full w-full" viewBox="0 0 100 100">
              <polygon
                v-if="popoverOverlay.points"
                :points="popoverOverlay.points"
                :fill="popoverOverlay.fill"
              />
            </svg>
            <div
              v-for="(pt, i) of largeMinuteMapPoints"
              :key="`m-${i}`"
              class="absolute z-[2] h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60"
              :class="minuteDotColors[pt.lane]"
              :style="{ left: `${pt.left}px`, top: `${pt.top}px` }"
            />
            <div
              v-for="(pt, i) of largeMapPoints"
              :key="i"
              class="absolute z-[4] h-4 w-4 -translate-x-1/2 -translate-y-1/2"
              :style="{ left: `${pt.left}px`, top: `${pt.top}px` }"
            >
              <span class="absolute left-1/2 top-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-sm" :class="laneColors[pt.lane]" />
              <span class="absolute left-1/2 top-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm" :class="laneColors[pt.lane]" />
            </div>
          </div>
          <div class="flex flex-col gap-1 pl-0.5 text-[10px] text-black/55 dark:text-white/55">
            <span class="inline-flex items-center gap-1 whitespace-nowrap">
              <span class="grid w-[30px] grid-cols-3 place-items-center">
                <svg class="h-2 w-2 text-red-400" viewBox="0 0 8 8" aria-hidden="true">
                  <circle cx="4" cy="4" r="1.6" fill="currentColor" />
                </svg>
                <svg class="h-2 w-2 text-yellow-400" viewBox="0 0 8 8" aria-hidden="true">
                  <circle cx="4" cy="4" r="1.6" fill="currentColor" />
                </svg>
                <svg class="h-2 w-2 text-blue-400" viewBox="0 0 8 8" aria-hidden="true">
                  <circle cx="4" cy="4" r="1.6" fill="currentColor" />
                </svg>
              </span>
              {{ t('JunglePathing.minuteLegend') }}
            </span>
            <span class="inline-flex items-center gap-1 whitespace-nowrap">
              <span class="grid w-[30px] grid-cols-3 place-items-center">
                <svg class="h-2 w-2 text-red-400" viewBox="0 0 8 8" aria-hidden="true">
                  <line x1="2" y1="2" x2="6" y2="6" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
                  <line x1="2" y1="6" x2="6" y2="2" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
                </svg>
                <svg class="h-2 w-2 text-yellow-400" viewBox="0 0 8 8" aria-hidden="true">
                  <line x1="2" y1="2" x2="6" y2="6" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
                  <line x1="2" y1="6" x2="6" y2="2" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
                </svg>
                <svg class="h-2 w-2 text-blue-400" viewBox="0 0 8 8" aria-hidden="true">
                  <line x1="2" y1="2" x2="6" y2="6" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
                  <line x1="2" y1="6" x2="6" y2="2" stroke="currentColor" stroke-width="1" stroke-linecap="round" />
                </svg>
              </span>
              {{ t('JunglePathing.gankLegend') }}
            </span>
          </div>
        </div>

        <!-- detail stats -->
        <div class="flex flex-col justify-center gap-2 text-xs">
          <div>
            <div class="mb-1 font-bold text-black/90 dark:text-white/90">{{ t('JunglePathing.mapPref') }}</div>
            <div class="mt-0.5 whitespace-nowrap text-[11px] text-black/75 dark:text-white/75">
              <span class="text-red-400">{{ t('JunglePathing.top') }}</span>{{ formatWeightSum(popoverStats.topZoneWeightSum) }}
              <span class="text-yellow-400">{{ t('JunglePathing.mid') }}</span>{{ formatWeightSum(popoverStats.midZoneWeightSum) }}
              <span class="text-blue-400">{{ t('JunglePathing.bot') }}</span>{{ formatWeightSum(popoverStats.botZoneWeightSum) }}
              <span class="mx-1 text-black/40 dark:text-white/40">|</span>
              <span :class="topsideTextColor(popoverStats)">{{ topsideTextWithPct(popoverStats) }}</span>
            </div>
          </div>
          <div>
            <div class="mb-1 font-bold text-black/90 dark:text-white/90">{{ t('JunglePathing.firstClear') }}</div>
            <div v-if="popoverStats.blueTeamGames > 0" class="flex items-center gap-1">
              <span class="text-[#40c1ff]">{{ t('JunglePathing.blueTeam') }}</span>
              <span>{{ firstClearTextForTeam(popoverStats, 100) }}</span>
            </div>
            <div v-if="popoverStats.redTeamGames > 0" class="flex items-center gap-1">
              <span class="text-[#ff3333]">{{ t('JunglePathing.redTeam') }}</span>
              <span>{{ firstClearTextForTeam(popoverStats, 200) }}</span>
            </div>
            <div v-if="popoverStats.blueTeamGames === 0 && popoverStats.redTeamGames === 0" class="text-black/50 dark:text-white/50">—</div>
          </div>
          <div>
            <div class="mb-1 font-bold text-black/90 dark:text-white/90">{{ t('JunglePathing.objectives') }}</div>
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-0.5"><DragonIcon class="size-3.5" />{{ t('JunglePathing.firstDragonRate', { pct: Math.round(popoverStats.objectives.firstDragonRate * 100) }) }}</div>
              <div class="grid grid-cols-2 gap-x-3 gap-y-1">
                <div class="inline-flex min-w-0 items-center justify-between gap-1">
                  <span class="inline-flex items-center gap-0.5">
                    <DragonIcon class="size-3.5" />{{ t('JunglePathing.avgDragons', { count: roundToTenth(popoverStats.objectives.avgDragons) }) }}
                  </span>
                  <span v-if="popoverStats.objectives.avgFirstDragonTime !== null" class="flex-shrink-0 text-black/50 dark:text-white/50">
                    {{ t('JunglePathing.firstTime', { time: formatTime(popoverStats.objectives.avgFirstDragonTime) }) }}
                  </span>
                </div>
                <div class="inline-flex min-w-0 items-center justify-between gap-1">
                  <span class="inline-flex items-center gap-0.5">
                    <RiftHeraldIcon class="size-3.5" />{{ t('JunglePathing.avgHeralds', { count: roundToTenth(popoverStats.objectives.avgHeralds) }) }}
                  </span>
                  <span v-if="popoverStats.objectives.avgFirstHeraldTime !== null" class="flex-shrink-0 text-black/50 dark:text-white/50">
                    {{ t('JunglePathing.firstTime', { time: formatTime(popoverStats.objectives.avgFirstHeraldTime) }) }}
                  </span>
                </div>
                <div class="inline-flex min-w-0 items-center justify-between gap-1">
                  <span class="inline-flex items-center gap-0.5">
                    <VoidGrubIcon class="size-3.5" />{{ t('JunglePathing.avgVoidgrubs', { count: roundToTenth(popoverStats.objectives.avgVoidgrubs) }) }}
                  </span>
                  <span v-if="popoverStats.objectives.avgFirstVoidgrubTime !== null" class="flex-shrink-0 text-black/50 dark:text-white/50">
                    {{ t('JunglePathing.firstTime', { time: formatTime(popoverStats.objectives.avgFirstVoidgrubTime) }) }}
                  </span>
                </div>
                <div class="inline-flex min-w-0 items-center justify-between gap-1">
                  <span class="inline-flex items-center gap-0.5">
                    <BaronIcon class="size-3.5" />{{ t('JunglePathing.avgBarons', { count: roundToTenth(popoverStats.objectives.avgBarons) }) }}
                  </span>
                  <span v-if="popoverStats.objectives.avgFirstBaronTime !== null" class="flex-shrink-0 text-black/50 dark:text-white/50">
                    {{ t('JunglePathing.firstTime', { time: formatTime(popoverStats.objectives.avgFirstBaronTime) }) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="max-w-[360px] text-[11px] leading-relaxed text-black/40 dark:text-white/40">
            {{ t('JunglePathing.description') }}
          </div>
        </div>
      </div>
    </div>
  </NPopover>
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { JunglePathingAnalysis, JunglePathingStats } from '@shared/data-adapter/analysis/jungle'
import { Copy as CopyIcon } from '@vicons/tabler'
import { useTranslation } from 'i18next-vue'
import { NIcon, NPopover, useMessage } from 'naive-ui'
import { computed, ref } from 'vue'

import BaronIcon from '@renderer-shared/components/match-card/icons/Baron.vue'
import DragonIcon from '@renderer-shared/components/match-card/icons/Dragon.vue'
import RiftHeraldIcon from '@renderer-shared/components/match-card/icons/RiftHerald.vue'
import VoidGrubIcon from '@renderer-shared/components/match-card/icons/VoidGrub.vue'
import map11 from '@renderer-shared/components/match-card/map-images/11.png'
import { mapToImagePosition } from '@renderer-shared/components/match-card/utils/game-map'

const { analysis } = defineProps<{
  analysis: JunglePathingAnalysis
}>()

const { t } = useTranslation()
const ogs = useOngoingGameStore()
const lcs = useLeagueClientStore()
const message = useMessage()

const MINI_SIZE = 48
const LARGE_SIZE = 140

const laneColors: Record<string, string> = {
  top: 'bg-red-400',
  mid: 'bg-yellow-400',
  bot: 'bg-blue-400'
}

const minuteDotColors: Record<string, string> = {
  top: 'bg-red-400/80',
  mid: 'bg-yellow-400/80',
  bot: 'bg-blue-400/80'
}

/** 卡片上优先显示当前英雄数据，fallback 到总体 */
const displayStats = computed<JunglePathingStats>(() => {
  return analysis.currentChampion ?? analysis.overall
})

const activeTab = ref<'currentChampion' | 'overall'>('currentChampion')

const tabs = computed(() => {
  const items: { key: 'currentChampion' | 'overall'; label: string; stats: JunglePathingStats }[] = []
  if (analysis.currentChampion) {
    items.push({
      key: 'currentChampion',
      label: t('JunglePathing.currentChampion'),
      stats: analysis.currentChampion
    })
  }
  items.push({
    key: 'overall',
    label: t('JunglePathing.overall'),
    stats: analysis.overall
  })
  return items
})

/** popover 中显示当前 tab 对应的数据 */
const popoverStats = computed<JunglePathingStats>(() => {
  if (activeTab.value === 'currentChampion' && analysis.currentChampion) {
    return analysis.currentChampion
  }
  return analysis.overall
})

const miniMapPoints = computed(() => {
  return displayStats.value.gankPositions.map((pt) => ({
    ...mapToImagePosition(pt.x, pt.y, MINI_SIZE, MINI_SIZE, 11),
    lane: pt.lane
  }))
})

const largeMapPoints = computed(() => {
  return popoverStats.value.gankPositions.map((pt) => ({
    ...mapToImagePosition(pt.x, pt.y, LARGE_SIZE, LARGE_SIZE, 11),
    lane: pt.lane
  }))
})

const largeMinuteMapPoints = computed(() => {
  return popoverStats.value.minutePositions.map((pt) => ({
    ...mapToImagePosition(pt.x, pt.y, LARGE_SIZE, LARGE_SIZE, 11),
    lane: pt.lane
  }))
})

type MapPreferenceKind = 'top' | 'mid' | 'bot' | 'topMid' | 'midBot' | 'balanced'

interface MapPreference {
  kind: MapPreferenceKind
  pct: number | null
}

function resolveMapPreference(stats: JunglePathingStats): MapPreference {
  const topShare = stats.avgTopZonePercentage
  const midShare = stats.avgMidZonePercentage
  const botShare = stats.avgBotZonePercentage
  const topMidShare = topShare + midShare
  const midBotShare = midShare + botShare

  if (midBotShare >= 0.7 && topShare <= 0.28) {
    return { kind: 'midBot', pct: Math.round(midBotShare * 100) }
  }
  if (topMidShare >= 0.7 && botShare <= 0.28) {
    return { kind: 'topMid', pct: Math.round(topMidShare * 100) }
  }

  const ranked = [
    { kind: 'top' as const, share: topShare },
    { kind: 'mid' as const, share: midShare },
    { kind: 'bot' as const, share: botShare }
  ].sort((a, b) => b.share - a.share)

  if (ranked[0].share >= 0.4 && ranked[0].share - ranked[1].share >= 0.08) {
    return { kind: ranked[0].kind, pct: Math.round(ranked[0].share * 100) }
  }

  return { kind: 'balanced', pct: null }
}

function mapPreferenceText(pref: MapPreference, short = false): string {
  switch (pref.kind) {
    case 'top':
      return t('JunglePathing.topsidePref')
    case 'mid':
      return t('JunglePathing.midPref')
    case 'bot':
      return t('JunglePathing.botsidePref')
    case 'topMid':
      return t('JunglePathing.topMidPref')
    case 'midBot':
      return t('JunglePathing.midBotPref')
    default:
      return short ? t('JunglePathing.balancedShort') : t('JunglePathing.balanced')
  }
}

function mapPreferenceColor(pref: MapPreference): string {
  switch (pref.kind) {
    case 'top':
    case 'topMid':
      return 'text-emerald-600 dark:text-emerald-400'
    case 'mid':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'bot':
    case 'midBot':
      return 'text-blue-600 dark:text-blue-400'
    default:
      return 'text-black/70 dark:text-white/70'
  }
}

function mapPreferenceOverlay(pref: MapPreference): { points: string | null; fill: string } {
  switch (pref.kind) {
    case 'top':
    case 'topMid':
      return { points: '0,100 0,0 100,0', fill: 'rgba(52,211,153,0.15)' }
    case 'mid':
      return { points: '50,10 90,50 50,90 10,50', fill: 'rgba(250,204,21,0.14)' }
    case 'bot':
    case 'midBot':
      return { points: '0,100 100,100 100,0', fill: 'rgba(96,165,250,0.15)' }
    default:
      return { points: null, fill: 'transparent' }
  }
}

function topsideTextShort(stats: JunglePathingStats) {
  return mapPreferenceText(resolveMapPreference(stats), true)
}

function topsideTextWithPct(stats: JunglePathingStats) {
  const pref = resolveMapPreference(stats)
  const base = mapPreferenceText(pref)
  if (pref.pct === null) return base
  return `${base} ${pref.pct}%`
}

function topsideTextColor(stats: JunglePathingStats) {
  return mapPreferenceColor(resolveMapPreference(stats))
}

function formatWeightSum(value: number): string {
  return Math.round(value).toString()
}

function zoneWeightText(stats: JunglePathingStats) {
  return `${t('JunglePathing.top')}${formatWeightSum(stats.topZoneWeightSum)} ${t('JunglePathing.mid')}${formatWeightSum(stats.midZoneWeightSum)} ${t('JunglePathing.bot')}${formatWeightSum(stats.botZoneWeightSum)}`
}

const popoverOverlay = computed(() => {
  return mapPreferenceOverlay(resolveMapPreference(popoverStats.value))
})

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function firstClearTextForTeam(stats: JunglePathingStats, teamId: number) {
  const isBlue = teamId === 100
  const games = isBlue ? stats.blueTeamGames : stats.redTeamGames
  const topsideStarts = isBlue ? stats.blueTeamTopsideStartCount : stats.redTeamTopsideStartCount
  if (games === 0) return '—'
  const topsidePct = Math.round((topsideStarts / games) * 100)
  const topsideBuff = isBlue ? t('JunglePathing.blueBuff') : t('JunglePathing.redBuff')
  const botsideBuff = isBlue ? t('JunglePathing.redBuff') : t('JunglePathing.blueBuff')
  if (topsidePct >= 55) {
    return t('JunglePathing.topsideStart', { pct: topsidePct }) + `(${topsideBuff})`
  }
  if (topsidePct <= 45) {
    return t('JunglePathing.botsideStart', { pct: 100 - topsidePct }) + `(${botsideBuff})`
  }
  return t('JunglePathing.balanced')
}

function formatStatsText(stats: JunglePathingStats, label: string): string {
  const mapPref = topsideTextWithPct(stats)
  const weights = zoneWeightText(stats)

  const fcLines: string[] = []
  if (stats.blueTeamGames > 0) {
    fcLines.push(`  ${t('JunglePathing.blueTeam')}: ${firstClearTextForTeam(stats, 100)}`)
  }
  if (stats.redTeamGames > 0) {
    fcLines.push(`  ${t('JunglePathing.redTeam')}: ${firstClearTextForTeam(stats, 200)}`)
  }

  const obj = stats.objectives
  const objParts: string[] = []
  objParts.push(t('JunglePathing.firstDragonRate', { pct: Math.round(obj.firstDragonRate * 100) }))
  objParts.push(t('JunglePathing.avgDragons', { count: roundToTenth(obj.avgDragons) }) + (obj.avgFirstDragonTime !== null ? ` (${t('JunglePathing.firstTime', { time: formatTime(obj.avgFirstDragonTime) })})` : ''))
  objParts.push(t('JunglePathing.avgVoidgrubs', { count: roundToTenth(obj.avgVoidgrubs) }) + (obj.avgFirstVoidgrubTime !== null ? ` (${t('JunglePathing.firstTime', { time: formatTime(obj.avgFirstVoidgrubTime) })})` : ''))
  objParts.push(t('JunglePathing.avgHeralds', { count: roundToTenth(obj.avgHeralds) }) + (obj.avgFirstHeraldTime !== null ? ` (${t('JunglePathing.firstTime', { time: formatTime(obj.avgFirstHeraldTime) })})` : ''))
  objParts.push(t('JunglePathing.avgBarons', { count: roundToTenth(obj.avgBarons) }) + (obj.avgFirstBaronTime !== null ? ` (${t('JunglePathing.firstTime', { time: formatTime(obj.avgFirstBaronTime) })})` : ''))

  let text = `[${label}] ${stats.gamesAnalyzed}${t('JunglePathing.gamesUnit')}\n`
  text += `  ${t('JunglePathing.mapPref')}: ${mapPref} | ${weights}\n`
  if (fcLines.length > 0) {
    text += `  ${t('JunglePathing.firstClear')}:\n${fcLines.join('\n')}\n`
  }
  text += `  ${t('JunglePathing.objectives')}: ${objParts.join(', ')}`
  return text
}

function formatPlayerText(puuid: string, a: JunglePathingAnalysis): string {
  const summoner = ogs.summoner[puuid]
  const name = summoner
    ? `${summoner.gameName}#${summoner.tagLine}`
    : puuid.substring(0, 8)

  const champName = a.currentChampionId ? lcs.gameData.championName(a.currentChampionId) : ''

  const lines: string[] = []
  if (a.currentChampion) {
    const label = champName
      ? `${t('JunglePathing.currentChampion')} ${champName}`
      : t('JunglePathing.currentChampion')
    lines.push(formatStatsText(a.currentChampion, label))
  }
  lines.push(formatStatsText(a.overall, t('JunglePathing.overall')))

  return `${name}\n${lines.join('\n')}`
}

function handleCopyAll() {
  const myPuuid = lcs.summoner.me?.puuid
  if (!myPuuid) return

  // 找到自己所在的队伍
  let myTeam: string | null = null
  for (const [team, players] of Object.entries(ogs.teams)) {
    if (players.includes(myPuuid)) {
      myTeam = team
      break
    }
  }

  const allyJunglers: string[] = []
  const enemyJunglers: string[] = []

  for (const puuid of Object.keys(ogs.jungleAnalysis)) {
    let playerTeam: string | null = null
    for (const [team, players] of Object.entries(ogs.teams)) {
      if (players.includes(puuid)) {
        playerTeam = team
        break
      }
    }

    if (playerTeam === myTeam) {
      allyJunglers.push(puuid)
    } else {
      enemyJunglers.push(puuid)
    }
  }

  const sections: string[] = []

  if (allyJunglers.length > 0) {
    sections.push(`== ${t('JunglePathing.allyJungler')} ==`)
    for (const puuid of allyJunglers) {
      sections.push(formatPlayerText(puuid, ogs.jungleAnalysis[puuid]))
    }
  }

  if (enemyJunglers.length > 0) {
    sections.push(`== ${t('JunglePathing.enemyJungler')} ==`)
    for (const puuid of enemyJunglers) {
      sections.push(formatPlayerText(puuid, ogs.jungleAnalysis[puuid]))
    }
  }

  if (sections.length === 0) return

  const text = sections.join('\n\n')
  navigator.clipboard.writeText(text).then(() => {
    message.success(t('JunglePathing.copied'))
  })
}
</script>
