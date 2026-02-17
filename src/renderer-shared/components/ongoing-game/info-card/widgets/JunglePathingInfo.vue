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
            class="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            :class="laneColors[pt.lane]"
            :style="{ left: `${pt.left}px`, top: `${pt.top}px` }"
          />
        </div>

        <!-- text stats -->
        <div class="flex min-w-0 flex-1 flex-col gap-0.5 text-[11px]">
          <div class="flex items-center gap-1">
            <span class="font-bold text-emerald-700 dark:text-emerald-300">{{ t('JunglePathing.title') }}</span>
            <span v-if="analysis.currentChampion" class="text-[10px] text-amber-600 dark:text-amber-400">{{ t('JunglePathing.currentChampion') }}</span>
            <span class="text-[10px] text-black/50 dark:text-white/50">{{ t('JunglePathing.gamesAnalyzed', { count: displayStats.gamesAnalyzed }) }}</span>
            <NIcon class="ml-auto text-[12px] text-black/30 dark:text-white/30" :component="InformationFilled" />
          </div>
          <div class="flex gap-2 text-black/80 dark:text-white/80">
            <span :class="topsideTextColor(displayStats)">{{ topsideText(displayStats) }}</span>
            <span class="text-black/40 dark:text-white/40">|</span>
            <span><span class="text-red-400">{{ t('JunglePathing.top') }}</span>{{ displayStats.totalTopGanks }} <span class="text-yellow-400">{{ t('JunglePathing.mid') }}</span>{{ displayStats.totalMidGanks }} <span class="text-blue-400">{{ t('JunglePathing.bot') }}</span>{{ displayStats.totalBotGanks }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- popover detail -->
    <div class="flex flex-col gap-2">
      <!-- tab switch -->
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

      <div class="flex gap-3">
        <!-- larger map -->
        <div class="relative flex-shrink-0" :style="{ width: `${LARGE_SIZE}px`, height: `${LARGE_SIZE}px` }">
          <img class="absolute h-full w-full rounded" :src="map11" />
          <svg class="absolute h-full w-full" viewBox="0 0 100 100">
            <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(255,255,255,0.4)" stroke-width="0.8" stroke-dasharray="4,3" />
          </svg>
          <svg class="absolute h-full w-full" viewBox="0 0 100 100">
            <polygon
              :points="popoverStats.avgTopsidePercentage >= 0.55 ? '0,100 0,0 100,0' : '0,100 100,100 100,0'"
              :fill="popoverStats.avgTopsidePercentage >= 0.55 ? 'rgba(52,211,153,0.15)' : 'rgba(96,165,250,0.15)'"
            />
          </svg>
          <div
            v-for="(pt, i) of largeMapPoints"
            :key="i"
            class="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50"
            :class="laneColors[pt.lane]"
            :style="{ left: `${pt.left}px`, top: `${pt.top}px` }"
          />
        </div>

        <!-- detail stats -->
        <div class="flex flex-col justify-center gap-2 text-xs">
          <div>
            <div class="mb-1 font-bold text-black/90 dark:text-white/90">{{ t('JunglePathing.mapPref') }}</div>
            <div :class="topsideTextColor(popoverStats)">{{ topsideText(popoverStats) }}</div>
          </div>
          <div>
            <div class="mb-1 font-bold text-black/90 dark:text-white/90">{{ t('JunglePathing.ganks') }}</div>
            <div class="flex gap-2">
              <span><span class="text-red-400">{{ t('JunglePathing.top') }}</span> {{ popoverStats.totalTopGanks }} ({{ popoverStats.avgTopGanks.toFixed(1) }})</span>
              <span><span class="text-yellow-400">{{ t('JunglePathing.mid') }}</span> {{ popoverStats.totalMidGanks }} ({{ popoverStats.avgMidGanks.toFixed(1) }})</span>
              <span><span class="text-blue-400">{{ t('JunglePathing.bot') }}</span> {{ popoverStats.totalBotGanks }} ({{ popoverStats.avgBotGanks.toFixed(1) }})</span>
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
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="max-w-[320px] flex-1 text-[11px] leading-relaxed text-black/40 dark:text-white/40">
          {{ t('JunglePathing.description') }}
        </div>
        <button
          class="flex-shrink-0 cursor-pointer rounded px-2 py-1 text-[11px] text-black/60 transition-colors hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5"
          @click="handleCopyAll"
        >
          <NIcon class="mr-0.5 align-middle" :component="CopyIcon" />
          {{ t('JunglePathing.copyAll') }}
        </button>
      </div>
    </div>
  </NPopover>
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { JunglePathingAnalysis, JunglePathingStats } from '@shared/data-adapter/analysis/jungle'
import { InformationFilled } from '@vicons/carbon'
import { Copy as CopyIcon } from '@vicons/tabler'
import { useTranslation } from 'i18next-vue'
import { NIcon, NPopover, useMessage } from 'naive-ui'
import { computed, ref } from 'vue'

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

function topsideText(stats: JunglePathingStats) {
  const pct = Math.round(stats.avgTopsidePercentage * 100)
  const botPct = 100 - pct
  if (pct >= 55) return t('JunglePathing.topsidePref', { pct })
  if (botPct >= 55) return t('JunglePathing.botsidePref', { pct: botPct })
  return t('JunglePathing.balanced')
}

function topsideTextColor(stats: JunglePathingStats) {
  const pct = Math.round(stats.avgTopsidePercentage * 100)
  if (pct >= 55) return 'text-emerald-600 dark:text-emerald-400'
  if (pct <= 45) return 'text-blue-600 dark:text-blue-400'
  return 'text-black/70 dark:text-white/70'
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
  const mapPref = topsideText(stats)
  const ganks = `${t('JunglePathing.top')}${stats.totalTopGanks}(${stats.avgTopGanks.toFixed(1)}) ${t('JunglePathing.mid')}${stats.totalMidGanks}(${stats.avgMidGanks.toFixed(1)}) ${t('JunglePathing.bot')}${stats.totalBotGanks}(${stats.avgBotGanks.toFixed(1)})`

  const fcLines: string[] = []
  if (stats.blueTeamGames > 0) {
    fcLines.push(`  ${t('JunglePathing.blueTeam')}: ${firstClearTextForTeam(stats, 100)}`)
  }
  if (stats.redTeamGames > 0) {
    fcLines.push(`  ${t('JunglePathing.redTeam')}: ${firstClearTextForTeam(stats, 200)}`)
  }

  let text = `[${label}] ${stats.gamesAnalyzed}${t('JunglePathing.gamesUnit')}\n`
  text += `  ${t('JunglePathing.mapPref')}: ${mapPref}\n`
  text += `  ${t('JunglePathing.ganks')}: ${ganks}\n`
  if (fcLines.length > 0) {
    text += `  ${t('JunglePathing.firstClear')}:\n${fcLines.join('\n')}`
  }
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
