import braveryIcon from '@renderer-shared/assets/champions/bravery-circle.png'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useExtraAssetsStore } from '@renderer-shared/shards/extra-assets/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'

import type {
  AugmentDisplayResource,
  GameResourceProviderValue,
  ItemInlineResource,
  MapNameContext
} from './types'

const AKARI_PREFIX = 'akari://'
const AKARI_LEAGUE_CLIENT_HOST = 'league-client'

function normalizeLcuPath(path: string) {
  const normalized = path.trim()
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

export function createAkariGameResourceProvider(): GameResourceProviderValue {
  const app = useAppCommonStore()
  const extra = useExtraAssetsStore()
  const leagueClient = useLeagueClientStore()

  const assets = {
    resolve(source: string) {
      const normalizedSource = source.trim()

      if (!normalizedSource) {
        return null
      }

      if (normalizedSource.startsWith(AKARI_PREFIX)) {
        let url: URL

        try {
          url = new URL(normalizedSource)
        } catch {
          return null
        }

        if (url.host !== AKARI_LEAGUE_CLIENT_HOST) {
          return null
        }

        if (!leagueClient.isConnected) {
          return null
        }

        return `akari://league-client${normalizeLcuPath(`${url.pathname}${url.search}${url.hash}`)}`
      }

      if (normalizedSource.startsWith('/')) {
        if (!leagueClient.isConnected) {
          return null
        }

        return `akari://league-client${normalizeLcuPath(normalizedSource)}`
      }

      return normalizedSource
    }
  }

  const itemInline = (id: number): ItemInlineResource | null => {
    const item = leagueClient.gameData.items[id]

    if (!item?.name || !item.iconPath) {
      return null
    }

    return {
      id,
      name: item.name,
      iconPath: item.iconPath
    }
  }

  const augmentTooltipHtml = (id: number) => {
    if (app.settings.locale !== 'zh-CN') {
      return undefined
    }

    return extra.kiwiAugmentsMap?.[id]?.tooltip || undefined
  }

  return {
    runtime: {
      get locale() {
        return app.settings.locale
      },
      get colorMode() {
        return app.colorTheme
      }
    },

    assets,

    champions: {
      name(id: number) {
        return leagueClient.gameData.champions[id]?.name || id.toString()
      },
      icon(id: number) {
        if (id === -3) {
          return {
            id,
            iconPath: braveryIcon,
            source: 'url',
            variant: 'bravery'
          }
        }

        return {
          id,
          iconPath: `/lol-game-data/assets/v1/champion-icons/${id}.png`,
          source: 'lcu',
          variant: id === -1 ? 'unknown' : 'default'
        }
      }
    },

    queues: {
      name(id: number) {
        return leagueClient.gameData.queues[id]?.name || id.toString()
      }
    },

    maps: {
      name(id: number, context?: MapNameContext) {
        const mutators = leagueClient.gameData.gameModeMutators[id]

        if (!mutators) {
          return leagueClient.gameData.maps[id]?.name || id.toString()
        }

        const mutator = mutators.Mutators.find((m) =>
          context?.gameModeMutators?.some(
            (g) => m.Mutator.ExpandedMutator.toLowerCase() === g.toLowerCase()
          )
        )

        return mutator?.MapNameOverride || mutators.MapNameBase
      }
    },

    items: {
      display(id: number) {
        const item = leagueClient.gameData.items[id]

        if (!item?.name || !item.iconPath || typeof item.description !== 'string') {
          return null
        }

        return {
          id,
          name: item.name,
          iconPath: item.iconPath,
          descriptionHtml: item.description,
          price: item.price,
          totalPrice: item.priceTotal,
          from: item.from.map(itemInline).filter((v) => v !== null),
          to: item.to.map(itemInline).filter((v) => v !== null)
        }
      }
    },

    perks: {
      name(id: number) {
        return leagueClient.gameData.perks[id]?.name || id.toString()
      },
      display(id: number) {
        const perk = leagueClient.gameData.perks[id]

        if (!perk?.name || !perk.iconPath || typeof perk.longDesc !== 'string') {
          return null
        }

        return {
          id,
          name: perk.name,
          iconPath: perk.iconPath,
          longDescriptionHtml: perk.longDesc,
          endOfGameStatDescriptions: perk.endOfGameStatDescs || []
        }
      }
    },

    perkStyles: {
      display(id: number) {
        const style = leagueClient.gameData.perkstyles.styles[id]

        if (!style?.name || !style.iconPath || typeof style.tooltip !== 'string') {
          return null
        }

        return {
          id,
          name: style.name,
          iconPath: style.iconPath,
          tooltip: style.tooltip
        }
      }
    },

    summonerSpells: {
      name(id: number) {
        return leagueClient.gameData.summonerSpells[id]?.name || id.toString()
      },
      display(id: number) {
        const spell = leagueClient.gameData.summonerSpells[id]

        if (!spell?.name || !spell.iconPath || typeof spell.description !== 'string') {
          return null
        }

        return {
          id,
          name: spell.name,
          iconPath: spell.iconPath,
          description: spell.description,
          cooldown: spell.cooldown,
          summonerLevel: spell.summonerLevel
        }
      }
    },

    augments: {
      name(id: number) {
        return leagueClient.gameData.augments[id]?.nameTRA || id.toString()
      },
      display(id: number): AugmentDisplayResource | null {
        const augment = leagueClient.gameData.augments[id]

        if (!augment?.nameTRA || !augment.augmentSmallIconPath || !augment.rarity) {
          return null
        }

        return {
          id,
          name: augment.nameTRA,
          iconPath: augment.augmentSmallIconPath,
          rarity: augment.rarity,
          tooltipHtml: augmentTooltipHtml(id)
        }
      }
    }
  }
}
