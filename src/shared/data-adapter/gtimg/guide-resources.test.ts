import { describe, expect, it } from 'vitest'

import { parseGtimgGuideCatalog } from './guide-resources'

describe('QQ101 guide catalogs', () => {
  it('normalizes escaped League tooltip markup without forwarding executable attributes', () => {
    const catalog = parseGtimgGuideCatalog('perks', {
      rune: {
        5008: {
          name: '适应之力',
          icon: 'https://example.com/rune.png',
          tooltip: '',
          longdesc: String.raw`+9 &lt;lol-uikit-tooltipped-keyword key=\\\'LinkTooltip_Description_Adaptive\\\'&gt;适应之力&lt;/lol-uikit-tooltipped-keyword&gt;&lt;br&gt;<attention onclick="bad()">伤害</attention><img src=x onerror="bad()">`
        }
      }
    })
    expect(catalog.data.entries[5008].description).toBe(
      '+9 适应之力<br><attention>伤害</attention>'
    )
  })

  it('keeps mode-specific item IDs and isolates malformed catalog entries', () => {
    const catalog = parseGtimgGuideCatalog('items', {
      items: [
        {
          itemId: '228002',
          name: 'Mode item',
          iconPath: 'https://example.com/item.png',
          description: '',
          price: 'NC',
          total: '3000',
          from: [],
          into: [],
          unused: true
        },
        { itemId: 'broken' }
      ]
    })
    expect(catalog.data.kind).toBe('items')
    expect(Object.keys(catalog.data.entries)).toEqual(['228002'])
    expect(catalog.data.entries[228002]).toMatchObject({ id: 228002, price: 0, totalPrice: 3000 })
    expect(catalog.data.entries[228002]).not.toHaveProperty('unused')
    expect(catalog.issues.length).toBeGreaterThan(0)
  })

  it('loads rune styles, nested runes and stat shards for browsing without LCU', () => {
    const rune = (name: string) => ({
      name,
      icon: 'https://example.com/rune.png',
      longdesc: '',
      tooltip: 'Description',
      childs: []
    })

    const catalog = parseGtimgGuideCatalog('perks', {
      rune: {
        5008: rune('Adaptive force'),
        8200: {
          ...rune('Sorcery'),
          childs: [{ name: 'Keystone', childs: { 8992: rune('Deathfire') } }]
        }
      }
    })
    expect(Object.keys(catalog.data.entries)).toEqual(['5008', '8200', '8992'])
    expect(catalog.data.entries[8992].description).toBe('Description')
  })
})
