import braveryIcon from '@renderer-shared/assets/champions/bravery-circle.png?inline'
import { i18next } from '@renderer-shared/i18n'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useChampionDataStore } from '@renderer-shared/shards/champion-data/store'
import { useExtraAssetsStore } from '@renderer-shared/shards/extra-assets/store'
import { championBaseSplashUri } from '@renderer-shared/shards/league-client/game-data-assets'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { gtimgUrl } from '@shared/shards/extra-assets'
import { lcuUrl } from '@shared/shards/league-client'

import type {
  AkariResourceProviderValue,
  AugmentDisplayResource,
  AugmentRarity,
  ItemInlineResource,
  MapNameContext
} from './types'

const AKARI_PREFIX = 'akari://'
const AKARI_LEAGUE_CLIENT_HOST = 'league-client'
const PROTOCOL_RE = /^(?:https?:|image:|data:|blob:|file:|ftp:|mailto:|tel:|javascript:|about:)/

function normalizeLcuPath(path: string) {
  const normalized = path.trim()
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

export function createAkariResourceProvider(): AkariResourceProviderValue {
  const app = useAppCommonStore()
  const extra = useExtraAssetsStore()
  const championData = useChampionDataStore()
  const leagueClient = useLeagueClientStore()

  const assets = {
    resolve(source: string) {
      const normalizedSource = source.trim()

      if (!normalizedSource) {
        return null
      }

      if (!PROTOCOL_RE.test(normalizedSource)) {
        if (!leagueClient.isConnected) {
          return null
        }

        return `akari://league-client${normalizeLcuPath(normalizedSource)}`
      } else if (normalizedSource.startsWith(AKARI_PREFIX)) {
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
      roles(id: number) {
        return (
          extra.classicHeroesMap[id]?.roles ??
          extra.heroListMap[id]?.roles ??
          leagueClient.gameData.champions[id]?.roles ??
          []
        )
      },

      name(id: number) {
        if (id >= 60000) {
          return extra.classicHeroesMap[id]?.name ?? String(id)
        }
        if (id === -3) {
          return i18next.t('champions.bravery', { ns: 'common' })
        }

        if (id === -1) {
          return (
            leagueClient.gameData.champions[id]?.name ||
            i18next.t('champions.dummy', { ns: 'common' })
          )
        }

        return (
          leagueClient.gameData.champions[id]?.name || extra.heroListMap[id]?.name || id.toString()
        )
      },

      icon(id: number) {
        if (id >= 60000) {
          const hero = extra.classicHeroesMap[id]
          return hero ? { id, iconPath: hero.portrait } : null
        }
        if (id === -3) {
          return {
            id,
            iconPath: braveryIcon
          }
        }

        const gtimgHero = extra.heroListMap[id]

        if (!leagueClient.isConnected && gtimgHero?.alias) {
          return {
            id,
            iconPath: gtimgUrl.championIcon(gtimgHero.alias)
          }
        }

        return {
          id,
          iconPath: lcuUrl.championIcon(id)
        }
      },

      baseSplash(id: number) {
        const champion = leagueClient.gameData.champions[id]

        if (!champion) {
          return null
        }

        return championBaseSplashUri(champion.alias)
      },

      searchKeywords(id: number) {
        const classic = extra.classicHeroesMap[id]
        if (classic) {
          return [classic.name, classic.title, classic.alias, classic.baseAlias]
        }
        return extra.heroListMap[id]?.keywords.split(',') ?? []
      },

      aramBalance(id: number) {
        return championData.opggAramBalanceMap[id] ?? null
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
        const gtimgAugment = extra.kiwiAugmentsMap[id]
        return (
          leagueClient.gameData.augments[id]?.nameTRA ||
          gtimgAugment?.name_cn ||
          gtimgAugment?.name_en ||
          id.toString()
        )
      },
      display(id: number): AugmentDisplayResource | null {
        const augment = leagueClient.gameData.augments[id]
        const gtimgAugment = extra.kiwiAugmentsMap[id]

        if (augment?.nameTRA && augment.augmentSmallIconPath && augment.rarity) {
          return {
            id,
            name: augment.nameTRA,
            iconPath: augment.augmentSmallIconPath,
            rarity: augment.rarity,
            tooltipHtml: augmentTooltipHtml(id)
          }
        }

        if (!gtimgAugment?.name_cn || !gtimgAugment.small_Icon || !gtimgAugment.level) return null

        return {
          id,
          name: gtimgAugment.name_cn || gtimgAugment.name_en,
          iconPath: gtimgAugment.small_Icon,
          rarity: gtimgAugment.level as AugmentRarity,
          tooltipHtml:
            app.settings.locale === 'zh-CN' ? gtimgAugment.tooltip || undefined : undefined
        }
      }
    }
  }
}
