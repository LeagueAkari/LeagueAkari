import type {
  AkariResourceProviderValue,
  ColorMode
} from '@renderer-shared/providers/akari-resource'

import type { LanWebApiClient } from './api'
import { queueName } from './format'

export function createLanWebResourceProvider(
  api: LanWebApiClient,
  runtime: { locale: () => string; colorMode: () => ColorMode }
): AkariResourceProviderValue {
  return {
    runtime: {
      get locale() {
        return runtime.locale()
      },
      get colorMode() {
        return runtime.colorMode()
      }
    },
    assets: {
      resolve(source) {
        const normalized = source.trim()
        return normalized.startsWith('/api/v1/assets/') || normalized.startsWith('data:')
          ? normalized
          : null
      }
    },
    champions: {
      name: (id) => id.toString(),
      icon: (id) =>
        id > 0
          ? {
              id,
              iconPath: api.assetUrl('champion', id),
              source: 'url',
              variant: 'default'
            }
          : null,
      searchKeywords: () => [],
      aramBalance: () => null
    },
    queues: {
      name: (id) => queueName(id, id.toString())
    },
    maps: {
      name: (id) => id.toString()
    },
    items: {
      display: (id) => ({
        id,
        name: id.toString(),
        iconPath: api.assetUrl('item', id),
        descriptionHtml: '',
        price: 0,
        totalPrice: 0,
        from: [],
        to: []
      })
    },
    perks: {
      name: (id) => id.toString(),
      display: (id) => ({
        id,
        name: id.toString(),
        iconPath: api.assetUrl('perk', id),
        longDescriptionHtml: '',
        endOfGameStatDescriptions: []
      })
    },
    perkStyles: {
      display: (id) => ({
        id,
        name: id.toString(),
        iconPath: api.assetUrl('perk-style', id),
        tooltip: ''
      })
    },
    summonerSpells: {
      name: (id) => id.toString(),
      display: (id) => ({
        id,
        name: id.toString(),
        iconPath: api.assetUrl('summoner-spell', id),
        description: '',
        cooldown: 0,
        summonerLevel: 0
      })
    },
    augments: {
      name: (id) => id.toString(),
      display: (id) => ({
        id,
        name: id.toString(),
        iconPath: api.assetUrl('augment', id),
        rarity: 'kSilver'
      })
    }
  }
}
