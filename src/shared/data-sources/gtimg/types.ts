export interface GtimgHeroListJs {
  hero: Hero[]
  version: string
  fileName: string
  fileTime: string
}

export interface GtimgClassicHero {
  heroId: number
  name: string
  title: string
  alias: string
  baseAlias: string
  roles: string[]
  portrait: string
}

export interface Hero {
  heroId: number
  name: string
  alias: string
  title: string
  roles: string[]
  keywords: string
}

export interface GtimgKiwiAugments {
  augmentID: number
  name_en: string
  name_cn: string
  level: Level | null
  desc: string
  tooltip: string
  large_Icon: string
  small_Icon: string
}

export enum Level {
  KGold = 'kGold',
  KPrismatic = 'kPrismatic',
  KSilver = 'kSilver'
}
