import type { ResponseParser } from '../response-parser'

export type Qq101Operation =
  | 'patches'
  | 'ranked'
  | 'classic'
  | 'trend'
  | 'matchups'
  | 'synergies'
  | 'spells'
  | 'skills'
  | 'tiers'
  | 'build'
  | 'runes'
  | 'positions'
  | 'durations'
  | 'aram'
  | 'mayhem'
  | 'augments'
  | 'pairs'
  | 'lanes'
  | 'jungle'
  | 'mayhemDetails'

const FIELD_IDS: Record<Exclude<Qq101Operation, 'patches'>, string> = {
  ranked: '17960',
  classic: '18009',
  trend: '17987',
  matchups: '17968',
  synergies: '18015',
  spells: '18029',
  skills: '18070',
  tiers: '18059',
  build: '18087',
  runes: '18119',
  positions: '18122',
  durations: '18057',
  aram: '6993',
  mayhem: '15380',
  augments: '15381',
  pairs: '15323',
  lanes: '18037',
  jungle: '18782',
  mayhemDetails: '15318'
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/** Decode QQ101's serialization only. Values remain unknown/string until schema validation. */
export function parseQq101Protocol(
  operation: Qq101Operation,
  response: unknown,
  decoder: ResponseParser
): unknown {
  const envelope = record(response)
  if (envelope.code !== 0) {
    decoder.issue('envelope.code', 'Expected a successful QQ101 envelope; using empty data')
    return {}
  }

  if (operation === 'patches') {
    return { data: envelope.data }
  }

  const fieldId = FIELD_IDS[operation]

  const json = (value: unknown, path: string): unknown => {
    if (typeof value !== 'string') {
      return value
    }
    if (value === '' || value === '-1') {
      return {}
    }

    try {
      return JSON.parse(value)
    } catch {
      decoder.issue(`R${fieldId}.${path}`, 'Invalid embedded JSON; using empty data')
      return {}
    }
  }

  const data = record(envelope.data)
  let embedded =
    typeof envelope.data === 'string'
      ? envelope.data
      : (data.result ?? data.augmentlist ?? data.championid_data ?? envelope.result)
  if (embedded === undefined) {
    const fields = record(data._fieldValues)
    embedded = fields[`R${fieldId}`]
    if (embedded === undefined && Object.keys(fields).length === 1) {
      embedded = Object.values(fields)[0]
    }
  }

  if (embedded === undefined) {
    decoder.issue(`R${fieldId}`, 'Missing an unambiguous payload; using empty data')
  }

  const payload = record(json(embedded, 'payload'))

  const split = (value: unknown, separator: string | RegExp): unknown => {
    if (typeof value !== 'string') {
      // A wire array is not an already-decoded record list. Leave a failure marker for validation.
      if (Array.isArray(value)) {
        return { kind: 'invalid-encoding', expected: 'record-string' }
      }

      return value
    }

    return value === '-1' ? [] : value.split(separator).filter(Boolean)
  }

  const records = (
    value: unknown,
    rows: string | RegExp,
    separator: string,
    columns: string[]
  ): unknown => {
    const entries = split(value, rows)
    if (!Array.isArray(entries)) {
      return entries
    }

    return entries.map((entry) => {
      const values = String(entry).split(separator)
      return Object.fromEntries(
        columns.map((column, index) => [column, values[index]]).filter(([column]) => column !== '')
      )
    })
  }

  const map = (value: unknown, project: (row: Record<string, unknown>) => unknown): unknown =>
    Array.isArray(value) ? value.map((entry) => project(record(entry))) : value

  const date = payload.dtstatdate

  const fields = (key: string, columns: string[], separator = '_', rows: string | RegExp = '#') =>
    records(payload[key], rows, separator, columns)

  const buildColumns = ['item_ids', 'rank', 'pick_rate', 'win_rate']

  switch (operation) {
    case 'ranked':
      return {
        date,
        rows: map(
          fields('datadetails', [
            'rank',
            'champion_id',
            'tier',
            'lane',
            'win_rate',
            'pick_rate',
            'ban_rate',
            'counter_ids',
            'rank_change',
            'daily_surge',
            'is_hot'
          ]),
          (row) => ({ ...row, counter_ids: split(row.counter_ids, ',') })
        )
      }
    case 'classic':
      return {
        date,
        rows: fields(
          'tierscore_top_hero_list',
          ['rank', 'champion_id', 'win_rate', 'pick_rate', 'ban_rate', 'tier', 'rank_change'],
          '|'
        )
      }
    case 'trend':
      return { date, rows: fields('history_strength_trend', ['version', 'win_rate']) }
    case 'matchups':
      return {
        date,
        favorable: fields('high_op_details', ['', 'champion_id', 'win_rate', 'advantage']),
        unfavorable: fields('low_op_details', ['', 'champion_id', 'win_rate', 'advantage'])
      }
    case 'synergies':
      return { date, rows: fields('data_details', ['', 'champion_id', 'win_rate', 'games']) }
    case 'spells':
      return {
        date,
        rows: fields('data_details', ['first_id', 'second_id', 'win_rate', 'pick_rate'])
      }
    case 'tiers':
      return { date, rows: fields('datadetails', ['tier_id', 'win_rate', 'pick_rate', 'ban_rate']) }
    case 'durations':
      return { date, rows: fields('data_details', ['range_id', 'win_rate', 'rank']) }
    case 'build': {
      const slots = Object.fromEntries(
        ['starting', 'shoes', 'core', 'forth', 'fifth', 'sixth'].map((slot) => [
          slot,
          map(fields(`${slot}_details`, buildColumns), (row) => ({
            ...row,
            item_ids: split(row.item_ids, ',')
          }))
        ])
      )
      return { date, ...slots }
    }
    case 'runes':
      return {
        date,
        rows: map(
          records(
            payload.rune_top_details ?? payload.top_details ?? payload.rune_details,
            '#',
            '_',
            ['rank', 'keystone_id', 'secondary_style', 'rune_ids', 'pick_rate', 'win_rate', 'games']
          ),
          (row) => ({ ...row, rune_ids: split(row.rune_ids, ',') })
        )
      }
    case 'positions': {
      const entries = split(payload.data_details ?? payload.lane_details ?? payload.details, '#')
      return {
        date,
        rows: Array.isArray(entries)
          ? entries.map((entry) => {
              const text = String(entry)
              const colon = text.includes('：') ? text.indexOf('：') : text.indexOf(':')
              const parts = text
                .slice(colon + 1)
                .trim()
                .split('_')
              const lane = colon < 0 ? parts.shift() : text.slice(0, colon)

              return {
                lane,
                pick_rate: parts[0],
                win_rate: parts[1],
                ban_rate: parts[2],
                tier: parts[3],
                rank: parts.length >= 7 && parts[4] === '0' ? parts[5] : parts[4],
                share: parts.length >= 7 ? parts[6] : parts[5]
              }
            })
          : entries
      }
    }
    case 'aram':
    case 'mayhem':
      return {
        rows: map(
          fields(
            'listcollect',
            [
              'champion_id',
              'rank',
              'rank_change',
              'win_rate',
              'pick_rate',
              'partners',
              'death_time',
              'participation',
              'damage_share',
              'taken_share',
              'augment_ids'
            ],
            '_',
            /[#|]/
          ),
          (row) => ({
            ...row,
            partners: records(row.partners, '&', ',', [
              'champion_id',
              'pick_rate',
              'win_rate',
              'rank'
            ]),
            augment_ids: split(row.augment_ids, ',')
          })
        )
      }
    case 'augments':
      return {
        date,
        rows: map(
          fields(
            'augmentlist',
            [
              'augment_id',
              'quality',
              'pick_rate',
              'pick_rank',
              'pick_change',
              'win_rate',
              'win_rank',
              'win_change',
              'champion_ids'
            ],
            '_',
            /[#|]/
          ),
          (row) => ({ ...row, champion_ids: split(row.champion_ids, ',') })
        )
      }
    case 'pairs':
      return {
        date,
        rows: map(
          fields('championid_data', ['champion_ids', '', 'win_rate', 'pick_rate', 'rank'], '|'),
          (row) => ({ ...row, champion_ids: split(row.champion_ids, ';') })
        )
      }
    case 'lanes':
      return {
        date,
        rows: map(fields('hero_lane_list', ['champion_id', 'lanes']), (row) => ({
          ...row,
          lanes: split(row.lanes, ';')
        }))
      }
    case 'skills': {
      const groups = split(payload.detaildetails, '$')
      return {
        date,
        rows: Array.isArray(groups)
          ? groups.map((group) => {
              const [header, ...details] = String(group).split('@')
              const [abilities, pickRate, winRate] = header.split(':')

              return {
                abilities: split(abilities, ','),
                pick_rate: pickRate,
                win_rate: winRate,
                builds: details.map((detail) => {
                  const [order, pick, win] = detail.split('_')
                  return {
                    abilities: split(order, ','),
                    pick_rate: pick ?? pickRate,
                    win_rate: win ?? winRate
                  }
                })
              }
            })
          : groups
      }
    }
    case 'jungle': {
      const groups = split(payload.data_details, '$')
      return {
        date,
        rows: Array.isArray(groups)
          ? groups.map((group) => {
              const match = /^([^*]+)\*(100|200):\[(.*)\]$/.exec(String(group))
              if (!match) {
                decoder.issue('jungle.group', 'Malformed route group; skipping group')
                return null
              }

              return {
                starting_camp: match[1],
                team_id: match[2],
                routes: map(
                  records(match[3], '#', '_', ['rank', 'camps', 'games', 'pick_rate', 'win_rate']),
                  (row) => ({ ...row, camps: split(row.camps, ',') })
                )
              }
            })
          : groups
      }
    }
    case 'mayhemDetails': {
      const augments = (value: unknown): unknown => {
        const groups = split(value, '&')
        if (!Array.isArray(groups)) {
          return groups
        }

        return groups.flatMap((group) => {
          const text = String(group)
          const colon = text.indexOf(':')
          const quality = colon < 0 ? '255' : text.slice(0, colon)
          const rows = records(text.slice(colon + 1), '#', '|', [
            'rank',
            'champion_id',
            'augment_id',
            '',
            'pick_rate',
            'grade'
          ]) as Record<string, unknown>[]

          return rows.map((row) => ({ ...row, quality }))
        })
      }

      const nested = (value: unknown, field: string): unknown => {
        const parsed = json(value, field)
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          return parsed
        }

        return Object.entries(parsed).map(([rank, entry]) => ({ ...record(entry), rank }))
      }

      const items = (key: string) =>
        map(nested(payload[`${key}_json`], key), (row) => ({
          rank: row.rank,
          item_ids: split(row[key], '&'),
          win_rate: row.winrate,
          pick_rate: row.showrate
        }))

      return {
        date,
        augments: augments(payload.augment_json_irank),
        quality_augments: augments(payload.augment_json),
        starting: map(
          records(payload.itemout, '#', '$', ['item_ids', 'pick_rate', 'win_rate']),
          (row) => ({ ...row, item_ids: split(row.item_ids, ',') })
        ),
        boots: map(
          records(payload.itemshoes, '#', '$', ['item_ids', 'pick_rate', 'win_rate']),
          (row) => ({ ...row, item_ids: split(row.item_ids, ',') })
        ),
        items: items('itemone'),
        core: items('itemcore'),
        builds: map(
          records(payload.itemover_rec, ';', '_', ['rank', 'item_ids', 'pick_rate', 'win_rate']),
          (row) => ({ ...row, item_ids: split(row.item_ids, ',') })
        ),
        partners: fields('championid_json', ['champion_id', 'win_rate', 'pick_rate', 'rank'], '|'),
        skills: map(nested(payload.skill_json, 'skill_json'), (row) => ({
          rank: row.rank,
          abilities: split(row.qwe, '&'),
          pick_rate: row.qwe_s,
          win_rate: row.qwe_w,
          plans: map(nested(row.sks, 'skill.plans'), (plan) => ({
            rank: plan.rank,
            abilities: split(plan.sk, '&'),
            pick_rate: plan.sk_s,
            win_rate: plan.sk_w
          }))
        }))
      }
    }
  }
}
