import type { GtimgGuideResponses } from '@shared/data-sources/gtimg/responses'

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

export function parseGtimgGuideCatalog(
  kind: keyof GtimgGuideResponses,
  input: GtimgGuideResponses[keyof GtimgGuideResponses]
): GtimgGuideCatalog {
  if (kind === 'items') {
    const { items } = input as GtimgGuideResponses['items']

    return {
      kind,
      entries: Object.fromEntries(
        items.map((item) => [
          Number(item.itemId),
          {
            id: Number(item.itemId),
            name: item.name,
            iconPath: item.iconPath,
            description: normalizeGuideDescription(item.description),
            price: Number(item.price),
            totalPrice: Number(item.total),
            from: item.from.map(Number),
            to: item.into.map(Number)
          }
        ])
      )
    }
  }

  if (kind === 'spells') {
    const { summonerskill } = input as GtimgGuideResponses['spells']

    return {
      kind,
      entries: Object.fromEntries(
        Object.entries(summonerskill).map(([id, spell]) => [
          Number(id),
          {
            id: Number(id),
            name: spell.name,
            iconPath: spell.icon,
            description: spell.description,
            cooldown: Number(spell.cooldown),
            summonerLevel: Number(spell.summonerlevel)
          }
        ])
      )
    }
  }

  const { rune } = input as GtimgGuideResponses['perks']
  const rows = Object.entries(rune).flatMap(([id, style]) => [
    [id, style] as const,
    ...(style.childs ?? []).flatMap((slot) => Object.entries(slot.childs))
  ])

  return {
    kind,
    entries: Object.fromEntries(
      rows.map(([id, perk]) => [
        Number(id),
        {
          id: Number(id),
          name: perk.name,
          iconPath: perk.icon,
          description: normalizeGuideDescription(perk.longdesc || perk.tooltip)
        }
      ])
    )
  }
}
