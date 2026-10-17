import { z } from 'zod'

import { ResponseParser } from '../response-parser'
import { normalizeGuideDescription } from './description'

export interface GtimgGuideResource {
  id: number
  name: string
  iconPath: string
  description: string
}

export interface GtimgGuideItem extends GtimgGuideResource {
  price: number
  totalPrice: number
  from: number[]
  to: number[]
}

export interface GtimgGuideSpell extends GtimgGuideResource {
  cooldown: number
  summonerLevel: number
}

export interface GtimgGuideCatalogs {
  items: Record<number, GtimgGuideItem>
  perks: Record<number, GtimgGuideResource>
  spells: Record<number, GtimgGuideSpell>
}

export type GtimgGuideCatalog = {
  [K in keyof GtimgGuideCatalogs]: { kind: K; entries: GtimgGuideCatalogs[K] }
}[keyof GtimgGuideCatalogs]

const parser = new ResponseParser()
const id = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() ? Number(v) : v),
  z.number().int().positive()
)
function text(path: string) {
  return parser.recover(z.string(), '', path)
}

function number(path: string) {
  return parser.convert(
    z.number().nonnegative(),
    (v) => (typeof v === 'string' && v.trim() ? Number(v) : v),
    0,
    path
  )
}

const recordSchema = parser.recover(z.record(z.string(), z.unknown()), {}, 'catalog')
const runeRecordSchema = parser.recover(z.record(z.string(), z.unknown()), {}, 'rune')
const spellRecordSchema = parser.recover(z.record(z.string(), z.unknown()), {}, 'summonerskill')
const itemRows = parser.array(
  z.object({
    itemId: id,
    name: text('name'),
    iconPath: text('iconPath'),
    description: text('description'),
    price: number('price'),
    total: number('total'),
    from: parser.array(id, 'from'),
    into: parser.array(id, 'into')
  }),
  'items'
)
const spellRows = parser.array(
  z.object({
    id,
    name: text('name'),
    icon: text('icon'),
    description: text('description'),
    cooldown: number('cooldown'),
    summonerlevel: number('summonerlevel')
  }),
  'spells'
)
const perkRows = parser.array(
  z.object({
    id,
    name: text('name'),
    icon: text('icon'),
    longdesc: text('longdesc'),
    tooltip: text('tooltip')
  }),
  'perks'
)

export function parseGtimgGuideCatalog(kind: keyof GtimgGuideCatalogs, input: unknown) {
  return parser.parse((): GtimgGuideCatalog => {
    const record = recordSchema.parse(input)
    if (kind === 'items') {
      const rows = itemRows.parse(record.items)
      return {
        kind,
        entries: Object.fromEntries(
          rows.map((r) => [
            r.itemId,
            {
              id: r.itemId,
              name: r.name,
              iconPath: r.iconPath,
              description: normalizeGuideDescription(r.description),
              price: r.price,
              totalPrice: r.total,
              from: r.from,
              to: r.into
            }
          ])
        )
      }
    }

    const entries =
      kind === 'perks'
        ? runeRecordSchema.parse(record.rune)
        : spellRecordSchema.parse(record.summonerskill)
    if (kind === 'spells') {
      const rows = spellRows.parse(
        Object.entries(entries).map(([id, value]) => ({ ...asRecord(value), id }))
      )
      return {
        kind,
        entries: Object.fromEntries(
          rows.map((r) => [
            r.id,
            {
              id: r.id,
              name: r.name,
              iconPath: r.icon,
              description: r.description,
              cooldown: r.cooldown,
              summonerLevel: r.summonerlevel
            }
          ])
        )
      }
    }

    const rows = perkRows.parse(collectRuneRows(entries))
    return {
      kind,
      entries: Object.fromEntries(
        rows.map((r) => [
          r.id,
          {
            id: r.id,
            name: r.name,
            iconPath: r.icon,
            description: normalizeGuideDescription(r.longdesc || r.tooltip)
          }
        ])
      )
    }
  })
}

function collectRuneRows(entries: Record<string, unknown>) {
  const rows: unknown[] = []
  const visit = (value: unknown, depth: number) => {
    if (depth > 8) {
      parser.issue('rune.childs', 'Rune tree is too deep')
      return
    }

    if (Array.isArray(value)) {
      value.forEach((v) => visit(asRecord(v).childs, depth + 1))
      return
    }

    for (const [key, entry] of Object.entries(asRecord(value))) {
      rows.push({ ...asRecord(entry), id: key })
      if (asRecord(entry).childs) visit(asRecord(entry).childs, depth + 1)
    }
  }

  visit(entries, 0)
  return rows
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}
