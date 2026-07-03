export type ColorMode = 'light' | 'dark'

export interface GameResourceProviderValue {
  runtime: {
    readonly locale: string
    readonly colorMode: ColorMode
  }

  assets: {
    resolve(source: string): string | null
  }

  champions: {
    name(id: number): string
    icon(id: number): ChampionIconResource | null
  }

  queues: {
    name(id: number): string
  }

  maps: {
    name(id: number, context?: MapNameContext): string
  }

  items: {
    display(id: number): ItemDisplayResource | null
  }

  perks: {
    name(id: number): string
    display(id: number): PerkDisplayResource | null
  }

  perkStyles: {
    display(id: number): PerkStyleDisplayResource | null
  }

  summonerSpells: {
    name(id: number): string
    display(id: number): SummonerSpellDisplayResource | null
  }

  augments: {
    name(id: number): string
    display(id: number): AugmentDisplayResource | null
  }
}

export interface MapNameContext {
  gameModeMutators?: string[] | null
}

export interface ChampionIconResource {
  id: number
  iconPath: string
  source: 'lcu' | 'url'
  variant?: 'default' | 'bravery' | 'unknown'
}

export interface ItemInlineResource {
  id: number
  name: string
  iconPath: string
}

export interface ItemDisplayResource {
  id: number
  name: string
  iconPath: string
  descriptionHtml: string
  price: number
  totalPrice: number
  from: ItemInlineResource[]
  to: ItemInlineResource[]
}

export interface PerkDisplayResource {
  id: number
  name: string
  iconPath: string
  longDescriptionHtml: string
  endOfGameStatDescriptions: string[]
}

export interface PerkStyleDisplayResource {
  id: number
  name: string
  iconPath: string
  tooltip: string
}

export interface SummonerSpellDisplayResource {
  id: number
  name: string
  iconPath: string
  description: string
  cooldown: number
  summonerLevel: number
}

export type AugmentRarity = 'kSilver' | 'kGold' | 'kPrismatic' | 'kBronze' | 'kEventChoice'

export interface AugmentDisplayResource {
  id: number
  name: string
  iconPath: string
  rarity: AugmentRarity
  tooltipHtml?: string
}
