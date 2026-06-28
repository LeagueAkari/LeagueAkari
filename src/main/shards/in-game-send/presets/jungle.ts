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
import { joinPresetList, presetCommonT, presetPunctuation, presetT } from './i18n'
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

  return presetT('jungle.firstDragonAverageTime', {
    time: `${minutes}:${remainingSeconds}`
  })
}

function formatCampName(camp: string) {
  switch (camp) {
    case 'blue':
      return presetT('jungle.camps.blue')
    case 'red':
      return presetT('jungle.camps.red')
    case 'wolves':
      return presetT('jungle.camps.wolves')
    case 'raptors':
      return presetT('jungle.camps.raptors')
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
      label: presetT('jungle.lanes.top'),
      rate: jungle.avgTopZonePercentage
    },
    {
      label: presetT('jungle.lanes.mid'),
      rate: jungle.avgMidZonePercentage
    },
    {
      label: presetT('jungle.lanes.bot'),
      rate: jungle.avgBotZonePercentage
    }
  ].toSorted((a, b) => b.rate - a.rate)

  const [first, second] = lanes

  if (first.rate === 0) {
    return presetT('jungle.lanePreference.unclear')
  }

  if (second.rate >= first.rate * 0.65) {
    return presetT('jungle.lanePreference.double', {
      first: first.label,
      second: second.label
    })
  }

  return presetT('jungle.lanePreference.single', {
    lane: first.label
  })
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
  return kind === 'normal'
    ? presetT('jungle.firstClear.normal')
    : presetT('jungle.firstClear.invade')
}

function firstClearTeamSideLabel(side: FirstClearTeamSide) {
  return side === 'blue' ? presetT('jungle.firstClear.blue') : presetT('jungle.firstClear.red')
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
            .map(([camp, campCount]) =>
              presetT('jungle.campRate', {
                camp: formatCampName(camp),
                rate: formatRate(campCount / count)
              })
            )
        : []
  }
}

function formatFirstClearPattern(pattern: FirstClearPattern) {
  const rate = pattern.rate === null ? '-' : formatRate(pattern.rate)
  const distribution = pattern.rate !== null && pattern.rate > 0 ? pattern.distribution : []
  const distributionText = distribution.length ? `[${joinPresetList(distribution)}]` : ''

  return presetT('jungle.firstClear.pattern', {
    side: firstClearTeamSideLabel(pattern.side),
    kind: firstClearKindLabel(pattern.kind),
    rate,
    distribution: distributionText
  })
}

function formatActivityPreference(jungle: AggregatedJungleAnalysis) {
  return presetT('jungle.metrics.activityPreference', {
    preference: lanePreference(jungle),
    top: formatRate(jungle.avgTopZonePercentage),
    mid: formatRate(jungle.avgMidZonePercentage),
    bot: formatRate(jungle.avgBotZonePercentage)
  })
}

function formatJungleNoRecordText(
  statsSource: JungleStatsSource,
  displayNameUsesChampionName: boolean
) {
  if (!statsSource.isChampionStats || !statsSource.championName) {
    return presetT('jungle.noRecords')
  }

  const subject = displayNameUsesChampionName
    ? presetCommonT('thisChampion')
    : statsSource.championName
  return presetT('jungle.noChampionRecords', { champion: subject })
}

function formatJungleSamplePrefix(
  statsSource: JungleStatsSource,
  displayNameUsesChampionName: boolean
) {
  if (!statsSource.isChampionStats || !statsSource.championName) {
    return presetT('jungle.sampleCount', {
      count: statsSource.jungle?.gamesAnalyzed ?? 0
    })
  }

  const subject = displayNameUsesChampionName
    ? presetCommonT('thisChampion')
    : statsSource.championName
  return presetT('jungle.championSampleCount', {
    champion: subject,
    count: statsSource.jungle?.gamesAnalyzed ?? 0
  })
}

function buildGlobalJungleStats(
  context: InGameSendPresetContext,
  options: InGameSendJunglePresetLineOptions,
  player: InGameSendPresetPlayer,
  statsSource: JungleStatsSource
) {
  const jungle = statsSource.jungle
  if (!jungle) {
    return presetT('jungle.noRecords')
  }

  const mainChampions = mainJungleChampionNames(context, player)
  const parts = [formatJungleSamplePrefix(statsSource, false)]

  if (options.activityPreference) {
    parts.push(formatActivityPreference(jungle))
  }

  if (options.earlyGank) {
    parts.push(
      presetT('jungle.metrics.level3Gank', {
        value: formatRate(jungle.earlyGank.level3GankRate)
      }),
      presetT('jungle.metrics.level4Gank', {
        value: formatRate(jungle.earlyGank.level4GankRate)
      })
    )
  }

  if (options.dragonControl) {
    parts.push(
      presetT('jungle.metrics.firstDragon', {
        value: formatRate(jungle.objectives.firstDragonRate),
        time: formatFirstDragonTimeText(jungle.objectives.avgFirstDragonTime)
      }),
      presetT('jungle.metrics.avgDragons', {
        value: formatFixedNumber(jungle.objectives.avgDragons, 1)
      })
    )
  }

  if (options.monsterControl) {
    parts.push(
      presetT('jungle.metrics.monsterControl', {
        voidgrubs: formatFixedNumber(jungle.objectives.avgVoidgrubs, 1),
        heralds: formatFixedNumber(jungle.objectives.avgHeralds, 1),
        barons: formatFixedNumber(jungle.objectives.avgBarons, 1)
      })
    )
  }

  if (options.mainChampions && mainChampions.length) {
    parts.push(
      presetT('jungle.metrics.mainChampions', {
        champions: joinPresetList(mainChampions)
      })
    )
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
      presetT('jungle.metrics.level3Gank', {
        value: formatRate(jungle.earlyGank.level3GankRate)
      }),
      presetT('jungle.metrics.level4Gank', {
        value: formatRate(jungle.earlyGank.level4GankRate)
      })
    )
  }

  if (options.dragonControl) {
    parts.push(
      presetT('jungle.metrics.firstDragon', {
        value: formatRate(jungle.objectives.firstDragonRate),
        time: formatFirstDragonTimeText(jungle.objectives.avgFirstDragonTime)
      }),
      presetT('jungle.metrics.avgDragons', {
        value: formatFixedNumber(jungle.objectives.avgDragons, 1)
      })
    )
  }

  if (options.monsterControl) {
    parts.push(
      presetT('jungle.metrics.monsterControl', {
        voidgrubs: formatFixedNumber(jungle.objectives.avgVoidgrubs, 1),
        heralds: formatFixedNumber(jungle.objectives.avgHeralds, 1),
        barons: formatFixedNumber(jungle.objectives.avgBarons, 1)
      })
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
    return presetCommonT('noChampionSelected')
  }

  const statsSource = resolveJungleStatsSource(context, options, player)

  if (!statsSource) {
    return presetCommonT('noChampionSelected')
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

    return `${name}${presetPunctuation('lineSeparator')}${stats}`
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
