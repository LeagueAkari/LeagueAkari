import type {
  ChampionAbilityBuild,
  ChampionAugment,
  ChampionDataDetails,
  ChampionDataMetadata,
  ChampionDataOverview,
  ChampionDataPosition,
  ChampionDurationStats,
  ChampionItemBuildSlotName,
  ChampionOverviewItem,
  ChampionPerformance,
  ChampionRecommendationPerformance,
  ChampionRunePage,
  ChampionSynergy,
  ChampionTierStats,
  ChampionTrendPoint
} from './types'

interface Qq101EnrichedChampionFields {
  championName?: string
  championTitle?: string
  championKey?: string
  championIconUrl?: string | null
}

export interface Qq101RankedChampion extends Qq101EnrichedChampionFields {
  championId: number
  rank: number | null
  rankChange: number | null
  strengthTier: string
  position: string
  winRate: number | null
  pickRate: number | null
  banRate: number | null
  counterChampionIds: number[]
}

export interface Qq101RankedOverviewInput {
  date: string
  patch: string
  champions: Qq101RankedChampion[]
}

export interface Qq101ClassicOverviewInput {
  date: string
  champions: Qq101RankedChampion[]
}

export interface Qq101RankedDetailsInput {
  date: string
  patch: string
  champion: Qq101RankedChampion
  matchups?: {
    favorable: Array<{ championId: number; winRate: number | null } & Qq101EnrichedChampionFields>
    unfavorable: Array<{ championId: number; winRate: number | null } & Qq101EnrichedChampionFields>
  }
  synergies?: Array<{
    championId: number
    winRate: number | null
    games: number | null
  }>
  summonerSpells?: Array<{
    summonerSpellIds: number[]
    rank: number | null
    winRate: number | null
    pickRate: number | null
  }>
  abilityBuild?: {
    abilityPriority: string[]
    levelOrder: string[]
    options: Array<{
      abilityPriority: string[]
      levelOrder: string[]
      winRate: number | null
      pickRate: number | null
    }>
  }
  itemBuild?: {
    slots: Partial<
      Record<
        ChampionItemBuildSlotName,
        Array<{
          itemIds: number[]
          rank: number | null
          winRate: number | null
          pickRate: number | null
        }>
      >
    >
  }
  runes?: {
    pages: Array<{
      rank: number | null
      primaryStyleId: number | null
      secondaryStyleId: number | null
      primaryRuneIds: number[]
      secondaryRuneIds: number[]
      statShardIds: number[]
      pickRate: number | null
      winRate: number | null
      games: number
    }>
  }
  positions?: Array<{
    position: string
    pickRate: number | null
    winRate: number | null
    banRate: number | null
    strengthTier: string
    rank: number | null
    share: number | null
  }>
  trends?: Array<{ patch: string; winRate: number | null }>
  tiers?: Array<{
    tierId: string | number
    winRate: number | null
    pickRate: number | null
    banRate: number | null
  }>
  durations?: Array<{ range: string; winRate: number | null; rank: number | null }>
}

export interface Qq101MayhemChampion extends Qq101EnrichedChampionFields {
  championId: number
  rank: number | null
  rankChange: number | null
  winRate: number | null
  pickRate: number | null
  bestPartners: Array<
    {
      championId: number
      pickRate: number | null
      winRate: number | null
      rank: number | null
    } & Qq101EnrichedChampionFields
  >
  averageDeathTimeSeconds: number | null
  killParticipationRate: number | null
  damageShare: number | null
  damageTakenShare: number | null
  lowestRankAugmentIds?: number[]
}

export interface Qq101MayhemInput {
  date: string
  champions: Qq101MayhemChampion[]
  augments?: Array<{
    augmentId: number
    augmentTier: number | null
    pickRate: number | null
    pickRank: number | null
    pickRankChange: number | null
    winRate: number | null
    winRank: number | null
    winRankChange: number | null
    bestChampions: Array<{ championId: number } & Qq101EnrichedChampionFields>
  }>
  synergies?: Array<{
    champions: Array<{ championId: number; tags?: string[] } & Qq101EnrichedChampionFields>
    winRate: number | null
    pickRate: number | null
    rank: number | null
  }>
}

function recommendationPerformance(values: {
  games?: number | null
  wins?: number | null
  winRate?: number | null
  pickRate?: number | null
  rank?: number | null
  averagePlacement?: number | null
  firstPlaceRate?: number | null
}): ChampionRecommendationPerformance {
  return {
    games: values.games ?? null,
    wins: values.wins ?? null,
    winRate: values.winRate ?? null,
    pickRate: values.pickRate ?? null,
    rank: values.rank ?? null,
    averagePlacement: values.averagePlacement ?? null,
    firstPlaceRate: values.firstPlaceRate ?? null
  }
}

function performance(values: {
  games?: number | null
  wins?: number | null
  winRate?: number | null
  pickRate?: number | null
  banRate?: number | null
  kda?: number | null
  rank?: number | null
  rankChange?: number | null
  strengthTier?: string | number | null
  averagePlacement?: number | null
  firstPlaceRate?: number | null
}): ChampionPerformance {
  return {
    games: values.games ?? null,
    wins: values.wins ?? null,
    winRate: values.winRate ?? null,
    pickRate: values.pickRate ?? null,
    banRate: values.banRate ?? null,
    kda: values.kda ?? null,
    rank: values.rank ?? null,
    rankChange: values.rankChange ?? null,
    strengthTier: values.strengthTier ?? null,
    averagePlacement: values.averagePlacement ?? null,
    firstPlaceRate: values.firstPlaceRate ?? null
  }
}

function metadata(mode: 'ranked' | 'classic' | 'aram_mayhem', patch: string | null, date: string) {
  return {
    source: 'qq101',
    mode,
    patch,
    dataDate: date || null,
    updatedAt: null
  } satisfies ChampionDataMetadata
}

const QQ101_POSITION_TO_UNIFIED: Readonly<Record<string, ChampionDataPosition>> = {
  ALL: 'all',
  TOP: 'top',
  JUNGLE: 'jungle',
  MID: 'middle',
  MIDDLE: 'middle',
  ADC: 'bottom',
  BOT: 'bottom',
  BOTTOM: 'bottom',
  SUPPORT: 'utility',
  UTILITY: 'utility',
  NONE: 'none'
}

export function adaptQq101Position(position: string): ChampionDataPosition {
  return QQ101_POSITION_TO_UNIFIED[position.trim().toUpperCase()] ?? 'none'
}

function rankedOverviewItem(champion: Qq101RankedChampion): ChampionOverviewItem {
  return {
    championId: champion.championId,
    position: adaptQq101Position(champion.position),
    performance: performance(champion),
    counterChampionIds: [...champion.counterChampionIds]
  }
}

function mayhemOverviewItem(champion: Qq101MayhemChampion): ChampionOverviewItem {
  return {
    championId: champion.championId,
    position: 'none',
    performance: performance(champion),
    counterChampionIds: [],
    mayhem: {
      averageDeathTimeSeconds: champion.averageDeathTimeSeconds,
      killParticipationRate: champion.killParticipationRate,
      damageShare: champion.damageShare,
      damageTakenShare: champion.damageTakenShare,
      lowestRankAugmentIds: [...(champion.lowestRankAugmentIds ?? [])]
    }
  }
}

function adaptMayhemAugment(
  input: NonNullable<Qq101MayhemInput['augments']>[number]
): ChampionAugment {
  return {
    augmentId: input.augmentId,
    tier: input.augmentTier === 255 ? null : input.augmentTier,
    rank: input.pickRank,
    rankChange: input.pickRankChange,
    performanceScore: null,
    performance: recommendationPerformance({
      winRate: input.winRate,
      pickRate: input.pickRate,
      rank: input.winRank
    }),
    popularity: input.pickRate,
    bestChampionIds: input.bestChampions.map((champion) => champion.championId)
  }
}

function adaptMayhemSynergy(
  input: NonNullable<Qq101MayhemInput['synergies']>[number]
): ChampionSynergy {
  return {
    championIds: input.champions.map((champion) => champion.championId),
    performance: recommendationPerformance(input)
  }
}

export function adaptQq101RankedOverview(input: Qq101RankedOverviewInput): ChampionDataOverview {
  return {
    metadata: metadata('ranked', input.patch, input.date),
    sections: { champions: input.champions.map(rankedOverviewItem) }
  }
}

export function adaptQq101ClassicOverview(input: Qq101ClassicOverviewInput): ChampionDataOverview {
  return {
    metadata: metadata('classic', null, input.date),
    sections: { champions: input.champions.map(rankedOverviewItem) }
  }
}

export function adaptQq101RankedDetails(input: Qq101RankedDetailsInput): ChampionDataDetails {
  const itemBuilds = input.itemBuild
    ? Object.entries(input.itemBuild.slots).map(([slot, options]) => ({
        slot: slot as ChampionItemBuildSlotName,
        options: (options ?? []).map((option) => ({
          itemIds: [...option.itemIds],
          performance: recommendationPerformance(option)
        }))
      }))
    : undefined
  const abilityBuilds: ChampionAbilityBuild[] | undefined = input.abilityBuild
    ? (input.abilityBuild.options.length > 0
        ? input.abilityBuild.options
        : [input.abilityBuild]
      ).map((option) => ({
        abilityPriority: [...option.abilityPriority],
        levelOrder: [...option.levelOrder],
        performance: recommendationPerformance(option)
      }))
    : undefined
  const runePages: ChampionRunePage[] | undefined = input.runes?.pages.map((page) => ({
    primaryStyleId: page.primaryStyleId,
    secondaryStyleId: page.secondaryStyleId,
    primaryRuneIds: [...page.primaryRuneIds],
    secondaryRuneIds: [...page.secondaryRuneIds],
    statShardIds: [...page.statShardIds],
    performance: recommendationPerformance(page)
  }))
  const trends: ChampionTrendPoint[] | undefined = input.trends?.map((point) => ({
    patch: point.patch,
    winRate: point.winRate,
    pickRate: null,
    banRate: null,
    rank: null
  }))
  const tiers: ChampionTierStats[] | undefined = input.tiers?.map((tier) => ({ ...tier }))
  const durations: ChampionDurationStats[] | undefined = input.durations?.map((item) => ({
    ...item
  }))

  return {
    metadata: metadata('ranked', input.patch, input.date),
    championId: input.champion.championId,
    summary: rankedOverviewItem(input.champion),
    sections: {
      matchups: input.matchups
        ? [
            ...input.matchups.favorable.map((matchup) => ({
              championId: matchup.championId,
              relationship: 'favorable' as const,
              performance: recommendationPerformance(matchup)
            })),
            ...input.matchups.unfavorable.map((matchup) => ({
              championId: matchup.championId,
              relationship: 'unfavorable' as const,
              performance: recommendationPerformance(matchup)
            }))
          ]
        : undefined,
      synergies: input.synergies?.map((synergy) => ({
        championIds: [input.champion.championId, synergy.championId],
        performance: recommendationPerformance(synergy)
      })),
      summonerSpells: input.summonerSpells?.map((recommendation) => ({
        spellIds: [...recommendation.summonerSpellIds],
        performance: recommendationPerformance(recommendation)
      })),
      abilityBuilds,
      itemBuilds,
      runePages,
      positions: input.positions?.map((position) => ({
        position: adaptQq101Position(position.position),
        share: position.share,
        performance: performance(position)
      })),
      trends,
      tiers,
      durations
    }
  }
}

export function adaptQq101MayhemOverview(input: Qq101MayhemInput): ChampionDataOverview {
  return {
    metadata: metadata('aram_mayhem', null, input.date),
    sections: {
      champions: input.champions.map(mayhemOverviewItem),
      ...(input.augments ? { augments: input.augments.map(adaptMayhemAugment) } : {}),
      ...(input.synergies ? { synergies: input.synergies.map(adaptMayhemSynergy) } : {})
    }
  }
}

export function adaptQq101MayhemDetails(
  input: Qq101MayhemInput,
  championId: number
): ChampionDataDetails | null {
  const champion = input.champions.find((item) => item.championId === championId)
  if (!champion) return null
  const augmentIds = new Set(champion.lowestRankAugmentIds ?? [])

  return {
    metadata: metadata('aram_mayhem', null, input.date),
    championId,
    summary: mayhemOverviewItem(champion),
    sections: {
      synergies: champion.bestPartners.map((partner) => ({
        championIds: [championId, partner.championId],
        performance: recommendationPerformance(partner)
      })),
      ...(input.augments
        ? {
            augments: input.augments
              .filter((item) => augmentIds.has(item.augmentId))
              .map(adaptMayhemAugment)
          }
        : {})
    }
  }
}
