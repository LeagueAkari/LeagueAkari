/** QQ101 HTTP envelopes. Last verified against live endpoints: 2026-11-15. */
export interface Qq101Response<T> {
  code: number
  data: T
  msg: string
  errMsg: string
  err_msg: string
  result: number
}

export interface Qq101Patch {
  id: string
  name: string
  vkey: string
  title: string
  public_date: string
  key: string
}

/** Version-list endpoint has baton; encoded strategy endpoints have message instead. */
export interface Qq101PatchesResponse extends Qq101Response<Qq101Patch[]> {
  baton: number
}

/**
 * Last verified: 2026-11-15. `result` contains JSON; an empty string means no data
 * for the requested champion/date. `_fieldValues.Rxxxxx` duplicates this payload.
 */
export interface Qq101EncodedData {
  _fieldValues: Record<`R${number}`, string>
  result: string
}

export interface Qq101EncodedResponse extends Qq101Response<Qq101EncodedData> {
  message: string
}

export type Qq101Position = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'SUPPORT'
export type Qq101RuneStyleCode = 'jm' | 'zz' | 'zj' | 'ws' | 'qd' | 'jj'
export type Qq101AugmentQuality = '255' | 'kSilver' | 'kGold' | 'kPrismatic'

interface DatedPayload {
  dtstatdate: string
}

/**
 * Delimited payload fields consumed by Akari, last verified: 2026-11-15.
 * Empty strings and `-1` represent empty lists. Numeric statistics use decimal
 * strings; `NC` means no comparison for ranked rank_change/daily_surge.
 */
export interface Qq101Payloads {
  ranked: DatedPayload & {
    /** R17960: # rows, _ columns: rank, hero, tier, lane, win%, pick%, ban%, counters, change, surge, hot. */
    datadetails: string
  }
  classic: DatedPayload & {
    /** R18009: # rows, | columns: rank, classic hero ID, win%, pick%, ban%, tier, change. */
    tierscore_top_hero_list: string
    winrate_top_hero_list: string
    pickrate_top_hero_list: string
    bannedrate_top_hero_list: string
  }
  trend: DatedPayload & { history_strength_trend: string }
  matchups: DatedPayload & { high_op_details: string; low_op_details: string }
  synergies: DatedPayload & { data_details: string }
  spells: DatedPayload & { data_details: string }
  skills: DatedPayload & { detaildetails: string }
  tiers: DatedPayload & { datadetails: string }
  build: DatedPayload & {
    starting_details: string
    shoes_details: string
    core_details: string
    forth_details: string
    fifth_details: string
    sixth_details: string
  }
  runes: DatedPayload & {
    /** R18119: # rows, _ columns: rank, keystone, style code, 9 rune IDs, pick%, win%, games. */
    rune_top_details: string
    /** # rows, _ columns: keystone, style code, rune, pick%, win%, games, stat slot (-1 for runes). */
    rune_single_details: string
  }
  positions: DatedPayload & {
    /** R18122: # rows, LANE：pick%_win%_ban%_tier_rank_share%. */
    lane_details: string
  }
  durations: DatedPayload & { data_details: string }
  aram: {
    /** R6993 / R15380: # rows. Rates are ratios, not percentages. Mayhem adds augment IDs in column 11. */
    listcollect: string
  }
  augments: DatedPayload & { augmentlist: string }
  pairs: DatedPayload & { championid_data: string }
  lanes: DatedPayload & { hero_lane_list: string }
  jungle: DatedPayload & {
    /** R18782: $ groups, CAMP*TEAM:[rank_camps_games_pick%_win%#...]. */
    data_details: string
  }
  mayhemDetails: DatedPayload & {
    augment_json_irank: string
    augment_json: string
    itemout: string
    itemshoes: string
    itemone_json: string
    itemcore_json: string
    itemover_rec: string
    championid_json: string
    skill_json: string
  }
}

/** R15318 nested JSON, last verified: 2026-11-15. Rates are basis points. */
export interface Qq101MayhemItem {
  itemone: string
  winrate: number
  showrate: number
}

export interface Qq101MayhemCoreItems {
  itemcore: string
  winrate: number
  showrate: number
}

export interface Qq101MayhemSkill {
  qwe: string
  qwe_s: string
  qwe_w: string
  sks: Record<string, { sk: string; sk_s: string; sk_w: string }>
}
