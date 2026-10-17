import { z } from 'zod'

import type { ResponseParser } from '../response-parser'

function numeric(input: unknown) {
  if (input === '' || input === null) {
    return null
  }

  return typeof input === 'string' && input.trim() !== '' ? Number(input) : input
}

/** Source units and names are preserved here. Mapping to Akari is a separate step. */
export function createQq101Schemas(decoder: ResponseParser) {
  const id = z.preprocess(numeric, z.number().int().positive())

  const value = <T extends z.ZodType>(schema: T, fallback: z.output<T>, path: string) =>
    decoder.recover(schema, fallback, path)

  const number = (path: string, schema: z.ZodNumber = z.number()) =>
    decoder.convert(
      schema.nullable(),
      (input) => (input === '-1' ? null : numeric(input)),
      null,
      path
    )

  const integer = (path: string) => number(path, z.number().int().nonnegative())

  const signed = (path: string) => decoder.convert(z.number().int().nullable(), numeric, null, path)

  const ratio = (path: string) => number(path, z.number().min(0).max(1))

  const percentage = (path: string) => number(path, z.number().min(0).max(100))

  const basisPoints = (path: string) => number(path, z.number().min(0).max(10000))

  const text = (path: string) => value(z.string(), '', path)

  const array = <T extends z.ZodType>(schema: T, path: string) => decoder.array(schema, path)

  const object = <T extends z.ZodRawShape>(shape: T, path: string) => decoder.object(shape, path)

  const date = value(z.string().optional(), '', 'date')
  const lane = z.enum(['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'SUPPORT'])
  const laneAliases: Record<string, string> = {
    JUG: 'JUNGLE',
    MID: 'MIDDLE',
    ADC: 'BOTTOM',
    BOT: 'BOTTOM',
    SUP: 'SUPPORT',
    上单: 'TOP',
    打野: 'JUNGLE',
    中单: 'MIDDLE',
    下路: 'BOTTOM',
    辅助: 'SUPPORT'
  }
  const position = z.preprocess((input) => {
    if (typeof input !== 'string') {
      return input
    }

    const upper = input.trim().toUpperCase()

    return laneAliases[upper] ?? upper
  }, lane)
  const abilities = z.preprocess(numeric, z.number().int().min(1).max(4))
  const ranked = z.object({
    rank: integer('rank'),
    champion_id: id,
    tier: text('tier'),
    lane: value(position.or(z.literal('NONE')), 'NONE', 'lane'),
    win_rate: percentage('win_rate'),
    pick_rate: percentage('pick_rate'),
    ban_rate: percentage('ban_rate'),
    counter_ids: array(id, 'counter_ids'),
    rank_change: signed('rank_change'),
    daily_surge: number('daily_surge'),
    is_hot: value(z.enum(['0', '1']), '0', 'is_hot')
  })
  const classic = z.object({
    rank: integer('rank'),
    champion_id: id,
    tier: text('tier'),
    win_rate: percentage('win_rate'),
    pick_rate: percentage('pick_rate'),
    ban_rate: percentage('ban_rate'),
    rank_change: signed('rank_change')
  })
  const matchup = z.object({
    champion_id: id,
    win_rate: percentage('win_rate'),
    advantage: decoder.convert(z.number().min(-100).max(100).nullable(), numeric, null, 'advantage')
  })
  const synergy = z.object({
    champion_id: id,
    win_rate: percentage('win_rate'),
    games: integer('games')
  })
  const spells = z.object({
    first_id: id,
    second_id: id,
    win_rate: percentage('win_rate'),
    pick_rate: percentage('pick_rate')
  })
  const build = z.object({
    item_ids: array(id, 'item_ids').refine((ids) => ids.length > 0),
    rank: integer('rank'),
    pick_rate: percentage('pick_rate'),
    win_rate: percentage('win_rate')
  })
  const rune = z.object({
    rank: integer('rank'),
    keystone_id: id,
    secondary_style: value(
      z.enum(['jm', 'zz', 'zj', 'ws', 'qd', 'jj']).nullable(),
      null,
      'secondary_style'
    ),
    rune_ids: z.array(id).length(9),
    pick_rate: percentage('pick_rate'),
    win_rate: percentage('win_rate'),
    games: integer('games')
  })
  const partner = z.object({
    champion_id: id,
    pick_rate: ratio('pick_rate'),
    win_rate: ratio('win_rate'),
    rank: integer('rank')
  })
  const aram = z.object({
    champion_id: id,
    rank: integer('rank'),
    rank_change: value(
      z.preprocess(
        (input) => (input === '' ? null : input),
        z
          .string()
          .regex(/^(未变化|上升\d+位?|下降\d+位?)$/)
          .refine(
            (value) => value === '未变化' || Number.isSafeInteger(Number(value.match(/\d+/)?.[0]))
          )
          .nullable()
      ),
      null,
      'rank_change'
    ),
    win_rate: ratio('win_rate'),
    pick_rate: ratio('pick_rate'),
    partners: array(partner, 'partners'),
    death_time: number('death_time'),
    participation: ratio('participation'),
    damage_share: ratio('damage_share'),
    taken_share: ratio('taken_share')
  })
  const augment = z.object({
    augment_id: id,
    quality: integer('quality'),
    pick_rate: ratio('pick_rate'),
    pick_rank: integer('pick_rank'),
    pick_change: signed('pick_change'),
    win_rate: ratio('win_rate'),
    win_rank: integer('win_rank'),
    win_change: signed('win_change'),
    champion_ids: array(id, 'champion_ids')
  })
  const abilityStats = z.object({
    abilities: array(abilities, 'abilities'),
    pick_rate: percentage('pick_rate'),
    win_rate: percentage('win_rate')
  })
  const route = z.object({
    rank: integer('rank'),
    camps: array(z.string().min(1), 'camps'),
    games: integer('games'),
    pick_rate: percentage('pick_rate'),
    win_rate: percentage('win_rate')
  })
  const mayhemItem = z.object({
    item_ids: array(id, 'item_ids').refine((ids) => ids.length > 0),
    pick_rate: ratio('pick_rate'),
    win_rate: ratio('win_rate')
  })
  const nestedItem = z.object({
    rank: integer('rank'),
    item_ids: array(id, 'item_ids').refine((ids) => ids.length > 0),
    pick_rate: basisPoints('pick_rate'),
    win_rate: basisPoints('win_rate')
  })
  const nestedSkill = z.object({
    rank: integer('rank'),
    abilities: array(abilities, 'abilities'),
    pick_rate: basisPoints('pick_rate'),
    win_rate: basisPoints('win_rate')
  })
  const heroAugment = z.object({
    rank: integer('rank'),
    champion_id: id,
    augment_id: id,
    quality: value(z.enum(['255', 'kSilver', 'kGold', 'kPrismatic']).nullable(), null, 'quality'),
    pick_rate: ratio('pick_rate'),
    grade: value(z.string().optional(), '', 'grade')
  })

  return {
    patches: object({ data: array(z.object({ id, name: z.string().min(1) }), 'data') }, 'patches'),
    ranked: object({ date, rows: array(ranked, 'rows') }, 'ranked'),
    classic: object({ date, rows: array(classic, 'rows') }, 'classic'),
    trend: object(
      {
        date,
        rows: array(
          z.object({ version: z.string().min(1), win_rate: percentage('win_rate') }),
          'rows'
        )
      },
      'trend'
    ),
    matchups: object(
      { date, favorable: array(matchup, 'favorable'), unfavorable: array(matchup, 'unfavorable') },
      'matchups'
    ),
    synergies: object({ date, rows: array(synergy, 'rows') }, 'synergies'),
    spells: object({ date, rows: array(spells, 'rows') }, 'spells'),
    skills: object(
      { date, rows: array(abilityStats.extend({ builds: array(abilityStats, 'builds') }), 'rows') },
      'skills'
    ),
    tiers: object(
      {
        date,
        rows: array(
          z.object({
            tier_id: id,
            win_rate: percentage('win_rate'),
            pick_rate: percentage('pick_rate'),
            ban_rate: percentage('ban_rate')
          }),
          'rows'
        )
      },
      'tiers'
    ),
    build: object(
      {
        date,
        starting: array(build, 'starting'),
        shoes: array(build, 'shoes'),
        core: array(build, 'core'),
        forth: array(build, 'forth'),
        fifth: array(build, 'fifth'),
        sixth: array(build, 'sixth')
      },
      'build'
    ),
    runes: object({ date, rows: array(rune, 'rows') }, 'runes'),
    positions: object(
      {
        date,
        rows: array(
          z.object({
            lane: position,
            pick_rate: percentage('pick_rate'),
            win_rate: percentage('win_rate'),
            ban_rate: percentage('ban_rate'),
            tier: text('tier'),
            rank: integer('rank'),
            share: percentage('share')
          }),
          'rows'
        )
      },
      'positions'
    ),
    durations: object(
      {
        date,
        rows: array(
          z.object({ range_id: id, win_rate: percentage('win_rate'), rank: integer('rank') }),
          'rows'
        )
      },
      'durations'
    ),
    aram: object({ rows: array(aram, 'rows') }, 'aram'),
    mayhem: object(
      { rows: array(aram.extend({ augment_ids: array(id, 'augment_ids') }), 'rows') },
      'mayhem'
    ),
    augments: object({ date, rows: array(augment, 'rows') }, 'augments'),
    pairs: object(
      {
        date,
        rows: array(
          z.object({
            champion_ids: z.array(id).length(2),
            win_rate: ratio('win_rate'),
            pick_rate: ratio('pick_rate'),
            rank: integer('rank')
          }),
          'rows'
        )
      },
      'pairs'
    ),
    lanes: object(
      {
        date,
        rows: array(
          z.object({
            champion_id: id,
            lanes: array(z.enum(['top', 'jungle', 'middle', 'bottom', 'support']), 'lanes')
          }),
          'rows'
        )
      },
      'lanes'
    ),
    jungle: object(
      {
        date,
        rows: array(
          z.object({
            starting_camp: text('starting_camp'),
            team_id: z.preprocess(numeric, z.union([z.literal(100), z.literal(200)])),
            routes: array(route, 'routes')
          }),
          'rows'
        )
      },
      'jungle'
    ),
    mayhemDetails: object(
      {
        date,
        augments: array(heroAugment, 'augments'),
        quality_augments: array(heroAugment, 'quality_augments'),
        starting: array(mayhemItem, 'starting'),
        boots: array(mayhemItem, 'boots'),
        items: array(nestedItem, 'items'),
        core: array(nestedItem, 'core'),
        builds: array(mayhemItem.extend({ rank: integer('rank') }), 'builds'),
        partners: array(partner, 'partners'),
        skills: array(nestedSkill.extend({ plans: array(nestedSkill, 'plans') }), 'skills')
      },
      'mayhemDetails'
    )
  }
}

export type Qq101Schemas = ReturnType<typeof createQq101Schemas>

export type Qq101Validated<K extends keyof Qq101Schemas> = z.output<Qq101Schemas[K]>
