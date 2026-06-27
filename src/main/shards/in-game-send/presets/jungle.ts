import type { AggregatedJungleAnalysis } from '@shared/data-adapter/analysis/player'
import type {
  AggregatedChampionAnalysis,
  AggregatedJungleFirstClearCamp
} from '@shared/data-adapter/analysis/player/types/aggregated'
import type {
  InGameSendJunglePresetOptions,
  InGameSendPresetTarget
} from '@shared/shards/in-game-send'
import { getInGameSendJunglePresetShortcutTargetId } from '@shared/shards/in-game-send'

import type { InGameSendMainContext } from '../context'
import { createPresetTeams, formatRate, selectedPlayersByPuuids } from './helpers'
import {
  countSelectedChampionIds,
  playerDisplayName,
  playerDisplayNameUsesChampionName
} from './name-display'
import type { InGameSendPresetContext, InGameSendPresetPlayer } from './types'

const MAX_MAIN_CHAMPION_COUNT = 3
const MIN_MAIN_CHAMPION_MATCH_COUNT = 2
const MAIN_USAGE_DROP_RATIO = 1.5

type FirstClearTeamSide = 'blue' | 'red'
type FirstClearKind = 'normal' | 'invade'

export type InGameSendJunglePresetLineOptions = Omit<
  InGameSendJunglePresetOptions,
  'targetShortcuts'
> & {
  selectedPuuids: string[]
}

export const getJunglePresetShortcutTargetId = getInGameSendJunglePresetShortcutTargetId

interface JungleStatsSource {
  championName: string | null
  jungle: AggregatedJungleAnalysis | null
  isChampionStats: boolean
}

interface FirstClearPattern {
  side: FirstClearTeamSide
  kind: FirstClearKind
  rate: number | null
  distribution: string[]
}

export function createJunglePresetLineOptions(
  mainContext: InGameSendMainContext
): InGameSendJunglePresetLineOptions {
  const options = mainContext.settings.junglePresetOptions

  return {
    selectedPuuids: mainContext.state.junglePuuids,
    activityPreference: options.activityPreference,
    firstClearDistribution: options.firstClearDistribution,
    earlyGank: options.earlyGank,
    dragonControl: options.dragonControl,
    monsterControl: options.monsterControl,
    mainChampions: options.mainChampions,
    nameDisplayStrategy: options.nameDisplayStrategy,
    showCurrentChampion: options.showCurrentChampion
  }
}

function sumRecord(record: Record<string, number>) {
  return Object.values(record).reduce((sum, count) => sum + count, 0)
}

function formatFixedNumber(value: number, digits: number) {
  return value.toFixed(digits)
}

function formatFirstDragonTimeText(seconds: number | null) {
  if (seconds === null) {
    return ''
  }

  const totalSeconds = Math.round(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = (totalSeconds % 60).toString().padStart(2, '0')

  return `，首龙均时${minutes}:${remainingSeconds}`
}

function formatCampName(camp: string) {
  switch (camp) {
    case 'blue':
      return '蓝Buff'
    case 'red':
      return '红Buff'
    case 'wolves':
      return '三狼'
    case 'raptors':
      return '锋喙鸟'
    default:
      return camp
  }
}

function championName(context: InGameSendPresetContext, championId: number) {
  return context.mainContext.leagueClient.data.gameData.championName(championId)
}

function currentChampionName(context: InGameSendPresetContext, player: InGameSendPresetPlayer) {
  if (player.championId <= 0) {
    return null
  }

  return championName(context, player.championId)
}

function lanePreference(jungle: AggregatedJungleAnalysis) {
  const lanes = [
    {
      label: '上',
      rate: jungle.avgTopZonePercentage
    },
    {
      label: '中',
      rate: jungle.avgMidZonePercentage
    },
    {
      label: '下',
      rate: jungle.avgBotZonePercentage
    }
  ].toSorted((a, b) => b.rate - a.rate)

  const [first, second] = lanes

  if (first.rate === 0) {
    return '分布不明显'
  }

  if (second.rate >= first.rate * 0.65) {
    return `偏${first.label}${second.label}`
  }

  return `偏${first.label}`
}

function selectMainItems<T extends { count: number }>(candidates: T[], maxCount: number) {
  if (candidates.length <= maxCount) {
    return candidates
  }

  for (let i = Math.min(maxCount, candidates.length - 1) - 1; i >= 0; i--) {
    const current = candidates[i]
    const next = candidates[i + 1]

    if (current.count >= next.count * MAIN_USAGE_DROP_RATIO) {
      return candidates.slice(0, i + 1)
    }
  }

  return []
}

function championJungleSampleCount(champion: AggregatedChampionAnalysis) {
  return champion.jungle?.gamesAnalyzed ?? 0
}

function mainJungleChampionNames(context: InGameSendPresetContext, player: InGameSendPresetPlayer) {
  if (!player.analysis) {
    return []
  }

  const candidates = Object.values(player.analysis.champions)
    .map((champion) => ({
      championId: champion.championId,
      count: championJungleSampleCount(champion)
    }))
    .filter((champion) => {
      return champion.championId > 0 && champion.count >= MIN_MAIN_CHAMPION_MATCH_COUNT
    })
    .toSorted((a, b) => {
      if (a.count !== b.count) {
        return b.count - a.count
      }

      return a.championId - b.championId
    })

  return selectMainItems(candidates, MAX_MAIN_CHAMPION_COUNT).map((champion) =>
    championName(context, champion.championId)
  )
}

function resolveJungleStatsSource(
  context: InGameSendPresetContext,
  options: InGameSendJunglePresetLineOptions,
  player: InGameSendPresetPlayer
): JungleStatsSource | null {
  if (!options.showCurrentChampion) {
    return {
      championName: null,
      jungle: player.analysis?.jungle ?? null,
      isChampionStats: false
    }
  }

  const championName = currentChampionName(context, player)
  if (championName === null) {
    return null
  }

  return {
    championName,
    jungle: player.analysis?.champions[player.championId]?.jungle ?? null,
    isChampionStats: true
  }
}

function firstClearTeamSideGames(
  firstClearCamp: AggregatedJungleFirstClearCamp,
  side: FirstClearTeamSide
) {
  return side === 'blue' ? firstClearCamp.blueGames : firstClearCamp.redGames
}

function firstClearKindLabel(kind: FirstClearKind) {
  return kind === 'normal' ? '常规开' : '入侵开'
}

function firstClearTeamSideLabel(side: FirstClearTeamSide) {
  return side === 'blue' ? '蓝方' : '红方'
}

function createFirstClearPattern(
  firstClearCamp: AggregatedJungleFirstClearCamp,
  side: FirstClearTeamSide,
  kind: FirstClearKind
): FirstClearPattern {
  const sideGames = firstClearTeamSideGames(firstClearCamp, side)
  const record =
    side === 'blue'
      ? kind === 'normal'
        ? firstClearCamp.blue
        : firstClearCamp.blueInvade
      : kind === 'normal'
        ? firstClearCamp.red
        : firstClearCamp.redInvade
  const count = sumRecord(record)

  return {
    side,
    kind,
    rate: sideGames > 0 ? count / sideGames : null,
    distribution:
      count > 0
        ? Object.entries(record)
            .filter(([, campCount]) => campCount > 0)
            .toSorted(([, countA], [, countB]) => countB - countA)
            .map(([camp, campCount]) => `${formatCampName(camp)}${formatRate(campCount / count)}`)
        : []
  }
}

function formatFirstClearPattern(pattern: FirstClearPattern) {
  const rate = pattern.rate === null ? '-' : formatRate(pattern.rate)
  const distribution = pattern.rate !== null && pattern.rate > 0 ? pattern.distribution : []
  const distributionText = distribution.length ? `[${distribution.join('，')}]` : ''

  return `${firstClearTeamSideLabel(pattern.side)}${firstClearKindLabel(pattern.kind)}${rate}${distributionText}`
}

function formatActivityPreference(jungle: AggregatedJungleAnalysis) {
  return `前期${lanePreference(jungle)}，上${formatRate(jungle.avgTopZonePercentage)}中${formatRate(jungle.avgMidZonePercentage)}下${formatRate(jungle.avgBotZonePercentage)}`
}

function formatJungleNoRecordText(
  statsSource: JungleStatsSource,
  displayNameUsesChampionName: boolean
) {
  if (!statsSource.isChampionStats || !statsSource.championName) {
    return '没有打野明细记录'
  }

  const subject = displayNameUsesChampionName ? '本英雄' : statsSource.championName
  return `没有${subject}打野明细记录`
}

function formatJungleSamplePrefix(
  statsSource: JungleStatsSource,
  displayNameUsesChampionName: boolean
) {
  if (!statsSource.isChampionStats || !statsSource.championName) {
    return `打野样本${statsSource.jungle?.gamesAnalyzed ?? 0}场`
  }

  const subject = displayNameUsesChampionName ? '本英雄' : statsSource.championName
  return `${subject}打野样本${statsSource.jungle?.gamesAnalyzed ?? 0}场`
}

function buildGlobalJungleStats(
  context: InGameSendPresetContext,
  options: InGameSendJunglePresetLineOptions,
  player: InGameSendPresetPlayer,
  statsSource: JungleStatsSource
) {
  const jungle = statsSource.jungle
  if (!jungle) {
    return '没有打野明细记录'
  }

  const mainChampions = mainJungleChampionNames(context, player)
  const parts = [formatJungleSamplePrefix(statsSource, false)]

  if (options.activityPreference) {
    parts.push(formatActivityPreference(jungle))
  }

  if (options.earlyGank) {
    parts.push(
      `3级抓${formatRate(jungle.earlyGank.level3GankRate)}`,
      `4级抓${formatRate(jungle.earlyGank.level4GankRate)}`
    )
  }

  if (options.dragonControl) {
    parts.push(
      `一龙率${formatRate(jungle.objectives.firstDragonRate)}${formatFirstDragonTimeText(jungle.objectives.avgFirstDragonTime)}`,
      `场均小龙${formatFixedNumber(jungle.objectives.avgDragons, 1)}`
    )
  }

  if (options.monsterControl) {
    parts.push(
      `野怪资源巢虫${formatFixedNumber(jungle.objectives.avgVoidgrubs, 1)}/先锋${formatFixedNumber(jungle.objectives.avgHeralds, 1)}/大龙${formatFixedNumber(jungle.objectives.avgBarons, 1)}`
    )
  }

  if (options.mainChampions && mainChampions.length) {
    parts.push(`主玩英雄[${mainChampions.join('，')}]`)
  }

  return parts.join(' ')
}

function buildChampionJungleStats(
  options: InGameSendJunglePresetLineOptions,
  statsSource: JungleStatsSource,
  displayNameUsesChampionName: boolean
) {
  const jungle = statsSource.jungle
  if (!jungle) {
    return formatJungleNoRecordText(statsSource, displayNameUsesChampionName)
  }

  const parts = [formatJungleSamplePrefix(statsSource, displayNameUsesChampionName)]

  if (options.activityPreference) {
    parts.push(formatActivityPreference(jungle))
  }

  if (options.firstClearDistribution) {
    parts.push(
      formatFirstClearPattern(createFirstClearPattern(jungle.firstClearCamp, 'blue', 'normal')),
      formatFirstClearPattern(createFirstClearPattern(jungle.firstClearCamp, 'blue', 'invade')),
      formatFirstClearPattern(createFirstClearPattern(jungle.firstClearCamp, 'red', 'normal')),
      formatFirstClearPattern(createFirstClearPattern(jungle.firstClearCamp, 'red', 'invade'))
    )
  }

  if (options.earlyGank) {
    parts.push(
      `3级抓${formatRate(jungle.earlyGank.level3GankRate)}`,
      `4级抓${formatRate(jungle.earlyGank.level4GankRate)}`
    )
  }

  if (options.dragonControl) {
    parts.push(
      `一龙率${formatRate(jungle.objectives.firstDragonRate)}${formatFirstDragonTimeText(jungle.objectives.avgFirstDragonTime)}`,
      `场均小龙${formatFixedNumber(jungle.objectives.avgDragons, 1)}`
    )
  }

  if (options.monsterControl) {
    parts.push(
      `野怪资源巢虫${formatFixedNumber(jungle.objectives.avgVoidgrubs, 1)}/先锋${formatFixedNumber(jungle.objectives.avgHeralds, 1)}/大龙${formatFixedNumber(jungle.objectives.avgBarons, 1)}`
    )
  }

  return parts.join(' ')
}

function buildJungleStats(
  context: InGameSendPresetContext,
  options: InGameSendJunglePresetLineOptions,
  player: InGameSendPresetPlayer,
  displayNameUsesChampionName: boolean
) {
  if (options.showCurrentChampion && player.championId <= 0) {
    return '尚未选择英雄'
  }

  const statsSource = resolveJungleStatsSource(context, options, player)

  if (!statsSource) {
    return '尚未选择英雄'
  }

  if (!statsSource.isChampionStats) {
    return buildGlobalJungleStats(context, options, player, statsSource)
  }

  return buildChampionJungleStats(options, statsSource, displayNameUsesChampionName)
}

export function buildJunglePresetLines(
  context: InGameSendPresetContext,
  options: InGameSendJunglePresetLineOptions
) {
  const teams = createPresetTeams(context)
  const players = selectedPlayersByPuuids(context, options.selectedPuuids, teams).map(
    ({ player }) => player
  )
  const selectedChampionIdCounts = countSelectedChampionIds(players)

  return players.map((player) => {
    const displayNameUsesChampionName = playerDisplayNameUsesChampionName(
      player,
      options.nameDisplayStrategy,
      selectedChampionIdCounts
    )
    const name = playerDisplayName(
      context,
      player,
      options.nameDisplayStrategy,
      selectedChampionIdCounts
    )
    const stats = buildJungleStats(context, options, player, displayNameUsesChampionName)

    return `${name}：${stats}`
  })
}

export function buildJunglePresetLinesFromMainContext(
  mainContext: InGameSendMainContext,
  target: InGameSendPresetTarget
) {
  return buildJunglePresetLines(
    {
      target,
      mainContext
    },
    createJunglePresetLineOptions(mainContext)
  )
}
