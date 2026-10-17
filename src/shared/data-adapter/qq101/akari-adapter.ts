import type { Qq101ClassicPosition } from '@shared/http-api-axios-helper/qq101'

import type { Qq101Validated } from './schemas'

const ABILITY_KEYS: Record<number, string> = { 1: 'Q', 2: 'W', 3: 'E', 4: 'R' }
const DURATION_RANGES: Record<number, string> = {
  1: '<20 min',
  2: '20-25 min',
  3: '25-30 min',
  4: '30-35 min',
  5: '35-40 min',
  6: '40+ min'
}
const RUNE_STYLE_BY_CODE: Record<string, number> = {
  jm: 8000,
  zz: 8100,
  zj: 8100,
  ws: 8200,
  qd: 8300,
  jj: 8400
}
// Snapshot of the QQ101 rune catalog. IDs are not allocated in style ranges.
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

function percentage(value: number | null) {
  return value === null ? null : Number((value / 100).toFixed(8))
}

function basisPoints(value: number | null) {
  return value === null ? null : value / 10000
}

function rankChange(value: string | null) {
  if (value === null) {
    return null
  }
  if (value === '未变化') {
    return 0
  }

  const amount = Number(value.match(/\d+/)?.[0])

  return value.startsWith('上升') ? amount : -amount
}

function aramChampion(row: Qq101Validated<'aram'>['rows'][number]) {
  return {
    championId: row.champion_id,
    rank: row.rank,
    rankChange: rankChange(row.rank_change),
    winRate: row.win_rate,
    pickRate: row.pick_rate,
    bestPartners: row.partners.map((partner) => ({
      championId: partner.champion_id,
      pickRate: partner.pick_rate,
      winRate: partner.win_rate,
      rank: partner.rank
    })),
    averageDeathTimeSeconds: row.death_time,
    killParticipationRate: row.participation,
    damageShare: row.damage_share,
    damageTakenShare: row.taken_share
  }
}

function buildOptions(rows: Qq101Validated<'build'>['core']) {
  return rows.map((row) => ({
    itemIds: row.item_ids,
    rank: row.rank,
    pickRate: percentage(row.pick_rate),
    winRate: percentage(row.win_rate)
  }))
}

function nestedItems(rows: Qq101Validated<'mayhemDetails'>['core']) {
  return rows
    .map((row) => ({
      rank: row.rank ?? 0,
      itemIds: row.item_ids,
      pickRate: basisPoints(row.pick_rate),
      winRate: basisPoints(row.win_rate)
    }))
    .sort((a, b) => a.rank - b.rank)
}

function heroAugments(rows: Qq101Validated<'mayhemDetails'>['augments']) {
  return rows.map((row) => ({
    rank: row.rank,
    championId: row.champion_id,
    augmentId: row.augment_id,
    quality: row.quality === '255' ? null : row.quality,
    pickRate: row.pick_rate,
    grade: row.grade || null
  }))
}

/** Pure source-to-Akari mapping. No requests, JSON decoding or schema recovery here. */
export const qq101Akari = {
  patches(data: Qq101Validated<'patches'>) {
    return data.data.map((row) => ({ id: row.id, name: row.name }))
  },

  ranked(data: Qq101Validated<'ranked'>, patch: string) {
    return {
      date: data.date ?? '',
      patch,
      champions: data.rows.map((row) => ({
        rank: row.rank,
        championId: row.champion_id,
        rowKey: `${row.champion_id}:${row.lane}`,
        strengthTier: row.tier,
        position: row.lane,
        winRate: percentage(row.win_rate),
        pickRate: percentage(row.pick_rate),
        banRate: percentage(row.ban_rate),
        counterChampionIds: row.counter_ids,
        rankChange: row.rank_change,
        dailyAverageSurge: row.daily_surge,
        isHot: row.is_hot === '1'
      }))
    }
  },

  classic(data: Qq101Validated<'classic'>, position: Qq101ClassicPosition) {
    return {
      date: data.date ?? '',
      champions: data.rows
        .map((row) => ({
          rank: row.rank,
          championId: row.champion_id >= 60000 ? row.champion_id - 60000 : row.champion_id,
          classicChampionId: row.champion_id,
          strengthTier: row.tier,
          position: position.toUpperCase(),
          winRate: percentage(row.win_rate),
          pickRate: percentage(row.pick_rate),
          banRate: percentage(row.ban_rate),
          counterChampionIds: [] as number[],
          rankChange: row.rank_change
        }))
        .filter((row) => row.championId > 0)
    }
  },

  trend(data: Qq101Validated<'trend'>, championId: number) {
    return {
      championId,
      date: data.date ?? '',
      points: data.rows.map((row) => ({ patch: row.version, winRate: percentage(row.win_rate) }))
    }
  },

  matchups(data: Qq101Validated<'matchups'>, championId: number) {
    const rows = (rows: typeof data.favorable) =>
      rows.map((row) => ({
        championId: row.champion_id,
        winRate: percentage(row.win_rate),
        advantage: percentage(row.advantage)
      }))

    return {
      championId,
      date: data.date ?? '',
      favorable: rows(data.favorable),
      unfavorable: rows(data.unfavorable)
    }
  },

  synergies(data: Qq101Validated<'synergies'>, championId: number) {
    return {
      championId,
      date: data.date ?? '',
      synergies: data.rows.map((row) => ({
        championId: row.champion_id,
        winRate: percentage(row.win_rate),
        games: row.games
      }))
    }
  },

  spells(data: Qq101Validated<'spells'>, championId: number) {
    const recommendations = data.rows
      .map((row) => ({
        summonerSpellIds:
          row.second_id === 4 && row.first_id !== 4
            ? [row.second_id, row.first_id]
            : [row.first_id, row.second_id],
        winRate: percentage(row.win_rate),
        pickRate: percentage(row.pick_rate)
      }))
      .sort((a, b) => (b.pickRate ?? 0) - (a.pickRate ?? 0))
      .slice(0, 5)
      .map((row, index) => ({ ...row, rank: index + 1 }))
    return { championId, date: data.date ?? '', recommendations }
  },

  skills(data: Qq101Validated<'skills'>, championId: number) {
    const priorities = data.rows.map((row) => ({
      abilityCodes: row.abilities,
      pickRate: percentage(row.pick_rate),
      winRate: percentage(row.win_rate)
    }))
    const options = data.rows.flatMap((row) => {
      const abilityPriority = row.abilities.map((code) => ABILITY_KEYS[code])
      if (row.builds.length === 0) {
        return [
          {
            abilityPriority,
            levelOrder: [] as string[],
            pickRate: percentage(row.pick_rate),
            winRate: percentage(row.win_rate)
          }
        ]
      }

      return row.builds.map((build) => ({
        abilityPriority,
        levelOrder: build.abilities.map((code) => ABILITY_KEYS[code]),
        pickRate: percentage(build.pick_rate),
        winRate: percentage(build.win_rate)
      }))
    })

    return {
      championId,
      date: data.date ?? '',
      priorities,
      abilityPriority: options[0]?.abilityPriority ?? [],
      levelOrder: options.find((row) => row.levelOrder.length > 0)?.levelOrder ?? [],
      options
    }
  },

  tiers(data: Qq101Validated<'tiers'>, championId: number) {
    return {
      championId,
      date: data.date ?? '',
      tiers: data.rows.map((row) => ({
        tierId: row.tier_id,
        winRate: percentage(row.win_rate),
        pickRate: percentage(row.pick_rate),
        banRate: percentage(row.ban_rate)
      }))
    }
  },

  build(data: Qq101Validated<'build'>, championId: number) {
    return {
      championId,
      date: data.date ?? '',
      slots: {
        starting: buildOptions(data.starting),
        boots: buildOptions(data.shoes),
        core: buildOptions(data.core),
        fourth: buildOptions(data.forth),
        fifth: buildOptions(data.fifth),
        sixth: buildOptions(data.sixth)
      }
    }
  },

  runes(data: Qq101Validated<'runes'>, championId: number) {
    return {
      championId,
      date: data.date ?? '',
      pages: data.rows
        .map((row) => ({
          rank: row.rank ?? 1,
          primaryStyleId: KEYSTONE_STYLES[row.keystone_id] ?? null,
          secondaryStyleId:
            row.secondary_style === null ? null : RUNE_STYLE_BY_CODE[row.secondary_style],
          primaryRuneIds: row.rune_ids.slice(0, 4),
          secondaryRuneIds: row.rune_ids.slice(4, 6),
          statShardIds: row.rune_ids.slice(6, 9),
          pickRate: percentage(row.pick_rate),
          winRate: percentage(row.win_rate),
          games: row.games ?? 0
        }))
        .sort((a, b) => a.rank - b.rank)
    }
  },

  positions(data: Qq101Validated<'positions'>, championId: number) {
    return {
      championId,
      date: data.date ?? '',
      positions: data.rows.map((row) => ({
        position: row.lane,
        pickRate: percentage(row.pick_rate),
        winRate: percentage(row.win_rate),
        banRate: percentage(row.ban_rate),
        strengthTier: row.tier || null,
        rank: row.rank,
        share: percentage(row.share)
      }))
    }
  },

  durations(data: Qq101Validated<'durations'>, championId: number) {
    return {
      championId,
      date: data.date ?? '',
      durations: data.rows.map((row) => ({
        rangeId: row.range_id,
        range: DURATION_RANGES[row.range_id] ?? `Range ${row.range_id}`,
        winRate: percentage(row.win_rate),
        rank: row.rank
      }))
    }
  },

  aram(data: Qq101Validated<'aram'>, date: string) {
    return { date, champions: data.rows.map(aramChampion) }
  },

  mayhem(data: Qq101Validated<'mayhem'>, date: string) {
    return {
      date,
      champions: data.rows.map((row) => ({
        ...aramChampion(row),
        lowestRankAugmentIds: row.augment_ids
      }))
    }
  },

  augments(data: Qq101Validated<'augments'>) {
    return {
      date: data.date ?? '',
      augments: data.rows.map((row) => ({
        augmentId: row.augment_id,
        augmentTier: row.quality === 255 ? null : row.quality,
        pickRate: row.pick_rate,
        pickRank: row.pick_rank,
        pickRankChange: row.pick_change,
        pickRankImprovement: row.pick_change === null ? null : -row.pick_change,
        winRate: row.win_rate,
        winRank: row.win_rank,
        winRankChange: row.win_change,
        winRankImprovement: row.win_change === null ? null : -row.win_change,
        bestChampions: row.champion_ids.map((championId) => ({ championId }))
      }))
    }
  },

  pairs(data: Qq101Validated<'pairs'>) {
    return {
      date: data.date ?? '',
      synergies: data.rows.map((row) => ({
        champions: row.champion_ids.map((championId) => ({ championId })),
        winRate: row.win_rate,
        pickRate: row.pick_rate,
        rank: row.rank
      }))
    }
  },

  lanes(data: Qq101Validated<'lanes'>) {
    return {
      date: data.date ?? '',
      champions: data.rows.map((row) => ({
        classicChampionId: row.champion_id,
        positions: row.lanes
      }))
    }
  },

  jungle(data: Qq101Validated<'jungle'>, championId: number) {
    return {
      championId,
      date: data.date ?? '',
      groups: data.rows.map((row) => ({
        startingCamp: row.starting_camp === '255' ? null : row.starting_camp,
        teamId: row.team_id,
        routes: row.routes
          .map((route) => ({
            rank: route.rank,
            camps: route.camps,
            games: route.games,
            pickRate: percentage(route.pick_rate),
            winRate: percentage(route.win_rate)
          }))
          .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
      }))
    }
  },

  mayhemDetails(data: Qq101Validated<'mayhemDetails'>, championId: number) {
    const items = (rows: typeof data.starting) =>
      rows.map((row) => ({ itemIds: row.item_ids, pickRate: row.pick_rate, winRate: row.win_rate }))

    return {
      championId,
      date: data.date ?? '',
      augments: heroAugments(data.augments),
      augmentsByQuality: heroAugments(data.quality_augments),
      starting: items(data.starting),
      boots: items(data.boots),
      items: nestedItems(data.items),
      core: nestedItems(data.core),
      builds: data.builds.map((row) => ({
        rank: row.rank,
        itemIds: row.item_ids,
        pickRate: row.pick_rate,
        winRate: row.win_rate
      })),
      partners: data.partners.map((row) => ({
        championId: row.champion_id,
        winRate: row.win_rate,
        pickRate: row.pick_rate,
        rank: row.rank
      })),
      skillOrders: data.skills
        .map((row) => ({
          rank: row.rank ?? 0,
          abilityCodes: row.abilities,
          pickRate: basisPoints(row.pick_rate),
          winRate: basisPoints(row.win_rate),
          plans: row.plans
            .map((plan) => ({
              rank: plan.rank ?? 0,
              abilityCodes: plan.abilities,
              pickRate: basisPoints(plan.pick_rate),
              winRate: basisPoints(plan.win_rate)
            }))
            .sort((a, b) => a.rank - b.rank)
        }))
        .sort((a, b) => a.rank - b.rank)
    }
  }
}

export type Qq101AkariData<K extends keyof typeof qq101Akari> = ReturnType<(typeof qq101Akari)[K]>
