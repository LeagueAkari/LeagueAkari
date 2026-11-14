import type { GtimgClassicHero, GtimgHeroListJs, GtimgKiwiAugments, Hero } from './types'

/** Tencent catalogs used by Champion Data. Last verified: 2026-11-15. */
export interface GtimgHeroListResponse extends Omit<GtimgHeroListJs, 'hero'> {
  hero: (Omit<Hero, 'heroId'> & { heroId: string })[]
}

export interface GtimgClassicHeroesResponse {
  heroes: GtimgClassicHero[]
}

export type GtimgKiwiAugmentsResponse = GtimgKiwiAugments[]

export interface GtimgItemResponse {
  itemId: string
  name: string
  iconPath: string
  description: string
  price: string
  total: string
  from: string[]
  into: string[]
}

export interface GtimgSpellResponse {
  name: string
  icon: string
  description: string
  cooldown: string
  summonerlevel: string
}

/** Last verified: 2026-11-15. Styles own slots; leaf runes omit childs. */
export interface GtimgRuneResponse {
  name: string
  icon: string
  longdesc: string
  tooltip: string
  childs?: { name: string; childs: Record<string, GtimgRuneResponse> }[]
}

export interface GtimgGuideResponses {
  items: { items: GtimgItemResponse[] }
  perks: { rune: Record<string, GtimgRuneResponse> }
  spells: { summonerskill: Record<string, GtimgSpellResponse> }
}
