import type {
  OpggAramMayhemChampionAugmentsResponse,
  OpggAramMayhemTierItem,
  OpggAramMayhemTierResponse,
  OpggBuildPickItem,
  OpggChampionAverageStats,
  OpggChampionBuildResponse,
  OpggChampionCounter,
  OpggChampionItem,
  OpggChampionPosition,
  OpggChampionPositionName,
  OpggChampionsResponse
} from '@shared/types/opgg'

import { supportsChampionDataFeature } from './capabilities'
import type {
  ChampionAugment,
  ChampionDataDetails,
  ChampionDataMetadata,
  ChampionDataMode,
  ChampionDataOverview,
  ChampionDataPosition,
  ChampionOverviewItem,
  ChampionPerformance,
  ChampionRecommendationPerformance
} from './types'

export interface OpggAdapterOptions {
  mode: ChampionDataMode
  position?: ChampionDataPosition
  dataDate?: string | null
}

const OPGG_POSITION_TO_UNIFIED: Readonly<Record<OpggChampionPositionName, ChampionDataPosition>> = {
  TOP: 'top',
  JUNGLE: 'jungle',
  MID: 'middle',
  ADC: 'bottom',
  SUPPORT: 'utility'
}

function ratio(numerator: number | undefined, denominator: number | undefined) {
  return numerator === undefined || denominator === undefined || denominator === 0
    ? null
    : numerator / denominator
}

function isoString(value: Date | string | undefined) {
  if (value === undefined) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.valueOf()) ? null : date.toISOString()
}

function recommendationPerformance(item: {
  play?: number
  win?: number
  pick_rate?: number
  rank?: number
  total_place?: number
  first_place?: number
}): ChampionRecommendationPerformance {
  return {
    games: item.play ?? null,
    wins: item.win ?? null,
    winRate: ratio(item.win, item.play),
    pickRate: item.pick_rate ?? null,
    rank: item.rank ?? null,
    averagePlacement: ratio(item.total_place, item.play),
    firstPlaceRate: ratio(item.first_place, item.play)
  }
}

function championPerformance(stats: OpggChampionAverageStats): ChampionPerformance {
  return {
    games: stats.play,
    wins: stats.win ?? null,
    winRate: stats.win_rate ?? ratio(stats.win, stats.play),
    pickRate: stats.pick_rate,
    banRate: stats.ban_rate,
    kda: stats.kda ?? null,
    rank: stats.rank ?? stats.tier_data.rank,
    rankChange: stats.tier_data.rank_prev - stats.tier_data.rank,
    strengthTier: stats.tier ?? stats.tier_data.tier,
    averagePlacement: ratio(stats.total_place, stats.play),
    firstPlaceRate: ratio(stats.first_place, stats.play)
  }
}

function positionPerformance(position: OpggChampionPosition): ChampionPerformance {
  const stats = position.stats
  return {
    games: stats.play,
    wins: null,
    winRate: stats.win_rate,
    pickRate: stats.pick_rate,
    banRate: stats.ban_rate,
    kda: stats.kda,
    rank: stats.tier_data.rank,
    rankChange: stats.tier_data.rank_prev - stats.tier_data.rank,
    strengthTier: stats.tier_data.tier,
    averagePlacement: null,
    firstPlaceRate: null
  }
}

function findPosition(
  positions: OpggChampionPosition[] | null | undefined,
  position: ChampionDataPosition | undefined
) {
  if (!position || position === 'all' || position === 'none') return null
  return positions?.find((item) => OPGG_POSITION_TO_UNIFIED[item.name] === position) ?? null
}

function overviewItem(
  item: OpggChampionItem,
  requestedPosition?: ChampionDataPosition
): ChampionOverviewItem {
  const selectedPosition = findPosition(item.positions, requestedPosition)
  return {
    championId: item.id,
    position: selectedPosition
      ? OPGG_POSITION_TO_UNIFIED[selectedPosition.name]
      : (requestedPosition ?? 'all'),
    performance: selectedPosition
      ? positionPerformance(selectedPosition)
      : championPerformance(item.average_stats),
    counterChampionIds: selectedPosition?.counters.map((counter) => counter.champion_id) ?? []
  }
}

function metadata(
  version: string | undefined,
  cachedAt: Date | string | undefined,
  options: OpggAdapterOptions
): ChampionDataMetadata {
  return {
    source: 'opgg',
    mode: options.mode,
    patch: version ?? null,
    dataDate: options.dataDate ?? null,
    updatedAt: isoString(cachedAt)
  }
}

function buildOptions(items: OpggBuildPickItem[]) {
  return items.map((item) => ({
    itemIds: [...item.ids],
    performance: recommendationPerformance(item)
  }))
}

function matchup(counter: OpggChampionCounter) {
  return {
    championId: counter.champion_id,
    relationship: 'unknown' as const,
    performance: recommendationPerformance(counter)
  }
}

export function adaptOpggChampionOverview(
  response: OpggChampionsResponse,
  options: OpggAdapterOptions
): ChampionDataOverview {
  return {
    metadata: metadata(response.meta.version, response.meta.cached_at, options),
    sections: {
      champions: response.data.map((item) => overviewItem(item, options.position))
    }
  }
}

export function adaptOpggChampionDetails(
  response: OpggChampionBuildResponse,
  options: OpggAdapterOptions
): ChampionDataDetails {
  const data = response.data
  const selectedPosition = findPosition(data.summary.positions, options.position)
  const counters = data.counters ?? selectedPosition?.counters ?? []
  const runeBuilds = data.runes ?? data.rune_pages?.flatMap((page) => page.builds) ?? []
  const supports = (feature: Parameters<typeof supportsChampionDataFeature>[2]) =>
    supportsChampionDataFeature('opgg', options.mode, feature)

  return {
    metadata: metadata(response.meta.version, response.meta.cached_at, options),
    championId: data.summary.id,
    summary: overviewItem(data.summary, options.position),
    sections: {
      ...(supports('matchups') ? { matchups: counters.map(matchup) } : {}),
      ...(supports('synergies')
        ? {
            synergies: (data.synergies ?? []).map((item) => ({
              championIds: [data.summary.id, item.champion_id],
              performance: recommendationPerformance({ ...item, rank: item.op_rank })
            }))
          }
        : {}),
      ...(supports('summoner-spells')
        ? {
            summonerSpells: (data.summoner_spells ?? []).map((item) => ({
              spellIds: [...item.ids],
              performance: recommendationPerformance(item)
            }))
          }
        : {}),
      ...(supports('ability-builds')
        ? {
            abilityBuilds: data.skill_masteries.flatMap((mastery) => {
              if (mastery.builds.length === 0) {
                return [
                  {
                    abilityPriority: [...mastery.ids],
                    levelOrder: [],
                    performance: recommendationPerformance(mastery)
                  }
                ]
              }
              return mastery.builds.map((build) => ({
                abilityPriority: [...mastery.ids],
                levelOrder: [...(build.order ?? [])],
                performance: recommendationPerformance(build)
              }))
            })
          }
        : {}),
      ...(supports('item-builds')
        ? {
            itemBuilds: [
              { slot: 'starting' as const, options: buildOptions(data.starter_items) },
              { slot: 'boots' as const, options: buildOptions(data.boots) },
              { slot: 'core' as const, options: buildOptions(data.core_items) },
              { slot: 'last' as const, options: buildOptions(data.last_items) },
              { slot: 'prism' as const, options: buildOptions(data.prism_items ?? []) }
            ]
          }
        : {}),
      ...(supports('rune-pages')
        ? {
            runePages: runeBuilds.map((item) => ({
              primaryStyleId: item.primary_page_id,
              secondaryStyleId: item.secondary_page_id,
              primaryRuneIds: [...item.primary_rune_ids],
              secondaryRuneIds: [...item.secondary_rune_ids],
              statShardIds: [...item.stat_mod_ids],
              performance: recommendationPerformance(item)
            }))
          }
        : {}),
      ...(supports('champion-augments')
        ? {
            augments: (data.augment_group ?? []).flatMap((group) =>
              group.augments.map((item) => ({
                augmentId: item.id,
                tier: group.rarity,
                rank: null,
                rankChange: null,
                performance: recommendationPerformance(item),
                popularity: item.pick_rate,
                bestChampionIds: []
              }))
            )
          }
        : {}),
      ...(supports('position-stats')
        ? {
            positions: (data.summary.positions ?? []).map((position) => ({
              position: OPGG_POSITION_TO_UNIFIED[position.name],
              share: position.stats.role_rate,
              performance: positionPerformance(position)
            }))
          }
        : {}),
      ...(supports('patch-trends')
        ? {
            trends: data.trends
              ? data.trends.win.map((point, index) => ({
                  patch: point.version,
                  winRate: point.rate,
                  pickRate: data.trends?.pick[index]?.rate ?? null,
                  banRate: data.trends?.ban[index]?.rate ?? null,
                  rank: point.rank
                }))
              : []
          }
        : {}),
      ...(supports('duration-stats')
        ? {
            durations: (data.game_lengths ?? []).map((item) => ({
              range: String(item.game_length),
              winRate: item.rate,
              rank: item.rank
            }))
          }
        : {})
    }
  }
}

export function adaptOpggMayhemOverview(
  response: OpggAramMayhemTierResponse,
  options: Omit<OpggAdapterOptions, 'mode'>
): ChampionDataOverview {
  return {
    metadata: metadata(undefined, undefined, { ...options, mode: 'aram_mayhem' }),
    sections: {
      champions: response.data.map((item) => ({
        championId: item.champion_id,
        position: 'none',
        performance: {
          games: null,
          wins: null,
          winRate: null,
          pickRate: null,
          banRate: null,
          kda: null,
          rank: item.rank,
          rankChange: null,
          strengthTier: item.tier,
          averagePlacement: null,
          firstPlaceRate: null
        },
        counterChampionIds: []
      }))
    }
  }
}

export function adaptOpggMayhemAugments(
  response: OpggAramMayhemChampionAugmentsResponse
): ChampionAugment[] {
  return response.data.map((item) => ({
    augmentId: item.id,
    tier: item.tier,
    rank: null,
    rankChange: null,
    performance: {
      games: null,
      wins: null,
      winRate: null,
      pickRate: item.popular,
      rank: null,
      averagePlacement: null,
      firstPlaceRate: null
    },
    popularity: item.popular,
    bestChampionIds: []
  }))
}

export function adaptOpggMayhemDetails(
  tierItem: OpggAramMayhemTierItem,
  augmentsResponse: OpggAramMayhemChampionAugmentsResponse,
  options: Omit<OpggAdapterOptions, 'mode'>
): ChampionDataDetails {
  const overview = adaptOpggMayhemOverview({ data: [tierItem] }, options)
  return {
    metadata: overview.metadata,
    championId: tierItem.champion_id,
    summary: overview.sections.champions[0],
    sections: { augments: adaptOpggMayhemAugments(augmentsResponse) }
  }
}
