import type { Qq101ClassicPosition } from '@shared/http-api-axios-helper/qq101'
import type { Qq101ChampionDataPosition } from '@shared/types/champion-data'
import type {
  Qq101AugmentQuality,
  Qq101EncodedResponse,
  Qq101MayhemCoreItems,
  Qq101MayhemItem,
  Qq101MayhemSkill,
  Qq101PatchesResponse,
  Qq101Payloads,
  Qq101Position,
  Qq101RuneStyleCode
} from '@shared/types/qq101'

const ABILITY_KEYS: Record<number, string> = { 1: 'Q', 2: 'W', 3: 'E', 4: 'R' }
const DURATION_RANGES: Record<number, string> = {
  1: '<20 min',
  2: '20-25 min',
  3: '25-30 min',
  4: '30-35 min',
  5: '35-40 min',
  6: '40+ min'
}
const RUNE_STYLE_BY_CODE: Record<Qq101RuneStyleCode, number> = {
  jm: 8000,
  zz: 8100,
  zj: 8100,
  ws: 8200,
  qd: 8300,
  jj: 8400
}

// QQ101 keystone catalog, last verified: 2026-11-15. IDs are not style ranges.
const KEYSTONE_STYLES: Record<number, number> = {
  8005: 8000,
  8008: 8000,
  8021: 8000,
  8010: 8000,
  8112: 8100,
  8124: 8100,
  8128: 8100,
  9923: 8100,
  8214: 8200,
  8229: 8200,
  8230: 8200,
  8992: 8200,
  8437: 8400,
  8439: 8400,
  8465: 8400,
  8351: 8300,
  8360: 8300,
  8369: 8300
}

/** Only the documented empty payload becomes null. Invalid JSON propagates to the caller. */
function payload<K extends keyof Qq101Payloads>(
  response: Qq101EncodedResponse
): Qq101Payloads[K] | null {
  if (response.code !== 0) {
    throw new Error(`QQ101 ${response.code}: ${response.msg}`)
  }

  return response.data.result === '' ? null : JSON.parse(response.data.result)
}

function split(value: string, separator: string) {
  return value === '' || value === '-1' ? [] : value.split(separator)
}

function rows(value: string, separator = '_', delimiter = '#') {
  return split(value, delimiter).map((row) => row.split(separator))
}

function ids(value: string, separator = ',') {
  return split(value, separator).map(Number)
}

function percentage(value: string) {
  return value === '-1' ? null : Number((Number(value) / 100).toFixed(8))
}

function comparison(value: string) {
  return value === 'NC' ? null : Number(value)
}

function rankChange(value: string) {
  if (value === '未变化') {
    return 0
  }

  const amount = Number(value.match(/\d+/)![0])

  return value.startsWith('上升') ? amount : -amount
}

function aramChampion(row: string[]) {
  return {
    championId: Number(row[0]),
    rank: Number(row[1]),
    rankChange: rankChange(row[2]),
    winRate: Number(row[3]),
    pickRate: Number(row[4]),
    bestPartners: rows(row[5], ',', '&').map(([championId, pickRate, winRate, rank]) => ({
      championId: Number(championId),
      pickRate: Number(pickRate),
      winRate: Number(winRate),
      rank: Number(rank)
    })),
    averageDeathTimeSeconds: Number(row[6]),
    killParticipationRate: Number(row[7]),
    damageShare: Number(row[8]),
    damageTakenShare: Number(row[9])
  }
}

function buildOptions(value: string) {
  return rows(value).map(([itemIds, rank, pickRate, winRate]) => ({
    itemIds: ids(itemIds),
    rank: Number(rank),
    pickRate: percentage(pickRate),
    winRate: percentage(winRate)
  }))
}

export function parseQq101Patches(response: Qq101PatchesResponse) {
  if (response.code !== 0) {
    throw new Error(`QQ101 ${response.code}: ${response.msg}`)
  }

  return response.data.map((row) => ({ id: Number(row.id), name: row.name }))
}

export function parseQq101TierList(response: Qq101EncodedResponse, patch: string) {
  const data = payload<'ranked'>(response)

  return {
    date: data === null ? '' : data.dtstatdate,
    patch,
    champions: rows(data === null ? '' : data.datadetails).map((row) => ({
      rank: Number(row[0]),
      championId: Number(row[1]),
      rowKey: `${row[1]}:${row[3]}`,
      strengthTier: row[2],
      position: row[3] as Qq101Position,
      winRate: percentage(row[4]),
      pickRate: percentage(row[5]),
      banRate: percentage(row[6]),
      counterChampionIds: ids(row[7]),
      rankChange: comparison(row[8]),
      dailyAverageSurge: comparison(row[9]),
      isHot: row[10] === '1'
    }))
  }
}

export function parseQq101ClassicTierList(
  response: Qq101EncodedResponse,
  position: Qq101ClassicPosition
) {
  const data = payload<'classic'>(response)

  return {
    date: data === null ? '' : data.dtstatdate,
    champions: rows(data === null ? '' : data.tierscore_top_hero_list, '|').map((row) => ({
      rank: Number(row[0]),
      championId: Number(row[1]) - 60000,
      classicChampionId: Number(row[1]),
      strengthTier: row[5],
      position: position.toUpperCase(),
      winRate: percentage(row[2]),
      pickRate: percentage(row[3]),
      banRate: percentage(row[4]),
      counterChampionIds: [] as number[],
      rankChange: Number(row[6])
    }))
  }
}

export function parseQq101Trend(response: Qq101EncodedResponse, championId: number) {
  const data = payload<'trend'>(response)

  return {
    championId,
    date: data === null ? '' : data.dtstatdate,
    points: rows(data === null ? '' : data.history_strength_trend).map(([patch, winRate]) => ({
      patch,
      winRate: percentage(winRate)
    }))
  }
}

export function parseQq101Matchups(response: Qq101EncodedResponse, championId: number) {
  const data = payload<'matchups'>(response)
  const matchups = (value: string) =>
    rows(value).map(([, id, winRate, advantage]) => ({
      championId: Number(id),
      winRate: percentage(winRate),
      advantage: Number((Number(advantage) / 100).toFixed(8))
    }))

  return {
    championId,
    date: data === null ? '' : data.dtstatdate,
    favorable: matchups(data === null ? '' : data.high_op_details),
    unfavorable: matchups(data === null ? '' : data.low_op_details)
  }
}

export function parseQq101Synergies(response: Qq101EncodedResponse, championId: number) {
  const data = payload<'synergies'>(response)

  return {
    championId,
    date: data === null ? '' : data.dtstatdate,
    synergies: rows(data === null ? '' : data.data_details).map(([, id, winRate, games]) => ({
      championId: Number(id),
      winRate: percentage(winRate),
      games: Number(games)
    }))
  }
}

export function parseQq101SummonerSpells(response: Qq101EncodedResponse, championId: number) {
  const data = payload<'spells'>(response)
  const recommendations = rows(data === null ? '' : data.data_details)
    .map(([first, second, winRate, pickRate]) => ({
      summonerSpellIds:
        second === '4' ? [Number(second), Number(first)] : [Number(first), Number(second)],
      winRate: percentage(winRate),
      pickRate: percentage(pickRate)
    }))
    .sort((a, b) => (b.pickRate ?? 0) - (a.pickRate ?? 0))
    .slice(0, 5)
    .map((row, index) => ({ ...row, rank: index + 1 }))

  return { championId, date: data === null ? '' : data.dtstatdate, recommendations }
}

export function parseQq101SkillOrder(response: Qq101EncodedResponse, championId: number) {
  const data = payload<'skills'>(response)
  const groups = split(data === null ? '' : data.detaildetails, '$').map((group) => {
    const [header, ...builds] = group.split('@')
    const [abilities, pickRate, winRate] = header.split(':')

    return {
      abilities: ids(abilities),
      pickRate: percentage(pickRate),
      winRate: percentage(winRate),
      builds
    }
  })
  const priorities = groups.map((row) => ({
    abilityCodes: row.abilities,
    pickRate: row.pickRate,
    winRate: row.winRate
  }))
  const options = groups.flatMap((group) =>
    group.builds.map((value) => {
      const [order, pickRate, winRate] = value.split('_')

      return {
        abilityPriority: group.abilities.map((id) => ABILITY_KEYS[id]),
        levelOrder: ids(order).map((id) => ABILITY_KEYS[id]),
        pickRate: percentage(pickRate),
        winRate: percentage(winRate)
      }
    })
  )

  return {
    championId,
    date: data === null ? '' : data.dtstatdate,
    priorities,
    abilityPriority: options[0]?.abilityPriority ?? [],
    levelOrder: options[0]?.levelOrder ?? [],
    options
  }
}

export function parseQq101TierStats(response: Qq101EncodedResponse, championId: number) {
  const data = payload<'tiers'>(response)

  return {
    championId,
    date: data === null ? '' : data.dtstatdate,
    tiers: rows(data === null ? '' : data.datadetails).map(
      ([tierId, winRate, pickRate, banRate]) => ({
        tierId: Number(tierId),
        winRate: percentage(winRate),
        pickRate: percentage(pickRate),
        banRate: percentage(banRate)
      })
    )
  }
}

export function parseQq101Build(response: Qq101EncodedResponse, championId: number) {
  const data = payload<'build'>(response)

  return {
    championId,
    date: data === null ? '' : data.dtstatdate,
    slots: {
      starting: buildOptions(data === null ? '' : data.starting_details),
      boots: buildOptions(data === null ? '' : data.shoes_details),
      core: buildOptions(data === null ? '' : data.core_details),
      fourth: buildOptions(data === null ? '' : data.forth_details),
      fifth: buildOptions(data === null ? '' : data.fifth_details),
      sixth: buildOptions(data === null ? '' : data.sixth_details)
    }
  }
}

export function parseQq101Runes(response: Qq101EncodedResponse, championId: number) {
  const data = payload<'runes'>(response)

  return {
    championId,
    date: data === null ? '' : data.dtstatdate,
    pages: rows(data === null ? '' : data.rune_top_details)
      .map((row) => {
        const runeIds = ids(row[3])

        return {
          rank: Number(row[0]),
          primaryStyleId: KEYSTONE_STYLES[Number(row[1])],
          secondaryStyleId: RUNE_STYLE_BY_CODE[row[2] as Qq101RuneStyleCode],
          primaryRuneIds: runeIds.slice(0, 4),
          secondaryRuneIds: runeIds.slice(4, 6),
          statShardIds: runeIds.slice(6, 9),
          pickRate: percentage(row[4]),
          winRate: percentage(row[5]),
          games: Number(row[6])
        }
      })
      .sort((a, b) => a.rank - b.rank)
  }
}

export function parseQq101Positions(response: Qq101EncodedResponse, championId: number) {
  const data = payload<'positions'>(response)

  return {
    championId,
    date: data === null ? '' : data.dtstatdate,
    positions: split(data === null ? '' : data.lane_details, '#').map((value) => {
      const [position, stats] = value.split('：')
      const [pickRate, winRate, banRate, strengthTier, rank, share] = stats.split('_')

      return {
        position: position as Qq101Position,
        pickRate: percentage(pickRate),
        winRate: percentage(winRate),
        banRate: percentage(banRate),
        strengthTier,
        rank: Number(rank),
        share: percentage(share)
      }
    })
  }
}

export function parseQq101Durations(response: Qq101EncodedResponse, championId: number) {
  const data = payload<'durations'>(response)

  return {
    championId,
    date: data === null ? '' : data.dtstatdate,
    durations: rows(data === null ? '' : data.data_details).map(([id, winRate, rank]) => ({
      rangeId: Number(id),
      range: DURATION_RANGES[Number(id)],
      winRate: percentage(winRate),
      rank: Number(rank)
    }))
  }
}

export function parseQq101AramChampions(response: Qq101EncodedResponse, date: string) {
  const data = payload<'aram'>(response)

  return { date, champions: rows(data === null ? '' : data.listcollect).map(aramChampion) }
}

export function parseQq101MayhemChampions(response: Qq101EncodedResponse, date: string) {
  const data = payload<'aram'>(response)

  return {
    date,
    champions: rows(data === null ? '' : data.listcollect).map((row) => ({
      ...aramChampion(row),
      lowestRankAugmentIds: ids(row[10])
    }))
  }
}

export function parseQq101MayhemAugments(response: Qq101EncodedResponse) {
  const data = payload<'augments'>(response)

  return {
    date: data === null ? '' : data.dtstatdate,
    augments: rows(data === null ? '' : data.augmentlist).map((row) => ({
      augmentId: Number(row[0]),
      augmentTier: row[1] === '255' ? null : Number(row[1]),
      pickRate: Number(row[2]),
      pickRank: Number(row[3]),
      pickRankChange: Number(row[4]),
      pickRankImprovement: -Number(row[4]),
      winRate: Number(row[5]),
      winRank: Number(row[6]),
      winRankChange: Number(row[7]),
      winRankImprovement: -Number(row[7]),
      bestChampions: ids(row[8]).map((championId) => ({ championId }))
    }))
  }
}

export function parseQq101MayhemPairSynergies(response: Qq101EncodedResponse) {
  const data = payload<'pairs'>(response)

  return {
    date: data === null ? '' : data.dtstatdate,
    synergies: rows(data === null ? '' : data.championid_data, '|').map((row) => ({
      champions: ids(row[0], ';').map((championId) => ({ championId })),
      winRate: Number(row[2]),
      pickRate: Number(row[3]),
      rank: Number(row[4])
    }))
  }
}

export function parseQq101ClassicLanes(response: Qq101EncodedResponse) {
  const data = payload<'lanes'>(response)

  return {
    date: data === null ? '' : data.dtstatdate,
    champions: rows(data === null ? '' : data.hero_lane_list).map(([id, lanes]) => ({
      classicChampionId: Number(id),
      positions: split(lanes, ';') as Exclude<Qq101ClassicPosition, 'all'>[]
    }))
  }
}

export function parseQq101JungleRoutes(response: Qq101EncodedResponse, championId: number) {
  const data = payload<'jungle'>(response)

  return {
    championId,
    date: data === null ? '' : data.dtstatdate,
    groups: split(data === null ? '' : data.data_details, '$').map((group) => {
      const [, startingCamp, teamId, routes] = /^([^*]+)\*(100|200):\[(.*)\]$/.exec(group)!

      return {
        startingCamp: startingCamp === '255' ? null : startingCamp,
        teamId: Number(teamId) as 100 | 200,
        routes: rows(routes)
          .map(([rank, camps, games, pickRate, winRate]) => ({
            rank: Number(rank),
            camps: split(camps, ','),
            games: Number(games),
            pickRate: percentage(pickRate),
            winRate: percentage(winRate)
          }))
          .sort((a, b) => a.rank - b.rank)
      }
    })
  }
}

export function parseQq101MayhemDetails(response: Qq101EncodedResponse, championId: number) {
  const data = payload<'mayhemDetails'>(response)
  const augments = (value: string, graded: boolean) =>
    split(value, '&').flatMap((group) => {
      const [quality, entries] = group.split(':')

      return rows(entries, '|').map(([rank, champion, augmentId, , pickRate, grade]) => ({
        rank: Number(rank),
        championId: Number(champion),
        augmentId: Number(augmentId),
        quality: quality === '255' ? null : (quality as Exclude<Qq101AugmentQuality, '255'>),
        pickRate: Number(pickRate),
        grade: graded ? grade : null
      }))
    })
  const items = (value: string) =>
    rows(value, '$').map(([itemIds, pickRate, winRate]) => ({
      itemIds: ids(itemIds),
      pickRate: Number(pickRate),
      winRate: Number(winRate)
    }))
  const itemEntries: Record<string, Qq101MayhemItem> =
    data === null ? {} : JSON.parse(data.itemone_json)
  const coreEntries: Record<string, Qq101MayhemCoreItems> =
    data === null ? {} : JSON.parse(data.itemcore_json)
  const skillEntries: Record<string, Qq101MayhemSkill> =
    data === null ? {} : JSON.parse(data.skill_json)

  return {
    championId,
    date: data === null ? '' : data.dtstatdate,
    augments: augments(data === null ? '' : data.augment_json_irank, true),
    augmentsByQuality: augments(data === null ? '' : data.augment_json, false),
    starting: items(data === null ? '' : data.itemout),
    boots: items(data === null ? '' : data.itemshoes),
    items: Object.entries(itemEntries)
      .map(([rank, row]) => ({
        rank: Number(rank),
        itemIds: ids(row.itemone, '&'),
        pickRate: row.showrate / 10000,
        winRate: row.winrate / 10000
      }))
      .sort((a, b) => a.rank - b.rank),
    core: Object.entries(coreEntries)
      .map(([rank, row]) => ({
        rank: Number(rank),
        itemIds: ids(row.itemcore, '&'),
        pickRate: row.showrate / 10000,
        winRate: row.winrate / 10000
      }))
      .sort((a, b) => a.rank - b.rank),
    builds: rows(data === null ? '' : data.itemover_rec, '_', ';').map(
      ([rank, itemIds, pickRate, winRate]) => ({
        rank: Number(rank),
        itemIds: ids(itemIds),
        pickRate: Number(pickRate),
        winRate: Number(winRate)
      })
    ),
    partners: rows(data === null ? '' : data.championid_json, '|').map(
      ([id, winRate, pickRate, rank]) => ({
        championId: Number(id),
        winRate: Number(winRate),
        pickRate: Number(pickRate),
        rank: Number(rank)
      })
    ),
    skillOrders: Object.entries(skillEntries)
      .map(([rank, row]) => ({
        rank: Number(rank),
        abilityCodes: ids(row.qwe, '&'),
        pickRate: Number(row.qwe_s) / 10000,
        winRate: Number(row.qwe_w) / 10000,
        plans: Object.entries(row.sks)
          .map(([rank, plan]) => ({
            rank: Number(rank),
            abilityCodes: ids(plan.sk, '&'),
            pickRate: Number(plan.sk_s) / 10000,
            winRate: Number(plan.sk_w) / 10000
          }))
          .sort((a, b) => a.rank - b.rank)
      }))
      .sort((a, b) => a.rank - b.rank)
  }
}

export interface Qq101AkariDataMap {
  patches: ReturnType<typeof parseQq101Patches>
  ranked: ReturnType<typeof parseQq101TierList>
  classic: ReturnType<typeof parseQq101ClassicTierList>
  trend: ReturnType<typeof parseQq101Trend>
  matchups: ReturnType<typeof parseQq101Matchups>
  synergies: ReturnType<typeof parseQq101Synergies>
  spells: ReturnType<typeof parseQq101SummonerSpells>
  skills: ReturnType<typeof parseQq101SkillOrder>
  tiers: ReturnType<typeof parseQq101TierStats>
  build: ReturnType<typeof parseQq101Build>
  runes: ReturnType<typeof parseQq101Runes>
  positions: ReturnType<typeof parseQq101Positions>
  durations: ReturnType<typeof parseQq101Durations>
  aram: ReturnType<typeof parseQq101AramChampions>
  mayhem: ReturnType<typeof parseQq101MayhemChampions>
  augments: ReturnType<typeof parseQq101MayhemAugments>
  pairs: ReturnType<typeof parseQq101MayhemPairSynergies>
  lanes: ReturnType<typeof parseQq101ClassicLanes>
  jungle: ReturnType<typeof parseQq101JungleRoutes>
  mayhemDetails: ReturnType<typeof parseQq101MayhemDetails>
}

export type Qq101AkariData<K extends keyof Qq101AkariDataMap> = Qq101AkariDataMap[K]

export function toQq101Position(position: Qq101ChampionDataPosition | undefined) {
  const positions: Record<Qq101ChampionDataPosition, string> = {
    all: 'ALL',
    top: 'TOP',
    jungle: 'JUNGLE',
    middle: 'MIDDLE',
    bottom: 'BOTTOM',
    utility: 'SUPPORT'
  }

  return positions[position ?? 'all']
}

export function toQq101ClassicPosition(
  position: Qq101ChampionDataPosition | undefined
): Qq101ClassicPosition {
  const positions: Record<Qq101ChampionDataPosition, Qq101ClassicPosition> = {
    all: 'all',
    top: 'top',
    jungle: 'jungle',
    middle: 'middle',
    bottom: 'bottom',
    utility: 'support'
  }

  return positions[position ?? 'all']
}
