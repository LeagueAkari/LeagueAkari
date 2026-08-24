import type {
  ChampionDataDetails,
  ChampionDataMode,
  ChampionDataOverview,
  ChampionDataPosition,
  ChampionPerformance,
  ChampionRecommendationPerformance
} from '@shared/data-adapter/champion-data'
import {
  type OpggAramMayhemChampionAugmentsResponse,
  type OpggBuildPickItem,
  type OpggChampionAverageStats,
  type OpggChampionBuildResponse,
  type OpggChampionCounter,
  type OpggChampionItem,
  type OpggChampionPosition,
  OpggChampionPositionName,
  type OpggChampionsResponse,
  type OpggSkillKey
} from '@shared/types/opgg'

const UNIFIED_TO_OPGG_POSITION: Partial<Record<ChampionDataPosition, OpggChampionPositionName>> = {
  top: OpggChampionPositionName.Top,
  jungle: OpggChampionPositionName.Jungle,
  middle: OpggChampionPositionName.Mid,
  bottom: OpggChampionPositionName.ADC,
  utility: OpggChampionPositionName.Support
}

function tierNumber(value: string | number | null) {
  if (typeof value === 'number') return value
  if (!value) return undefined
  if (value.toUpperCase() === 'OP') return 0
  const parsed = Number(value.match(/\d+/)?.[0])
  return Number.isFinite(parsed) ? parsed : undefined
}

function inferredWinsIfAvailable(performance: ChampionRecommendationPerformance) {
  if (performance.wins !== null) return performance.wins
  if (performance.games !== null && performance.winRate !== null) {
    return performance.games * performance.winRate
  }
  if (performance.winRate !== null) return performance.winRate
  return undefined
}

function inferredWins(performance: ChampionRecommendationPerformance) {
  return inferredWinsIfAvailable(performance) ?? 0
}

function averageStats(performance: ChampionPerformance): OpggChampionAverageStats {
  const tier = tierNumber(performance.strengthTier)
  const rank = performance.rank ?? 0
  return {
    play: performance.games ?? 0,
    ...(performance.winRate === null ? {} : { win_rate: performance.winRate }),
    ...(performance.pickRate === null ? {} : { pick_rate: performance.pickRate }),
    ban_rate: performance.banRate,
    ...(performance.kda === null ? {} : { kda: performance.kda }),
    ...(tier === undefined ? {} : { tier }),
    ...(performance.rank === null ? {} : { rank: performance.rank }),
    tier_data: {
      tier: tier ?? 0,
      rank,
      rank_prev: rank + (performance.rankChange ?? 0),
      rank_prev_patch: null
    },
    ...(performance.wins === null ? {} : { win: performance.wins }),
    ...(performance.averagePlacement === null || performance.games === null
      ? {}
      : { total_place: performance.averagePlacement * performance.games }),
    ...(performance.firstPlaceRate === null || performance.games === null
      ? {}
      : { first_place: performance.firstPlaceRate * performance.games })
  }
}

function counter(
  championId: number,
  performance?: ChampionRecommendationPerformance
): OpggChampionCounter {
  return {
    champion_id: championId,
    play: performance?.games ?? 0,
    win: performance ? inferredWins(performance) : 0
  }
}

function positionItem(
  position: ChampionDataPosition,
  performance: ChampionPerformance,
  counters: OpggChampionCounter[] = [],
  share: number | null = null
): OpggChampionPosition | null {
  const name = UNIFIED_TO_OPGG_POSITION[position]
  if (!name) return null
  const stats = averageStats(performance)
  return {
    name,
    stats: {
      play: stats.play,
      win_rate: stats.win_rate ?? 0,
      pick_rate: stats.pick_rate ?? 0,
      role_rate: share ?? performance.pickRate ?? 0,
      ban_rate: stats.ban_rate ?? 0,
      kda: stats.kda ?? 0,
      tier_data: stats.tier_data,
      total_place: undefined as never,
      first_place: undefined as never
    },
    roles: [],
    counters
  }
}

function buildPickItem(
  ids: number[],
  performance: ChampionRecommendationPerformance,
  order?: string[]
): OpggBuildPickItem {
  return {
    ids,
    play: performance.games ?? 0,
    win: inferredWins(performance),
    pick_rate: performance.pickRate ?? 0,
    ...(order?.length ? { order: order as OpggSkillKey[] } : {}),
    ...(performance.averagePlacement === null || performance.games === null
      ? {}
      : { total_place: performance.averagePlacement * performance.games }),
    ...(performance.firstPlaceRate === null || performance.games === null
      ? {}
      : { first_place: performance.firstPlaceRate * performance.games })
  }
}

export function toOpggChampionOverviewViewModel(
  overview: ChampionDataOverview
): OpggChampionsResponse {
  const champions = new Map<number, OpggChampionItem>()

  for (const item of overview.sections.champions) {
    let champion = champions.get(item.championId)
    if (!champion) {
      champion = {
        id: item.championId,
        is_rotation: false,
        is_rip: false,
        average_stats: averageStats(item.performance),
        positions: [],
        roles: []
      }
      champions.set(item.championId, champion)
    }

    const position = positionItem(
      item.position,
      item.performance,
      item.counterChampionIds.map((championId) => counter(championId))
    )
    if (position && !champion.positions?.some((entry) => entry.name === position.name)) {
      champion.positions?.push(position)
    }
  }

  return {
    data: Array.from(champions.values()),
    meta: {
      version: overview.metadata.patch ?? '',
      cached_at: new Date(overview.metadata.updatedAt ?? overview.metadata.dataDate ?? 0)
    }
  }
}

export function toOpggChampionDetailsViewModel(
  details: ChampionDataDetails
): OpggChampionBuildResponse {
  const matchupCounters = (details.sections.matchups ?? []).map((item) =>
    counter(item.championId, item.performance)
  )
  const positions = (details.sections.positions ?? []).flatMap((item) => {
    const position = positionItem(
      item.position,
      item.performance,
      item.position === details.summary.position ? matchupCounters : [],
      item.share
    )
    return position ? [position] : []
  })
  if (positions.length === 0) {
    const position = positionItem(
      details.summary.position,
      details.summary.performance,
      matchupCounters
    )
    if (position) positions.push(position)
  }

  const itemBuilds = new Map(
    (details.sections.itemBuilds ?? []).map((slot) => [
      slot.slot,
      slot.options.map((option) => buildPickItem(option.itemIds, option.performance))
    ])
  )
  const abilityBuilds = new Map<
    string,
    NonNullable<ChampionDataDetails['sections']['abilityBuilds']>
  >()
  for (const build of details.sections.abilityBuilds ?? []) {
    const key = build.abilityPriority.join('|')
    abilityBuilds.set(key, [...(abilityBuilds.get(key) ?? []), build])
  }

  return {
    data: {
      summary: {
        id: details.championId,
        is_rotation: false,
        is_rip: false,
        average_stats: averageStats(details.summary.performance),
        positions: positions.length ? positions : null,
        roles: []
      },
      summoner_spells: details.sections.summonerSpells?.map((item) =>
        buildPickItem(item.spellIds, item.performance)
      ),
      core_items: itemBuilds.get('core') ?? [],
      boots: itemBuilds.get('boots') ?? [],
      starter_items: itemBuilds.get('starting') ?? [],
      last_items: ['last', 'fourth', 'fifth', 'sixth'].flatMap(
        (slot) => itemBuilds.get(slot as 'last' | 'fourth' | 'fifth' | 'sixth') ?? []
      ),
      prism_items: itemBuilds.get('prism') ?? [],
      runes: details.sections.runePages?.map((item, index) => ({
        id: index,
        primary_page_id: item.primaryStyleId ?? 0,
        primary_rune_ids: item.primaryRuneIds,
        secondary_page_id: item.secondaryStyleId ?? 0,
        secondary_rune_ids: item.secondaryRuneIds,
        stat_mod_ids: item.statShardIds,
        play: item.performance.games ?? 0,
        win: inferredWins(item.performance),
        pick_rate: item.performance.pickRate ?? 0
      })),
      skill_masteries: Array.from(abilityBuilds.values()).map((builds) => ({
        ids: builds[0].abilityPriority as OpggSkillKey[],
        play: builds[0].performance.games ?? 0,
        win: inferredWins(builds[0].performance),
        pick_rate: builds[0].performance.pickRate ?? 0,
        builds: builds.map((build) => buildPickItem([], build.performance, build.levelOrder))
      })),
      skills: [],
      skill_evolves: [],
      counters: matchupCounters,
      synergies: details.sections.synergies?.flatMap((item) => {
        const championId = item.championIds.find((id) => id !== details.championId)
        if (championId === undefined) return []

        const inferredWin = inferredWinsIfAvailable(item.performance)
        return [
          {
            champion_id: championId,
            op_rank: item.performance.rank ?? 0,
            play: item.performance.games ?? 0,
            ...(inferredWin === undefined ? {} : { win: inferredWin }),
            ...(item.performance.averagePlacement === null || item.performance.games === null
              ? {}
              : { total_place: item.performance.averagePlacement * item.performance.games }),
            ...(item.performance.firstPlaceRate === null || item.performance.games === null
              ? {}
              : { first_place: item.performance.firstPlaceRate * item.performance.games }),
            ...(item.performance.pickRate === null ? {} : { pick_rate: item.performance.pickRate })
          }
        ]
      }),
      augment_group:
        details.metadata.mode === 'arena'
          ? Array.from(
              Map.groupBy(details.sections.augments ?? [], (item) => item.tier ?? 0),
              ([rarity, augments]) => ({
                rarity,
                augments: augments.map((item) => ({
                  id: item.augmentId,
                  win: inferredWins(item.performance),
                  play: item.performance.games ?? 0,
                  total_place:
                    item.performance.averagePlacement === null || item.performance.games === null
                      ? 0
                      : item.performance.averagePlacement * item.performance.games,
                  first_place:
                    item.performance.firstPlaceRate === null || item.performance.games === null
                      ? 0
                      : item.performance.firstPlaceRate * item.performance.games,
                  pick_rate: item.performance.pickRate ?? 0
                }))
              })
            )
          : undefined
    },
    meta: {
      version: details.metadata.patch ?? '',
      cached_at: new Date(details.metadata.updatedAt ?? details.metadata.dataDate ?? 0)
    }
  }
}

export function toOpggMayhemAugmentsViewModel(
  details: ChampionDataDetails,
  mode: ChampionDataMode
): OpggAramMayhemChampionAugmentsResponse | null {
  if (mode !== 'aram_mayhem' || !details.sections.augments) return null
  return {
    data: details.sections.augments.map((item) => ({
      id: item.augmentId,
      tier: item.tier,
      performance:
        item.performanceScore ??
        (item.performance.winRate === null ? 0 : item.performance.winRate * 100),
      popular:
        details.metadata.source === 'qq101'
          ? (item.popularity ?? item.performance.pickRate ?? 0) * 100
          : (item.popularity ?? item.performance.pickRate ?? 0)
    }))
  }
}
