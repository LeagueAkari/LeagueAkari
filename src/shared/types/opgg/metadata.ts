/** OP.GG metadata endpoints. Last verified against live zh_CN responses: 2026-11-15. */
export interface OpggMetadataMeta {
  version: string
  cached_timestamp: number
}

export interface OpggMetaChampionName {
  id: number
  name: string
}

export interface OpggMetaChampionNamesResponse {
  data: OpggMetaChampionName[]
  meta: OpggMetadataMeta
}

export interface OpggMetaChampionStats {
  hp: number
  hpperlevel: number
  mp: number
  mpperlevel: number
  movespeed: number
  armor: number
  armorperlevel: number
  spellblock: number
  spellblockperlevel: number
  attackrange: number
  hpregen: number
  hpregenperlevel: number
  mpregen: number
  mpregenperlevel: number
  crit: number
  critperlevel: number
  attackdamage: number
  attackdamageperlevel: number
  attackspeed: number
  attackspeedperlevel: number
}

export interface OpggMetaChampionSkin {
  id: number
  champion_id: number
  name: string
  is_base: boolean
  has_chromas: boolean
  is_blue_essence_purchasable: boolean

  splash_image: string
  loading_image: string
  tiles_image: string
  centered_image: string
  skin_video_url: string | null

  prices: { currency: string; cost: number }[] | null
  sales: null
  release_date: string | null
}

export interface OpggMetaChampionSpell {
  key: string
  name: string
  description: string
  max_rank: number
  range_burn: number[]
  cooldown_burn: number[]
  cooldown_burn_float: number[]
  cost_burn: number[]
  tooltip: string
  image_url: string
  video_url: string | null
}

export interface OpggMetaStandardChampion extends OpggMetaChampionName {
  key: string
  image_url: string
  evolve: { key: string; name: string; image_url: string }[]
  blurb: string
  title: string
  tags: string[]
  lore: string
  partype: string
  info: { attack: number; defense: number; magic: number; difficulty: number }
  stats: OpggMetaChampionStats
  enemy_tips: string[]
  ally_tips: string[]
  skins: OpggMetaChampionSkin[]

  passive: {
    name: string
    description: string
    image_url: string
    video_url: string | null
  }

  spells: OpggMetaChampionSpell[]
  release_date: string | null
}

/** Verified 2026-11-15: JADE entries use the 60000 champion namespace. */
export interface OpggMetaJadeChampion extends OpggMetaStandardChampion {
  availability: {
    metadata_scope: 'JADE'
    game_modes: ['JADE']
    map_ids: number[]
    exclusivity: 'exclusive'
    provenance: 'derived.jade_namespace'
  }
}

export type OpggMetaChampion = OpggMetaStandardChampion | OpggMetaJadeChampion

export interface OpggMetaChampionsResponse {
  data: OpggMetaChampion[]
  meta: OpggMetadataMeta
}

export interface OpggMetaUnscopedItem {
  id: number
  name: string
  image_url: string
  is_mythic: boolean
  into_items: number[] | null
  from_items: number[] | null
  gold: { sell: number; total: number; base: number; purchasable: boolean }
  plaintext: string
  description: string
  depth: number
  stats: Record<string, number>
}

/** Verified 2026-11-15: DDragon and JADE availability have different required fields. */
export type OpggMetaItemAvailability =
  | {
      map_ids: number[]
      exclusivity: 'shared'
      provenance: 'ddragon.maps'
    }
  | {
      metadata_scope: 'JADE'
      map_ids: number[]
      exclusivity: 'shared' | 'exclusive' | 'unknown'
      provenance: 'ddragon.maps+derived.jade_namespace' | 'derived.jade_namespace'
    }

export interface OpggMetaScopedItem extends OpggMetaUnscopedItem {
  availability: OpggMetaItemAvailability
}

export type OpggMetaItem = OpggMetaUnscopedItem | OpggMetaScopedItem

export interface OpggMetaItemsResponse {
  data: OpggMetaItem[]
  meta: OpggMetadataMeta
}

export interface OpggMetaRune {
  id: number
  page_id: number
  slot_sequence: number
  rune_sequence: number
  key: string
  name: string
  short_desc: string
  long_desc: string
  image_url: string
}

export interface OpggMetaRunesResponse {
  data: OpggMetaRune[]
  meta: OpggMetadataMeta
}

export interface OpggMetaRunePage {
  id: number
  name: string
  description: string
  slogan: string
  image_url: string
}

export interface OpggMetaRunePagesResponse {
  data: OpggMetaRunePage[]
  meta: OpggMetadataMeta
}

export interface OpggMetaStatMod {
  id: number
  name: string
  short_desc: string
  image_url: string
}

export interface OpggMetaStatModsResponse {
  data: OpggMetaStatMod[]
  meta: OpggMetadataMeta
}

export interface OpggMetaAramAugment {
  id: number
  name: string
  key: string
  largeIcon: string
  smallIcon: string
  rarity: number
  desc: string
  tooltip: string
}

export interface OpggMetaAramAugmentsResponse {
  data: OpggMetaAramAugment[]
  meta: OpggMetadataMeta & {
    source_version: string
    augment_modifiers: { status: string; definitions: null }
  }
}

export interface OpggMetaVersionsResponse {
  data: string[]
  meta: { cached_at: string; cached_timestamp: number }
}
