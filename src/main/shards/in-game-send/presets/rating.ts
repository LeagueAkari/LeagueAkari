import type {
  AggregatedSummaryAnalysis,
  AggregatedWinLossAnalysisMap
} from '@shared/data-adapter/analysis/player'
import type { AggregatedPositionAnalysis } from '@shared/data-adapter/analysis/player/aggregate/positions'
import type {
  InGameSendPresetTarget,
  InGameSendRatingPresetOptions
} from '@shared/shards/in-game-send'
import { getInGameSendRatingPresetShortcutTargetId } from '@shared/shards/in-game-send'

import type { InGameSendMainContext } from '../context'
import { createPresetTeams, formatRate, selectedPlayersByPuuids } from './helpers'
import {
  joinPresetList,
  presetCommonT,
  presetPositionName,
  presetPunctuation,
  presetT
} from './i18n'
import {
  countSelectedChampionIds,
  playerDisplayName,
  playerDisplayNameUsesChampionName
} from './name-display'
import type { InGameSendPresetContext, InGameSendPresetPlayer } from './types'

const MAX_MAIN_CHAMPION_COUNT = 3
const MAX_MAIN_POSITION_COUNT = 2
const MIN_MAIN_CHAMPION_MATCH_COUNT = 2
const MAIN_USAGE_DROP_RATIO = 1.5

const POSITION_ORDER = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY']

export type InGameSendRatingPresetLineOptions = Omit<
  InGameSendRatingPresetOptions,
  'targetShortcuts'
> & {
  selectedPuuids: string[]
}

export const getRatingPresetShortcutTargetId = getInGameSendRatingPresetShortcutTargetId

interface RatingStatsSource {
  championName: string | null
  championId: number | null
  matchCount: number | null
  summary: AggregatedSummaryAnalysis | null
  winLoss: AggregatedWinLossAnalysisMap | null
  positions: AggregatedPositionAnalysis | null
  isChampionStats: boolean
}

export function createRatingPresetLineOptions(
  mainContext: InGameSendMainContext
): InGameSendRatingPresetLineOptions {
  const options = mainContext.settings.ratingPresetOptions

  return {
    selectedPuuids: mainContext.state.ratingPuuids,
    kda: options.kda,
    winRate: options.winRate,
    avgSoloKills: options.avgSoloKills,
    avgVisionScore: options.avgVisionScore,
    avgChampionDamage: options.avgChampionDamage,
    avgDamageTaken: options.avgDamageTaken,
    avgGold: options.avgGold,
    avgCsPerMinute: options.avgCsPerMinute,
    avgKillParticipation: options.avgKillParticipation,
    avgDamageGoldEfficiency: options.avgDamageGoldEfficiency,
    mainChampions: options.mainChampions,
    mainPositions: options.mainPositions,
    nameDisplayStrategy: options.nameDisplayStrategy,
    showCurrentChampion: options.showCurrentChampion
  }
}

function formatNullableNumber(value: number | null, digits: number) {
  return value !== null && Number.isFinite(value) ? value.toFixed(digits) : '-'
}

function formatNullableRate(value: number | null) {
  return value !== null && Number.isFinite(value) ? formatRate(value) : '-'
}

function currentChampionName(context: InGameSendPresetContext, player: InGameSendPresetPlayer) {
  if (!player.championId) {
    return presetCommonT('currentChampion')
  }

  return context.mainContext.leagueClient.data.gameData.championName(player.championId)
}

function championName(context: InGameSendPresetContext, championId: number) {
  return context.mainContext.leagueClient.data.gameData.championName(championId)
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

function mainChampionNames(context: InGameSendPresetContext, player: InGameSendPresetPlayer) {
  if (!player.analysis) {
    return []
  }

  const candidates = Object.values(player.analysis.champions)
    .map((champion) => ({
      championId: champion.championId,
      count: champion.winLoss.all.count
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

function mainPositionNames(positions: AggregatedPositionAnalysis | null, useDominance: boolean) {
  if (positions === null) {
    return []
  }

  const candidates = Object.entries(positions)
    .map(([position, count]) => ({
      position,
      count
    }))
    .filter((position) => {
      return POSITION_ORDER.includes(position.position) && position.count > 0
    })
    .toSorted((a, b) => {
      if (a.count !== b.count) {
        return b.count - a.count
      }

      return POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position)
    })

  const selected = useDominance ? selectMainItems(candidates, MAX_MAIN_POSITION_COUNT) : candidates

  return selected.map((position) => presetPositionName(position.position))
}

function resolveRatingStatsSource(
  context: InGameSendPresetContext,
  options: InGameSendRatingPresetLineOptions,
  player: InGameSendPresetPlayer
): RatingStatsSource | null {
  const { analysis } = player
  const shouldUseCurrentChampion = options.showCurrentChampion && player.championId > 0

  if (!analysis) {
    if (shouldUseCurrentChampion) {
      return {
        championName: currentChampionName(context, player),
        championId: player.championId,
        matchCount: 0,
        summary: null,
        winLoss: null,
        positions: null,
        isChampionStats: true
      }
    }

    return null
  }

  if (!shouldUseCurrentChampion) {
    return {
      championName: null,
      championId: null,
      matchCount: analysis.count,
      summary: analysis.summary,
      winLoss: analysis.winLoss,
      positions: analysis.positions,
      isChampionStats: false
    }
  }

  const championAnalysis = analysis.champions[player.championId]
  const championName = currentChampionName(context, player)

  if (!championAnalysis) {
    return {
      championName,
      championId: player.championId,
      matchCount: 0,
      summary: null,
      winLoss: null,
      positions: null,
      isChampionStats: true
    }
  }

  return {
    championName,
    championId: player.championId,
    matchCount: championAnalysis.winLoss.all.count,
    summary: championAnalysis.summary,
    winLoss: championAnalysis.winLoss,
    positions: championAnalysis.positions,
    isChampionStats: true
  }
}

function buildRatingStats(
  context: InGameSendPresetContext,
  options: InGameSendRatingPresetLineOptions,
  player: InGameSendPresetPlayer,
  displayNameUsesChampionName: boolean
) {
  if (options.showCurrentChampion && player.championId <= 0) {
    return presetCommonT('noChampionSelected')
  }

  const statsSource = resolveRatingStatsSource(context, options, player)

  if (!statsSource) {
    return presetT('rating.noRecentMatches')
  }

  const currentChampionSubject = displayNameUsesChampionName
    ? presetCommonT('thisChampion')
    : statsSource.championName
  const noRecordText =
    statsSource.championName && currentChampionSubject
      ? presetT('rating.noChampionMatches', { champion: currentChampionSubject })
      : presetT('rating.noRecentMatches')

  if (statsSource.matchCount !== null && statsSource.matchCount <= 0) {
    return noRecordText
  }

  const summary = statsSource.summary
  const parts: string[] = []
  const count =
    statsSource.matchCount !== null && Number.isFinite(statsSource.matchCount)
      ? statsSource.matchCount
      : null

  if (options.winRate) {
    const winRate = statsSource.winLoss === null ? null : statsSource.winLoss.all.winRate
    parts.push(presetT('rating.metrics.winRate', { value: formatNullableRate(winRate) }))
  }

  if (options.kda) {
    const avgKda = summary === null ? null : summary.avgKda
    parts.push(presetT('rating.metrics.kda', { value: formatNullableNumber(avgKda, 2) }))
  }

  const avgSoloKills = summary === null ? null : summary.avgSoloKills
  if (options.avgSoloKills && avgSoloKills !== null && Number.isFinite(avgSoloKills)) {
    parts.push(
      presetT('rating.metrics.avgSoloKills', {
        value: formatNullableNumber(avgSoloKills, 1)
      })
    )
  }

  if (options.avgVisionScore && summary !== null) {
    parts.push(
      presetT('rating.metrics.avgVisionScore', {
        value: formatNullableNumber(summary.avgVisionScore, 1)
      })
    )
  }

  if (summary !== null) {
    if (options.avgChampionDamage) {
      parts.push(
        presetT('rating.metrics.avgChampionDamage', {
          value: formatNullableRate(summary.avgChampionDamagePercentageOfTeam)
        })
      )
    }

    if (options.avgDamageTaken) {
      parts.push(
        presetT('rating.metrics.avgDamageTaken', {
          value: formatNullableRate(summary.avgDamageTakenPercentageOfTeam)
        })
      )
    }

    if (options.avgGold) {
      parts.push(
        presetT('rating.metrics.avgGold', {
          value: formatNullableRate(summary.avgGoldPercentageOfTeam)
        })
      )
    }

    if (options.avgCsPerMinute) {
      parts.push(
        presetT('rating.metrics.avgCsPerMinute', {
          value: formatNullableNumber(summary.avgCsPerMinute, 1)
        })
      )
    }

    if (options.avgKillParticipation) {
      parts.push(
        presetT('rating.metrics.avgKillParticipation', {
          value: formatNullableRate(summary.avgKillParticipation)
        })
      )
    }

    if (options.avgDamageGoldEfficiency) {
      parts.push(
        presetT('rating.metrics.avgDamageGoldEfficiency', {
          value: formatNullableRate(summary.avgDamageGoldEfficiency)
        })
      )
    }
  }

  if (options.mainChampions && !statsSource.isChampionStats) {
    const names = mainChampionNames(context, player)

    if (names.length) {
      parts.push(
        presetT('rating.metrics.mainChampions', {
          champions: joinPresetList(names)
        })
      )
    }
  }

  if (options.mainPositions) {
    const names = mainPositionNames(statsSource.positions, !statsSource.isChampionStats)

    if (names.length) {
      parts.push(
        presetT('rating.metrics.mainPositions', {
          positions: joinPresetList(names)
        })
      )
    }
  }

  if (count !== null) {
    const prefix =
      statsSource.championName && currentChampionSubject
        ? presetT('rating.championMatchCount', {
            champion: currentChampionSubject,
            count
          })
        : presetT('rating.matchCount', { count })

    return parts.length
      ? presetT('rating.countWithStats', { countText: prefix, stats: parts.join(' ') })
      : prefix
  }

  return parts.length ? parts.join(' ') : noRecordText
}

export function buildRatingPresetLines(
  context: InGameSendPresetContext,
  options: InGameSendRatingPresetLineOptions
) {
  const teams = createPresetTeams(context)
  const players = selectedPlayersByPuuids(context, options.selectedPuuids, teams).map(
    ({ player }) => player
  )
  const selectedChampionIdCounts = countSelectedChampionIds(players)

  return players.flatMap((player) => {
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
    const stats = buildRatingStats(context, options, player, displayNameUsesChampionName)
    return [`${name}${presetPunctuation('lineSeparator')}${stats}`]
  })
}

export function buildRatingPresetLinesFromMainContext(
  mainContext: InGameSendMainContext,
  target: InGameSendPresetTarget
) {
  return buildRatingPresetLines(
    {
      target,
      mainContext
    },
    createRatingPresetLineOptions(mainContext)
  )
}
