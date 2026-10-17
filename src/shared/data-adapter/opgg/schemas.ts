import { z } from 'zod'

import type { ResponseParser } from '../response-parser'

const id = z.number().int().positive()
const count = z.number().int().nonnegative()
const rate = z.number().min(0).max(1)
const skill = z.enum(['Q', 'W', 'E', 'R', 'R-Q', 'R-W', 'R-E', 'R-R'])

/** Only fields consumed by Akari belong here; z.object strips upstream additions. */
export function createOpggSchemas(decoder: ResponseParser) {
  const value = <T extends z.ZodType>(schema: T, fallback: z.output<T>, path: string) =>
    decoder.recover(schema, fallback, path)

  const object = <T extends z.ZodRawShape>(shape: T, path: string) => decoder.object(shape, path)

  const array = <T extends z.ZodType>(schema: T, path: string) => decoder.array(schema, path)

  const nullableRate = (path: string) => value(rate.nullable(), null, path)

  const nullableCount = (path: string) => value(count.nullable(), null, path)

  const ranking = (path: string) => value(id.nullable(), null, path)

  const stats = (path: string) => ({
    play: value(count, 0, `${path}.play`),
    win: nullableCount(`${path}.win`),
    pick_rate: value(rate, 0, `${path}.pick_rate`)
  })

  const arenaStats = (path: string) => ({
    ...stats(path),
    total_place: nullableCount(`${path}.total_place`),
    first_place: nullableCount(`${path}.first_place`)
  })

  const counter = object(
    {
      champion_id: id,
      play: value(count, 0, 'counter.play'),
      win: nullableCount('counter.win')
    },
    'counter'
  )
  const position = object(
    {
      name: z.enum(['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']),
      stats: object(
        {
          play: nullableCount('position.stats.play'),
          win_rate: nullableRate('position.stats.win_rate'),
          pick_rate: nullableRate('position.stats.pick_rate'),
          ban_rate: nullableRate('position.stats.ban_rate'),
          tier_data: object(
            { rank: ranking('position.rank'), tier: nullableCount('position.tier') },
            'position.tier_data'
          )
        },
        'position.stats'
      ),
      counters: array(counter, 'position.counters')
    },
    'position'
  )
  const average = object(
    {
      rank: ranking('average_stats.rank'),
      tier: nullableCount('average_stats.tier'),
      play: nullableCount('average_stats.play'),
      win_rate: nullableRate('average_stats.win_rate'),
      pick_rate: nullableRate('average_stats.pick_rate'),
      ban_rate: nullableRate('average_stats.ban_rate')
    },
    'average_stats'
  )
  const arenaAverage = object(
    {
      ...arenaStats('average_stats'),
      rank: ranking('average_stats.rank'),
      tier: nullableCount('average_stats.tier'),
      ban_rate: nullableRate('average_stats.ban_rate')
    },
    'average_stats'
  )
  const winRateChampion = {
    id,
    average_stats: value(average.nullable(), null, 'average_stats')
  }
  const ranked = object({ ...winRateChampion, positions: array(position, 'positions') }, 'champion')
  const winRate = object(winRateChampion, 'champion')
  const arena = object(
    { id, average_stats: value(arenaAverage.nullable(), null, 'average_stats') },
    'champion'
  )
  const item = object({ ...stats('item'), ids: z.array(id).min(1) }, 'item')
  const itemGroup = object(
    { depth: z.number().int().min(1).max(6), items: array(item, 'items') },
    'item_group'
  )
  const arenaItem = item
  const spells = object({ ...stats('spells'), ids: z.tuple([id, id]) }, 'spells')
  const runes = object(
    {
      ...stats('runes'),
      primary_page_id: id,
      secondary_page_id: id,
      primary_rune_ids: z.array(id).length(4),
      secondary_rune_ids: z.array(id).length(2),
      stat_mod_ids: z.array(id).length(3)
    },
    'runes'
  )
  const skillOrder = object({ order: z.array(skill).min(1) }, 'skill.build')
  const mastery = object(
    { ...stats('skill'), ids: z.array(skill).min(1), builds: array(skillOrder, 'skill.builds') },
    'skill'
  )
  const arenaMastery = object(
    {
      ...stats('skill'),
      ids: z.array(skill).min(1),
      builds: array(skillOrder, 'skill.builds')
    },
    'skill'
  )
  const details = {
    summoner_spells: array(spells, 'summoner_spells'),
    runes: array(runes, 'runes'),
    skill_masteries: array(mastery, 'skill_masteries'),
    starter_items: array(item, 'starter_items'),
    boots: array(item, 'boots'),
    core_items: array(item, 'core_items'),
    last_items: array(item, 'last_items'),
    counters: array(counter, 'counters')
  }
  const summaryId = value(id, 0, 'summary.id')
  const rankedSummary = object(
    { ...winRateChampion, id: summaryId, positions: array(position, 'summary.positions') },
    'summary'
  )
  const summary = object({ ...winRateChampion, id: summaryId }, 'summary')
  const arenaSummary = object(
    { id: summaryId, average_stats: value(arenaAverage.nullable(), null, 'summary.average_stats') },
    'summary'
  )
  const augment = object({ id, ...stats('augment') }, 'augment')
  const augmentGroup = object(
    {
      rarity: z.union([z.literal(1), z.literal(4), z.literal(8)]),
      augments: array(augment, 'augments')
    },
    'augment_group'
  )
  const synergy = object({ champion_id: id, ...arenaStats('synergy') }, 'synergy')
  const mayhemTier = object(
    { champion_id: id, rank: ranking('mayhem.rank'), tier: nullableCount('mayhem.tier') },
    'mayhem.tier'
  )
  const mayhemAugment = object(
    {
      id,
      tier: nullableCount('mayhem.augment.tier'),
      performance: value(z.number(), 0, 'mayhem.augment.performance'),
      popular: value(z.number().nonnegative(), 0, 'mayhem.augment.popular')
    },
    'mayhem.augment'
  )
  const balance = object(
    {
      champion_id: id,
      attack_speed: value(z.number(), 100, 'balance.attack_speed'),
      damage_dealt: value(z.number(), 100, 'balance.damage_dealt'),
      damage_taken: value(z.number(), 100, 'balance.damage_taken'),
      cooldown_reduction: value(z.number(), 0, 'balance.cooldown_reduction'),
      healing: value(z.number(), 100, 'balance.healing'),
      tenacity: value(z.number(), 0, 'balance.tenacity'),
      shield_amount: value(z.number(), 100, 'balance.shield_amount'),
      energy_regen: value(z.number(), 100, 'balance.energy_regen'),
      area_of_effect_damage: value(z.number(), 100, 'balance.area_of_effect_damage')
    },
    'balance'
  )

  return {
    rankedOverview: object({ data: array(ranked, 'data') }, 'response'),
    winRateOverview: object({ data: array(winRate, 'data') }, 'response'),
    arenaOverview: object({ data: array(arena, 'data') }, 'response'),
    rankedCounters: object({ data: array(counter, 'data') }, 'response'),
    rankedDetails: object(
      {
        data: object(
          {
            summary: rankedSummary,
            ...details,
            single_items: array(itemGroup, 'single_items').optional().default([]),
            combination_items: array(itemGroup, 'combination_items').optional().default([])
          },
          'data'
        )
      },
      'response'
    ),
    winRateDetails: object({ data: object({ summary, ...details }, 'data') }, 'response'),
    arenaDetails: object(
      {
        data: object(
          {
            summary: arenaSummary,
            skill_masteries: array(arenaMastery, 'skill_masteries'),
            starter_items: array(arenaItem, 'starter_items'),
            boots: array(arenaItem, 'boots'),
            prism_items: array(arenaItem, 'prism_items'),
            core_items: array(arenaItem, 'core_items'),
            last_items: array(arenaItem, 'last_items'),
            augment_group: array(augmentGroup, 'augment_group'),
            synergies: array(synergy, 'synergies')
          },
          'data'
        )
      },
      'response'
    ),
    versions: object({ data: array(z.string().min(1), 'data') }, 'response'),
    balance: object({ data: array(balance, 'data') }, 'response'),
    mayhemTiers: object({ data: array(mayhemTier, 'data') }, 'response'),
    mayhemAugments: object({ data: array(mayhemAugment, 'data') }, 'response')
  }
}

export type OpggSchemas = ReturnType<typeof createOpggSchemas>

export type OpggDecodedResponse<K extends keyof OpggSchemas> = z.output<OpggSchemas[K]>

export type OpggDecodedRankedChampion = OpggDecodedResponse<'rankedOverview'>['data'][number]

export type OpggDecodedArenaChampion = OpggDecodedResponse<'arenaOverview'>['data'][number]

export type OpggDecodedDetails = OpggDecodedResponse<'winRateDetails'>['data']

export type OpggDecodedCounter = OpggDecodedDetails['counters'][number]

export type OpggDecodedItem = OpggDecodedDetails['core_items'][number]

export type OpggDecodedBalance = OpggDecodedResponse<'balance'>['data'][number]
