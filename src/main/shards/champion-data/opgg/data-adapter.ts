import { getOpggAramBalanceAdjustments } from '@shared/data-adapter/opgg-aram-balance'
import type {
  OpggChampionDataCounter,
  OpggChampionDataDetails,
  OpggChampionDataKiwiAugment,
  OpggChampionDataRow,
  OpggChampionDataSummary,
  OpggItemSetGroup,
  OpggKiwiAugmentRarity,
  OpggRecommendation
} from '@shared/types/champion-data/opgg'
import type {
  OpggAramBalanceItem,
  OpggAramChampionDetails,
  OpggAramMayhemChampionAugmentsResponse,
  OpggArenaChampionOverview,
  OpggChampionCounter,
  OpggItemBuild,
  OpggRankedChampionOverview,
  OpggRankedPosition
} from '@shared/types/opgg'

import type { OpggLoadedChampion, OpggLoadedOverview } from '../context'

export interface OpggProjectionResources {
  aramBalance: OpggAramBalanceItem[]
  augmentRarity: (id: number) => Exclude<OpggKiwiAugmentRarity, 'all'> | null
}

export function ratio(value: number, total: number): number | null {
  if (total === 0) {
    return null
  }

  return value / total
}

function counters(items: OpggChampionCounter[]): OpggChampionDataCounter[] {
  return items.map((item) => {
    return {
      ...item,
      winRate: ratio(item.win, item.play),
      loss: item.play - item.win
    }
  })
}

function emptySummary(id: number): OpggChampionDataSummary {
  return {
    id,
    rank: null,
    tier: null,
    winRate: null,
    pickRate: null,
    banRate: null,
    play: null,
    win: null,
    loss: null,
    averagePlace: null,
    firstPlaceRate: null
  }
}

function winRateSummary(
  champion: Pick<OpggRankedChampionOverview, 'id' | 'average_stats'>
): OpggChampionDataSummary {
  const result = emptySummary(champion.id)
  const stats = champion.average_stats

  if (stats === null) {
    return result
  }

  result.rank = stats.rank
  result.tier = stats.tier
  result.winRate = stats.win_rate
  result.pickRate = stats.pick_rate
  result.banRate = stats.ban_rate
  result.play = stats.play

  return result
}

function rankedSummary(champion: OpggRankedChampionOverview, position: OpggRankedPosition) {
  const result = winRateSummary(champion)
  const selected = champion.positions.find((item) => item.name.toLowerCase() === position)

  // 整体统计可以作为缺少位置统计时的摘要，但不能当作该位置的排名或梯队。
  result.rank = null
  result.tier = null

  if (!selected) {
    return result
  }

  const stats = selected.stats
  result.rank = stats.tier_data.rank
  result.tier = stats.tier_data.tier
  result.winRate = stats.win_rate
  result.pickRate = stats.pick_rate
  result.banRate = stats.ban_rate
  result.play = stats.play

  return result
}

function arenaSummary(champion: OpggArenaChampionOverview) {
  const result = emptySummary(champion.id)
  const stats = champion.average_stats

  if (stats === null) {
    return result
  }

  result.rank = stats.rank
  result.tier = stats.tier
  result.winRate = ratio(stats.win, stats.play)
  result.win = stats.win
  result.loss = stats.play - stats.win
  result.pickRate = stats.pick_rate
  result.banRate = stats.ban_rate
  result.play = stats.play
  result.averagePlace = ratio(stats.total_place, stats.play)
  result.firstPlaceRate = ratio(stats.first_place, stats.play)

  return result
}

function overviewRow(
  summary: OpggChampionDataSummary,
  matchups: OpggChampionDataCounter[] = []
): OpggChampionDataRow {
  return {
    id: summary.id,
    rank: summary.rank,
    tier: summary.tier,
    winRate: summary.winRate,
    pickRate: summary.pickRate,
    banRate: summary.banRate,
    play: summary.play,
    win: summary.win,
    loss: summary.loss,
    counters: matchups
  }
}

export function projectOverview(
  overview: OpggLoadedOverview,
  position: OpggRankedPosition
): OpggChampionDataRow[] {
  const rows: OpggChampionDataRow[] = []

  switch (overview.mode) {
    case 'ranked':
      for (const champion of overview.response.data) {
        const selected = champion.positions.find((item) => item.name.toLowerCase() === position)

        if (!selected) {
          continue
        }

        rows.push(overviewRow(rankedSummary(champion, position), counters(selected.counters)))
      }
      break

    case 'aram':
    case 'nexus_blitz':
    case 'urf':
      for (const champion of overview.response.data) {
        rows.push(overviewRow(winRateSummary(champion)))
      }
      break

    case 'arena':
      for (const champion of overview.response.data) {
        rows.push(overviewRow(arenaSummary(champion)))
      }
      break

    case 'aram_mayhem':
      for (const champion of overview.response.data) {
        const summary = emptySummary(champion.champion_id)
        summary.rank = champion.rank
        summary.tier = champion.tier
        rows.push(overviewRow(summary))
      }
      break
  }

  rows.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))

  for (const [index, row] of rows.entries()) {
    if (row.rank === null) {
      row.rank = index + 1
    }
  }

  return rows
}

function recommendations<T extends { win: number; play: number }>(
  items: T[],
  kind: string
): OpggRecommendation<T>[] {
  return items.map((item, index) => {
    return {
      ...item,
      recommendationId: `${kind}:${index}`,
      winRate: ratio(item.win, item.play),
      loss: item.play - item.win,
      averagePlace: null,
      firstPlaceRate: null
    }
  })
}

function arenaRecommendations<
  T extends { win: number; play: number; total_place: number; first_place: number }
>(items: T[], kind: string): OpggRecommendation<T>[] {
  return items.map((item, index) => {
    return {
      ...item,
      recommendationId: `${kind}:${index}`,
      winRate: ratio(item.win, item.play),
      loss: item.play - item.win,
      averagePlace: ratio(item.total_place, item.play),
      firstPlaceRate: ratio(item.first_place, item.play)
    }
  })
}

function kiwiGroups(
  response: OpggAramMayhemChampionAugmentsResponse,
  resources: OpggProjectionResources
): OpggChampionDataDetails['kiwiAugmentGroups'] {
  const items: OpggChampionDataKiwiAugment[] = response.data.map((item) => {
    return {
      ...item,
      rarity: resources.augmentRarity(item.id),
      sortRanks: { default: 0, performance: 0, popular: 0 }
    }
  })

  const orders = {
    default: items.toSorted((a, b) => (a.tier ?? Infinity) - (b.tier ?? Infinity)),
    performance: items.toSorted((a, b) => {
      if (a.popular === 0 && b.popular !== 0) {
        return 1
      }

      if (a.popular !== 0 && b.popular === 0) {
        return -1
      }

      return b.performance - a.performance
    }),
    popular: items.toSorted((a, b) => b.popular - a.popular)
  }

  for (const key of ['default', 'performance', 'popular'] as const) {
    for (const [index, item] of orders[key].entries()) {
      item.sortRanks[key] = index
    }
  }

  const groups: OpggChampionDataDetails['kiwiAugmentGroups'] = []

  for (const rarity of ['all', 'kSilver', 'kGold', 'kPrismatic'] as const) {
    const augments = orders.default.filter((item) => rarity === 'all' || item.rarity === rarity)

    if (augments.length > 0) {
      groups.push({ rarity, augments })
    }
  }

  return groups
}

function itemSetGroups(
  data: Pick<OpggAramChampionDetails, 'starter_items' | 'boots' | 'core_items' | 'last_items'>,
  prismItems: OpggItemBuild[] = []
): OpggItemSetGroup[] {
  const groups: OpggItemSetGroup[] = []

  const add = (kind: OpggItemSetGroup['kind'], items: OpggItemBuild[], limit?: number) => {
    if (items.length === 0) {
      return
    }

    if (limit !== undefined) {
      for (const [index, item] of items.slice(0, limit).entries()) {
        groups.push({ kind, index: index + 1, pickRate: item.pick_rate, items: item.ids })
      }
    } else {
      groups.push({ kind, index: 0, pickRate: null, items: items.flatMap((item) => item.ids) })
    }
  }

  add('starter', data.starter_items, 3)
  add('boots', data.boots)
  add('prism', prismItems)
  add('core', data.core_items, 4)
  add('last', data.last_items)

  return groups
}

function fillWinRateDetails(
  result: OpggChampionDataDetails,
  data: Omit<OpggAramChampionDetails, 'summary'>
) {
  result.summonerSpells = recommendations(data.summoner_spells, 'spells')
  result.runes = recommendations(data.runes, 'runes')
  result.skillMasteries = recommendations(data.skill_masteries, 'skills')
  result.starterItems = recommendations(data.starter_items, 'starter')
  result.boots = recommendations(data.boots, 'boots')
  result.coreItems = recommendations(data.core_items, 'core')
  result.lastItems = recommendations(data.last_items, 'last')
  result.counters.all = counters(data.counters).toSorted(
    (a, b) => (b.winRate ?? -1) - (a.winRate ?? -1)
  )

  const groups = itemSetGroups(data)

  if (groups.length > 0) {
    result.itemSet = { recommendationId: 'items', groups }
  }
}

export function projectDetails(
  champion: OpggLoadedChampion,
  position: OpggRankedPosition,
  resources: OpggProjectionResources
): OpggChampionDataDetails {
  let summary: OpggChampionDataSummary

  switch (champion.mode) {
    case 'ranked':
      summary = rankedSummary(champion.response.data.summary, position)
      break

    case 'aram':
    case 'nexus_blitz':
    case 'urf':
      summary = winRateSummary(champion.response.data.summary)
      break

    case 'arena':
      summary = arenaSummary(champion.response.data.summary)
      break

    case 'aram_mayhem':
      summary = emptySummary(champion.summary.champion_id)
      summary.rank = champion.summary.rank
      summary.tier = champion.summary.tier
      break
  }

  const result: OpggChampionDataDetails = {
    summary,
    summonerSpells: [],
    runes: [],
    skillMasteries: [],
    starterItems: [],
    boots: [],
    prismItems: [],
    coreItems: [],
    lastItems: [],
    counters: { recommended: [], all: [] },
    synergies: [],
    augmentGroups: {},
    kiwiAugmentGroups: [],
    balance: [],
    itemSet: null,
    hasContent: false
  }

  switch (champion.mode) {
    case 'ranked': {
      const data = champion.response.data
      const selected = data.summary.positions.find((item) => item.name.toLowerCase() === position)

      fillWinRateDetails(result, data)

      if (selected) {
        result.counters.recommended = counters(selected.counters)
      }
      break
    }

    case 'aram': {
      fillWinRateDetails(result, champion.response.data)

      const balance = resources.aramBalance.find((item) => item.champion_id === summary.id)

      if (balance) {
        result.balance = getOpggAramBalanceAdjustments(balance).map((item) => {
          let relativeValue = item.value

          if (item.display !== 'literal') {
            relativeValue -= 100
          }

          return { ...item, relativeValue }
        })
      }
      break
    }

    case 'nexus_blitz':
    case 'urf':
      fillWinRateDetails(result, champion.response.data)
      break

    case 'arena': {
      const data = champion.response.data
      result.skillMasteries = arenaRecommendations(data.skill_masteries, 'skills')
      result.starterItems = arenaRecommendations(data.starter_items, 'starter')
      result.boots = arenaRecommendations(data.boots, 'boots')
      result.prismItems = arenaRecommendations(data.prism_items, 'prism')
      result.coreItems = arenaRecommendations(data.core_items, 'core')
      result.lastItems = arenaRecommendations(data.last_items, 'last')
      result.synergies = arenaRecommendations(data.synergies, 'synergies')

      for (const group of data.augment_group) {
        result.augmentGroups[group.rarity] = {
          rarity: group.rarity,
          augments: arenaRecommendations(group.augments, 'augments')
        }
      }

      const groups = itemSetGroups(data, data.prism_items)

      if (groups.length > 0) {
        result.itemSet = { recommendationId: 'items', groups }
      }
      break
    }

    case 'aram_mayhem':
      result.kiwiAugmentGroups = kiwiGroups(champion.response, resources)
      break
  }

  result.hasContent = [
    result.summonerSpells,
    result.runes,
    result.skillMasteries,
    result.starterItems,
    result.boots,
    result.prismItems,
    result.coreItems,
    result.lastItems,
    result.counters.recommended,
    result.synergies,
    result.kiwiAugmentGroups,
    result.balance,
    Object.values(result.augmentGroups)
  ].some((items) => items.length > 0)

  return result
}
