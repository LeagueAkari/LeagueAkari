import type { OpggChampionDataPreferences } from '.'
import type { OpggAramBalanceAdjustment } from '../../data-adapter/opgg-aram-balance'
import type {
  OpggAramMayhemChampionAugment,
  OpggArenaAugment,
  OpggArenaSynergy,
  OpggChampionCounter,
  OpggItemBuild,
  OpggRuneBuild,
  OpggSkillMastery,
  OpggSummonerSpellBuild
} from '../opgg'

export interface OpggChampionDataQuery extends OpggChampionDataPreferences {
  championId: number | null
  /** null follows the latest available version. */
  version: string | null
}

export type OpggChampionDataQueryUpdate = Partial<OpggChampionDataQuery>

export type OpggFlashPosition = 'auto' | 'd' | 'f'

export interface OpggChampionDataCounter extends OpggChampionCounter {
  winRate: number | null
  loss: number
}

export interface OpggChampionDataRow {
  id: number
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

export interface OpggChampionDataSummary extends Omit<OpggChampionDataRow, 'counters'> {
  averagePlace: number | null
  firstPlaceRate: number | null
}

export type OpggRecommendation<T> = T & {
  recommendationId: string
  winRate: number | null
  loss: number
  averagePlace: number | null
  firstPlaceRate: number | null
}

export type OpggAugmentSort = 'default' | 'performance' | 'popular'
export type OpggKiwiAugmentRarity = 'all' | 'kSilver' | 'kGold' | 'kPrismatic'
export interface OpggChampionDataKiwiAugment extends OpggAramMayhemChampionAugment {
  rarity: Exclude<OpggKiwiAugmentRarity, 'all'> | null
  sortRanks: Record<OpggAugmentSort, number>
}

export interface OpggItemSetGroup {
  kind: 'starter' | 'boots' | 'prism' | 'core' | 'last'
  index: number
  pickRate: number | null
  items: number[]
}

export interface OpggChampionDataDetails {
  summary: OpggChampionDataSummary
  summonerSpells: OpggRecommendation<OpggSummonerSpellBuild>[]
  runes: OpggRecommendation<OpggRuneBuild>[]
  skillMasteries: OpggRecommendation<OpggSkillMastery>[]
  starterItems: OpggRecommendation<OpggItemBuild>[]
  boots: OpggRecommendation<OpggItemBuild>[]
  prismItems: OpggRecommendation<OpggItemBuild>[]
  coreItems: OpggRecommendation<OpggItemBuild>[]
  lastItems: OpggRecommendation<OpggItemBuild>[]
  counters: { recommended: OpggChampionDataCounter[]; all: OpggChampionDataCounter[] }
  synergies: OpggRecommendation<OpggArenaSynergy>[]
  augmentGroups: Partial<
    Record<
      1 | 4 | 8,
      {
        rarity: 1 | 4 | 8
        augments: OpggRecommendation<OpggArenaAugment>[]
      }
    >
  >
  kiwiAugmentGroups: {
    rarity: OpggKiwiAugmentRarity
    augments: OpggChampionDataKiwiAugment[]
  }[]
  balance: (OpggAramBalanceAdjustment & { relativeValue: number })[]
  itemSet: { recommendationId: string; groups: OpggItemSetGroup[] } | null
  hasContent: boolean
}

export interface OpggChampionDataSnapshot {
  generation: number
  activePage: number | null
  openedChampions: number[]
  pages: Record<number, OpggChampionPage>
  overviewState: OpggPageState
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

export interface OpggChampionPage extends OpggPageState {
  champion: OpggChampionDataDetails | null
}

export interface OpggApplyRecommendation {
  championId: number
  generation: number
  revision: number
  recommendationId: string
  kind: 'runes' | 'spells' | 'items'
}
