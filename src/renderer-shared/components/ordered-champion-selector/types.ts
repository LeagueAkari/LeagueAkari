export const ORDERED_CHAMPION_POSITIONS = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'] as const

export type OrderedChampionPosition = (typeof ORDERED_CHAMPION_POSITIONS)[number]

export interface OrderedChampionOption {
  id: number
  name: string
  positions?: OrderedChampionPosition[]
  unavailable?: boolean
}

export type OrderedChampionMatcher = (pattern: string, champion: OrderedChampionOption) => boolean

export interface OrderedChampionRowOption extends OrderedChampionOption {
  fallback?: boolean
}
