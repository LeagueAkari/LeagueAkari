import { Level } from '@shared/data-sources/gtimg/types'
import { z } from 'zod'

import { ResponseParser } from '../response-parser'

const parser = new ResponseParser()
const id = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() ? Number(value) : value),
  z.number().int().positive()
)
function text(path: string) {
  return parser.recover(z.string(), '', path)
}

const hero = z.object({
  heroId: id,
  name: text('name'),
  title: text('title'),
  alias: text('alias'),
  roles: parser.array(
    z.enum(['fighter', 'tank', 'mage', 'assassin', 'support', 'marksman']),
    'roles'
  )
})
const heroRows = parser.array(hero.extend({ keywords: text('keywords') }), 'hero')
const heroListSchema = z.object({
  hero: z.array(z.unknown()).transform((rows) => heroRows.parse(rows)),
  version: text('version'),
  fileName: text('fileName'),
  fileTime: text('fileTime')
})
const classicHeroRows = parser.array(
  hero.extend({ baseAlias: text('baseAlias'), portrait: text('portrait') }),
  'heroes'
)
const classicHeroesSchema = z.object({
  heroes: z.array(z.unknown()).transform((rows) => classicHeroRows.parse(rows))
})
const augmentRows = parser.array(
  z.object({
    augmentID: id,
    name_en: text('name_en'),
    name_cn: text('name_cn'),
    level: parser.recover(z.enum(Level).nullable(), null, 'level'),
    desc: text('desc'),
    tooltip: text('tooltip'),
    large_Icon: text('large_Icon'),
    small_Icon: text('small_Icon')
  }),
  'augments'
)
const kiwiAugmentsSchema = z.array(z.unknown()).transform((rows) => augmentRows.parse(rows))

export function parseGtimgHeroList(input: unknown) {
  return parser.parse(() => parser.nullable(heroListSchema, input))
}

export function parseGtimgClassicHeroes(input: unknown) {
  return parser.parse(() => parser.nullable(classicHeroesSchema, input)?.heroes ?? null)
}

export function parseGtimgKiwiAugments(input: unknown) {
  return parser.parse(() => parser.nullable(kiwiAugmentsSchema, input))
}
