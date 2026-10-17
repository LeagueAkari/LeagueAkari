import type { OpggChampionDataPreferences } from '.'
import type { OpggAramBalanceAdjustment } from '../../data-adapter/opgg-aram-balance'
import type { OpggSkillCode } from '../opgg'

export interface OpggChampionDataQuery extends OpggChampionDataPreferences {
  championId: number | null
  /** null follows the latest available version. */
  version: string | null
}

export type OpggChampionDataQueryUpdate = Partial<OpggChampionDataQuery>

export type OpggFlashPosition = 'auto' | 'd' | 'f'

export interface OpggChampionDataCounter {
  championId: number
  play: number
  win: number | null
  winRate: number | null
  loss: number | null
}

export interface OpggChampionDataRow {
  championId: number
  rank: number | null
  tier: number | null
  winRate: number | null
  pickRate: number | null
  banRate: number | null
  play: number | null
  win: number | null
  loss: number | null
  counters: OpggChampionDataCounter[]
}

export type OpggChampionDataSummary = Omit<OpggChampionDataRow, 'counters'> &
  (
    | { kind: 'win-rate' }
    | { kind: 'placement'; averagePlace: number | null; firstPlaceRate: number | null }
  )

export interface OpggRecommendationStats {
  recommendationId: string
  play: number
  win: number | null
  pickRate: number
  winRate: number | null
  loss: number | null
}

export type OpggRecommendation<T> = T & OpggRecommendationStats

export type OpggPlacementRecommendation<T> = OpggRecommendation<T> & {
  averagePlace: number | null
  firstPlaceRate: number | null
}

export interface OpggItemBuild {
  itemIds: number[]
}

export interface OpggItemBuildStage {
  order: number
  builds: OpggRecommendation<OpggItemBuild>[]
}

export interface OpggSummonerSpellBuild {
  spellIds: [number, number]
}

export interface OpggSkillMastery {
  skills: OpggSkillCode[]
  orders: OpggSkillCode[][]
}

export interface OpggRuneBuild {
  primaryStyleId: number
  secondaryStyleId: number
  primaryRuneIds: number[]
  secondaryRuneIds: number[]
  statShardIds: number[]
}

export type OpggAugmentSort = 'default' | 'performance' | 'popular'

export type OpggKiwiAugmentRarity = 'all' | 'kSilver' | 'kGold' | 'kPrismatic'

export interface OpggChampionDataKiwiAugment {
  augmentId: number
  tier: number | null
  performance: number
  popular: number
  rarity: Exclude<OpggKiwiAugmentRarity, 'all'> | null
  sortRanks: Record<OpggAugmentSort, number>
}

export interface OpggItemSetGroup {
  kind: 'starter' | 'boots' | 'prism' | 'core' | 'last'
  index: number
  pickRate: number | null
  items: number[]
}

interface OpggDetailsBase {
  summary: OpggChampionDataSummary
  hasContent: boolean
}

interface OpggBuildDetails extends OpggDetailsBase {
  skillMasteries: OpggRecommendation<OpggSkillMastery>[]
  starterItems: OpggRecommendation<OpggItemBuild>[]
  boots: OpggRecommendation<OpggItemBuild>[]
  coreItems: OpggRecommendation<OpggItemBuild>[]
  lastItems: OpggRecommendation<OpggItemBuild>[]
  itemSet: { recommendationId: string; groups: OpggItemSetGroup[] } | null
}

export interface OpggStandardDetails extends OpggBuildDetails {
  kind: 'ranked' | 'flex' | 'aram' | 'nexus_blitz' | 'urf'
  itemBuildsByOrder: { single: OpggItemBuildStage[]; combined: OpggItemBuildStage[] }
  summonerSpells: OpggRecommendation<OpggSummonerSpellBuild>[]
  runes: OpggRecommendation<OpggRuneBuild>[]
  counters: { recommended: OpggChampionDataCounter[]; all: OpggChampionDataCounter[] }
  balance: (OpggAramBalanceAdjustment & { relativeValue: number })[]
}

export interface OpggArenaDetails extends OpggBuildDetails {
  kind: 'arena'
  prismItems: OpggRecommendation<OpggItemBuild>[]
  synergies: OpggPlacementRecommendation<{ championId: number }>[]
  augmentGroups: Partial<
    Record<
      1 | 4 | 8,
      {
        rarity: 1 | 4 | 8
        augments: OpggRecommendation<{ augmentId: number }>[]
      }
    >
  >
}

export interface OpggMayhemDetails extends OpggDetailsBase {
  kind: 'aram_mayhem'
  kiwiAugmentGroups: {
    rarity: OpggKiwiAugmentRarity
    augments: OpggChampionDataKiwiAugment[]
  }[]
}

export type OpggChampionDataDetails = OpggStandardDetails | OpggArenaDetails | OpggMayhemDetails

export interface OpggChampionDataSnapshot {
  generation: number
  activePage: number | null
  openedPages: number[]
  pages: Record<number, OpggChampionPage>
  overviewState: OpggQueryPageState
  followSelectionId: number
  query: OpggChampionDataQuery
  version: string | null
  versions: string[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  overview: OpggChampionDataRow[] | null
  champion: OpggChampionDataDetails | null
}

export interface OpggPageState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  revision: number
  stale: boolean
}

export interface OpggQueryPageState extends OpggPageState {
  query: OpggChampionDataQuery
  version: string | null
  versions: string[]
}

export interface OpggChampionPage extends OpggQueryPageState {
  champion: OpggChampionDataDetails | null
}

export interface OpggChampionBalance {
  championId: number
  attackSpeed: number
  damageDealt: number
  damageTaken: number
  abilityHaste: number
  healing: number
  tenacity: number
  shieldAmount: number
  energyRegen: number
  areaOfEffectDamage: number
}
