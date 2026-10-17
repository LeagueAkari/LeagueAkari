import { getOpggAramBalanceAdjustments } from '@shared/data-adapter/opgg-aram-balance'
import type {
  OpggDecodedDetails as OpggAramChampionDetails,
  OpggDecodedArenaChampion as OpggArenaChampionOverview,
  OpggDecodedCounter as OpggChampionCounter,
  OpggDecodedResponse,
  OpggDecodedItem as OpggItemBuild,
  OpggDecodedRankedChampion as OpggRankedChampionOverview
} from '@shared/data-adapter/opgg/schemas'
import type { OpggChampionBalance } from '@shared/types/champion-data/opgg'
import type {
  OpggArenaDetails,
  OpggChampionDataCounter,
  OpggChampionDataDetails,
  OpggChampionDataKiwiAugment,
  OpggChampionDataRow,
  OpggChampionDataSummary,
  OpggItemSetGroup,
  OpggKiwiAugmentRarity,
  OpggMayhemDetails,
  OpggPlacementRecommendation,
  OpggRecommendation,
  OpggStandardDetails
} from '@shared/types/champion-data/opgg'
import type { OpggRankedPosition } from '@shared/types/opgg'

import type { OpggLoadedChampion, OpggLoadedOverview } from './types'

export interface OpggProjectionResources {
  aramBalance: OpggChampionBalance[]
  augmentRarity: (id: number) => Exclude<OpggKiwiAugmentRarity, 'all'> | null
}

export function ratio(value: number | null, total: number): number | null {
  if (value === null || total === 0) {
    return null
  }

  return value / total
}

function winRate(win: number | null, play: number): number | null {
  if (win === null || win > play) {
    return null
  }

  return ratio(win, play)
}

function losses(win: number | null, play: number): number | null {
  if (win === null || win > play) {
    return null
  }

  return play - win
}

function counters(items: OpggChampionCounter[]): OpggChampionDataCounter[] {
  return items.map((item) => {
    return {
      championId: item.champion_id,
      play: item.play,
      win: item.win,
      winRate: winRate(item.win, item.play),
      loss: losses(item.win, item.play)
    }
  })
}

function emptySummary(id: number): OpggChampionDataSummary {
  return {
    championId: id,
    kind: 'win-rate',
    rank: null,
    tier: null,
    winRate: null,
    pickRate: null,
    banRate: null,
    play: null,
    win: null,
    loss: null
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
    return { ...result, kind: 'placement' as const, averagePlace: null, firstPlaceRate: null }
  }

  result.rank = stats.rank
  result.tier = stats.tier
  result.winRate = winRate(stats.win, stats.play)
  result.win = stats.win
  result.loss = losses(stats.win, stats.play)
  result.pickRate = stats.pick_rate
  result.banRate = stats.ban_rate
  result.play = stats.play

  return {
    ...result,
    kind: 'placement' as const,
    averagePlace: ratio(stats.total_place, stats.play),
    firstPlaceRate: winRate(stats.first_place, stats.play)
  }
}

function overviewRow(
  summary: OpggChampionDataSummary,
  matchups: OpggChampionDataCounter[] = []
): OpggChampionDataRow {
  return {
    championId: summary.championId,
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
    case 'flex':
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

function recommendations<T extends { win: number | null; play: number; pick_rate: number }, U>(
  items: T[],
  kind: string,
  project: (item: T) => U
): OpggRecommendation<U>[] {
  return items.map((item, index) => ({
    ...project(item),
    recommendationId: `${kind}:${index}`,
    play: item.play,
    win: item.win,
    pickRate: item.pick_rate,
    winRate: winRate(item.win, item.play),
    loss: losses(item.win, item.play)
  }))
}

function arenaRecommendations<
  T extends {
    win: number | null
    play: number
    pick_rate: number
    total_place: number | null
    first_place: number | null
  },
  U
>(items: T[], kind: string, project: (item: T) => U): OpggPlacementRecommendation<U>[] {
  return recommendations(items, kind, (item) => ({
    ...project(item),
    averagePlace: ratio(item.total_place, item.play),
    firstPlaceRate: winRate(item.first_place, item.play)
  }))
}

function kiwiGroups(
  response: OpggDecodedResponse<'mayhemAugments'>,
  resources: OpggProjectionResources
): OpggMayhemDetails['kiwiAugmentGroups'] {
  const items: OpggChampionDataKiwiAugment[] = response.data.map((item) => {
    return {
      augmentId: item.id,
      tier: item.tier,
      performance: item.performance,
      popular: item.popular,
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

  const groups: OpggMayhemDetails['kiwiAugmentGroups'] = []

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
  result: OpggDetailsDraft,
  data: Omit<OpggAramChampionDetails, 'summary'>
) {
  result.summonerSpells = recommendations(data.summoner_spells, 'spells', (item) => ({
    spellIds: item.ids
  }))
  result.runes = recommendations(data.runes, 'runes', (item) => ({
    primaryStyleId: item.primary_page_id,
    secondaryStyleId: item.secondary_page_id,
    primaryRuneIds: item.primary_rune_ids,
    secondaryRuneIds: item.secondary_rune_ids,
    statShardIds: item.stat_mod_ids
  }))
  result.skillMasteries = recommendations(data.skill_masteries, 'skills', (item) => ({
    skills: item.ids,
    orders: item.builds.map((build) => build.order)
  }))
  result.starterItems = recommendations(data.starter_items, 'starter', (item) => ({
    itemIds: item.ids
  }))
  result.boots = recommendations(data.boots, 'boots', (item) => ({ itemIds: item.ids }))
  result.coreItems = recommendations(data.core_items, 'core', (item) => ({ itemIds: item.ids }))
  result.lastItems = recommendations(data.last_items, 'last', (item) => ({ itemIds: item.ids }))
  result.counters.all = counters(data.counters).toSorted(
    (a, b) => (b.winRate ?? -1) - (a.winRate ?? -1)
  )

  const groups = itemSetGroups(data)

  if (groups.length > 0) {
    result.itemSet = { recommendationId: 'items', groups }
  }
}

type OpggDetailsDraft = Omit<OpggStandardDetails, 'kind'> &
  Pick<OpggArenaDetails, 'prismItems' | 'synergies' | 'augmentGroups'> &
  Pick<OpggMayhemDetails, 'kiwiAugmentGroups'>

export function projectDetails(
  champion: OpggLoadedChampion,
  position: OpggRankedPosition,
  resources: OpggProjectionResources
): OpggChampionDataDetails {
  let summary: OpggChampionDataSummary

  switch (champion.mode) {
    case 'ranked':
    case 'flex':
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

  const result: OpggDetailsDraft = {
    summary,
    summonerSpells: [],
    runes: [],
    skillMasteries: [],
    starterItems: [],
    boots: [],
    prismItems: [],
    coreItems: [],
    lastItems: [],
    itemBuildsByOrder: { single: [], combined: [] },
    counters: { recommended: [], all: [] },
    synergies: [],
    augmentGroups: {},
    kiwiAugmentGroups: [],
    balance: [],
    itemSet: null,
    hasContent: false
  }

  switch (champion.mode) {
    case 'ranked':
    case 'flex': {
      const data = champion.response.data
      const selected = data.summary.positions.find((item) => item.name.toLowerCase() === position)

      fillWinRateDetails(result, data)

      result.itemBuildsByOrder.single = data.single_items.map((group) => ({
        order: group.depth,
        builds: recommendations(group.items, `single:${group.depth}`, (item) => ({
          itemIds: item.ids
        }))
      }))
      result.itemBuildsByOrder.combined = data.combination_items.map((group) => ({
        order: group.depth + 1,
        builds: recommendations(group.items, `combined:${group.depth}`, (item) => ({
          itemIds: item.ids
        }))
      }))

      if (selected) {
        result.counters.recommended = counters(selected.counters)
      }

      break
    }

    case 'aram': {
      fillWinRateDetails(result, champion.response.data)

      const balance = resources.aramBalance.find((item) => item.championId === summary.championId)

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
      result.skillMasteries = recommendations(data.skill_masteries, 'skills', (item) => ({
        skills: item.ids,
        orders: item.builds.map((build) => build.order)
      }))
      result.starterItems = recommendations(data.starter_items, 'starter', (item) => ({
        itemIds: item.ids
      }))
      result.boots = recommendations(data.boots, 'boots', (item) => ({ itemIds: item.ids }))
      result.prismItems = recommendations(data.prism_items, 'prism', (item) => ({
        itemIds: item.ids
      }))
      result.coreItems = recommendations(data.core_items, 'core', (item) => ({
        itemIds: item.ids
      }))
      result.lastItems = recommendations(data.last_items, 'last', (item) => ({
        itemIds: item.ids
      }))
      result.synergies = arenaRecommendations(data.synergies, 'synergies', (item) => ({
        championId: item.champion_id
      }))

      for (const group of data.augment_group) {
        result.augmentGroups[group.rarity] = {
          rarity: group.rarity,
          augments: recommendations(group.augments, 'augments', (item) => ({
            augmentId: item.id
          }))
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
    ...result.itemBuildsByOrder.single.map((stage) => stage.builds),
    ...result.itemBuildsByOrder.combined.map((stage) => stage.builds),
    result.counters.recommended,
    result.synergies,
    result.kiwiAugmentGroups,
    result.balance,
    Object.values(result.augmentGroups)
  ].some((items) => items.length > 0)

  if (champion.mode === 'aram_mayhem') {
    return {
      kind: 'aram_mayhem',
      summary,
      hasContent: result.hasContent,
      kiwiAugmentGroups: result.kiwiAugmentGroups
    }
  }

  const builds = {
    summary,
    hasContent: result.hasContent,
    skillMasteries: result.skillMasteries,
    starterItems: result.starterItems,
    boots: result.boots,
    coreItems: result.coreItems,
    lastItems: result.lastItems,
    itemSet: result.itemSet
  }
  if (champion.mode === 'arena') {
    return {
      ...builds,
      kind: 'arena',
      prismItems: result.prismItems,
      synergies: result.synergies,
      augmentGroups: result.augmentGroups
    }
  }

  return {
    ...builds,
    kind: champion.mode,
    itemBuildsByOrder: result.itemBuildsByOrder,
    summonerSpells: result.summonerSpells,
    runes: result.runes,
    counters: result.counters,
    balance: result.balance
  }
}
