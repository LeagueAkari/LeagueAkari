import braveryIcon from '@renderer-shared/assets/champions/bravery-circle.png'
import type {
  Augment,
  ChampionSimple,
  GameMap,
  GameModeMutator,
  Item,
  Perk,
  Queue,
  Style,
  SummonerSpell
} from '@shared/types/league-client/game-data'
import { type MaybeRefOrGetter, shallowRef, toValue, watchEffect } from 'vue'

import type {
  AugmentDisplayResource,
  ColorMode,
  GameResourceProviderValue,
  ItemInlineResource,
  MapNameContext
} from './types'

const CDRAGON_GAME_DATA_BASE =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global'
const CDRAGON_DEFAULT_ASSET_BASE = `${CDRAGON_GAME_DATA_BASE}/default`
const LCU_ASSET_PREFIX = '/lol-game-data/assets/'
const AKARI_PREFIX = 'akari://'
const AKARI_LEAGUE_CLIENT_HOST = 'league-client'

interface StorybookGameResourceProviderOptions {
  locale: MaybeRefOrGetter<string>
  colorMode: MaybeRefOrGetter<ColorMode>
}

interface StorybookGameResourceState {
  champions: Map<number, ChampionSimple>
  queues: Map<number, Queue>
  maps: Map<number, GameMap>
  gameModeMutators: Map<number, GameModeMutator>
  items: Map<number, Item>
  perks: Map<number, Perk>
  perkStyles: Map<number, Style>
  summonerSpells: Map<number, SummonerSpell>
  augments: Map<number, Augment>
}

interface PerkstylesPayload {
  styles: Style[]
}

function createEmptyState(): StorybookGameResourceState {
  return {
    champions: new Map(),
    queues: new Map(),
    maps: new Map(),
    gameModeMutators: new Map(),
    items: new Map(),
    perks: new Map(),
    perkStyles: new Map(),
    summonerSpells: new Map(),
    augments: new Map()
  }
}

function mapById<T extends { id: number }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]))
}

function toCommunityDragonLocale(locale: string) {
  return locale === 'zh-CN' ? 'zh_cn' : 'default'
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  return (await response.json()) as T
}

async function fetchGameDataJson<T>(file: string, locale: string): Promise<T> {
  const localizedUrl = `${CDRAGON_GAME_DATA_BASE}/${locale}/v1/${file}`

  try {
    return await fetchJson<T>(localizedUrl)
  } catch (error) {
    if (locale === 'default') {
      throw error
    }

    return await fetchJson<T>(`${CDRAGON_GAME_DATA_BASE}/default/v1/${file}`)
  }
}

async function fetchStorybookGameResourceState(
  locale: string
): Promise<StorybookGameResourceState> {
  const [
    champions,
    queues,
    maps,
    gameModeMutators,
    items,
    perks,
    perkstyles,
    summonerSpells,
    augments
  ] = await Promise.all([
    fetchGameDataJson<ChampionSimple[]>('champion-summary.json', locale),
    fetchGameDataJson<Queue[]>('queues.json', locale),
    fetchGameDataJson<GameMap[]>('maps.json', locale),
    fetchGameDataJson<GameModeMutator[]>('game-mode-mutators.json', locale),
    fetchGameDataJson<Item[]>('items.json', locale),
    fetchGameDataJson<Perk[]>('perks.json', locale),
    fetchGameDataJson<PerkstylesPayload>('perkstyles.json', locale),
    fetchGameDataJson<SummonerSpell[]>('summoner-spells.json', locale),
    fetchGameDataJson<Augment[]>('cherry-augments.json', locale)
  ])

  return {
    champions: mapById(champions),
    queues: mapById(queues),
    maps: mapById(maps),
    gameModeMutators: new Map(gameModeMutators.map((mutator) => [mutator.MapId, mutator])),
    items: mapById(items),
    perks: mapById(perks),
    perkStyles: mapById(perkstyles.styles),
    summonerSpells: mapById(summonerSpells),
    augments: mapById(augments)
  }
}

function normalizeLcuPath(path: string) {
  const normalized = path.trim()
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

function extractAkariLeagueClientPath(source: string) {
  if (!source.startsWith(AKARI_PREFIX)) {
    return source
  }

  let url: URL

  try {
    url = new URL(source)
  } catch {
    return null
  }

  if (url.host !== AKARI_LEAGUE_CLIENT_HOST) {
    return null
  }

  return normalizeLcuPath(`${url.pathname}${url.search}${url.hash}`)
}

function resolveCommunityDragonAssetUrl(source: string) {
  const normalizedSource = source.trim()

  if (!normalizedSource) {
    return null
  }

  const resolvedSource = extractAkariLeagueClientPath(normalizedSource)

  if (!resolvedSource) {
    return null
  }

  if (!resolvedSource.startsWith('/')) {
    return resolvedSource
  }

  const pathOnly = resolvedSource.split(/[?#]/, 1)[0]
  const lowerPath = pathOnly.toLowerCase()

  if (lowerPath.startsWith(LCU_ASSET_PREFIX)) {
    return `${CDRAGON_DEFAULT_ASSET_BASE}/${pathOnly
      .slice(LCU_ASSET_PREFIX.length)
      .replace(/^\/+/, '')
      .toLowerCase()}`
  }

  return `${CDRAGON_DEFAULT_ASSET_BASE}${normalizeLcuPath(pathOnly).toLowerCase()}`
}

export function createStorybookGameResourceProvider(
  options: StorybookGameResourceProviderOptions
): GameResourceProviderValue {
  const state = shallowRef(createEmptyState())
  let loadingId = 0

  watchEffect(() => {
    const locale = toCommunityDragonLocale(toValue(options.locale))
    const currentLoadingId = ++loadingId

    void fetchStorybookGameResourceState(locale)
      .then((nextState) => {
        if (currentLoadingId === loadingId) {
          state.value = nextState
        }
      })
      .catch((error) => {
        console.warn('[storybook] Failed to load Community Dragon resources', error)
      })
  })

  const itemInline = (id: number): ItemInlineResource | null => {
    const item = state.value.items.get(id)

    if (!item?.name || !item.iconPath) {
      return null
    }

    return {
      id,
      name: item.name,
      iconPath: item.iconPath
    }
  }

  return {
    runtime: {
      get locale() {
        return toValue(options.locale)
      },
      get colorMode() {
        return toValue(options.colorMode)
      }
    },

    assets: {
      resolve(source) {
        return resolveCommunityDragonAssetUrl(source)
      }
    },

    champions: {
      name(id) {
        return state.value.champions.get(id)?.name || id.toString()
      },
      icon(id) {
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
      name(id) {
        return state.value.queues.get(id)?.name || id.toString()
      }
    },

    maps: {
      name(id, context?: MapNameContext) {
        const mutators = state.value.gameModeMutators.get(id)

        if (!mutators) {
          return state.value.maps.get(id)?.name || id.toString()
        }

        const mutator = mutators.Mutators.find((item) =>
          context?.gameModeMutators?.some(
            (value) => item.Mutator.ExpandedMutator.toLowerCase() === value.toLowerCase()
          )
        )

        return mutator?.MapNameOverride || mutators.MapNameBase
      }
    },

    items: {
      display(id) {
        const item = state.value.items.get(id)

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
          from: item.from.map(itemInline).filter((value) => value !== null),
          to: item.to.map(itemInline).filter((value) => value !== null)
        }
      }
    },

    perks: {
      name(id) {
        return state.value.perks.get(id)?.name || id.toString()
      },
      display(id) {
        const perk = state.value.perks.get(id)

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
      display(id) {
        const style = state.value.perkStyles.get(id)

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
      name(id) {
        return state.value.summonerSpells.get(id)?.name || id.toString()
      },
      display(id) {
        const spell = state.value.summonerSpells.get(id)

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
      name(id) {
        return state.value.augments.get(id)?.nameTRA || id.toString()
      },
      display(id): AugmentDisplayResource | null {
        const augment = state.value.augments.get(id)

        if (!augment?.nameTRA || !augment.augmentSmallIconPath || !augment.rarity) {
          return null
        }

        return {
          id,
          name: augment.nameTRA,
          iconPath: augment.augmentSmallIconPath,
          rarity: augment.rarity
        }
      }
    }
  }
}
