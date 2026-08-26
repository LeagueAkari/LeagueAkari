import type {
  ChampionDataFeature,
  ChampionDataFilter,
  ChampionDataMode,
  ChampionDataSourceId
} from './types'

export interface ChampionDataModeCapability {
  mode: ChampionDataMode
  filters: readonly ChampionDataFilter[]
  features: readonly ChampionDataFeature[]
}

const STANDARD_BUILD_FEATURES = [
  'champion-overview',
  'champion-summary',
  'matchups',
  'synergies',
  'summoner-spells',
  'ability-builds',
  'item-builds',
  'rune-pages',
  'position-stats',
  'patch-trends',
  'duration-stats'
] as const satisfies readonly ChampionDataFeature[]

export const CHAMPION_DATA_CAPABILITIES: Readonly<
  Record<ChampionDataSourceId, readonly ChampionDataModeCapability[]>
> = {
  opgg: [
    {
      mode: 'ranked',
      filters: ['region', 'patch', 'tier', 'position'],
      features: STANDARD_BUILD_FEATURES
    },
    {
      mode: 'aram',
      filters: ['region', 'patch', 'tier'],
      features: STANDARD_BUILD_FEATURES
    },
    {
      mode: 'aram_mayhem',
      filters: [],
      features: ['champion-overview', 'champion-summary', 'champion-augments']
    },
    {
      mode: 'arena',
      filters: ['region', 'patch'],
      features: [
        'champion-overview',
        'champion-summary',
        'item-builds',
        'champion-augments',
        'synergies'
      ]
    },
    {
      mode: 'nexus_blitz',
      filters: ['region', 'patch', 'tier'],
      features: STANDARD_BUILD_FEATURES
    },
    {
      mode: 'urf',
      filters: ['region', 'patch', 'tier'],
      features: STANDARD_BUILD_FEATURES
    }
  ],
  qq101: [
    {
      mode: 'ranked',
      filters: ['patch', 'tier', 'position'],
      features: [...STANDARD_BUILD_FEATURES, 'tier-stats']
    },
    {
      mode: 'classic',
      filters: ['position'],
      features: ['champion-overview']
    },
    {
      mode: 'aram_mayhem',
      filters: [],
      features: [
        'champion-overview',
        'champion-summary',
        'champion-augments',
        'augment-overview',
        'synergy-overview',
        'synergies'
      ]
    }
  ]
}

export function getChampionDataCapability(
  source: ChampionDataSourceId,
  mode: ChampionDataMode
): ChampionDataModeCapability | null {
  return CHAMPION_DATA_CAPABILITIES[source].find((item) => item.mode === mode) ?? null
}

export function supportsChampionDataFeature(
  source: ChampionDataSourceId,
  mode: ChampionDataMode,
  feature: ChampionDataFeature
) {
  return getChampionDataCapability(source, mode)?.features.some((item) => item === feature) ?? false
}
