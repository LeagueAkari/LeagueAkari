import type { Qq101ClassicPosition } from '@shared/http-api-axios-helper/qq101'
import type { Qq101ChampionDataPosition } from '@shared/types/champion-data'

import { ResponseParser } from '../response-parser'
import { qq101Akari } from './akari-adapter'
import { parseQq101Protocol } from './protocol-parser'
import { createQq101Schemas } from './schemas'

const parser = new ResponseParser()
const schemas = createQq101Schemas(parser)

export function parseQq101Patches(response: unknown) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('patches', response, parser)
    const data = schemas.patches.parse(parsed)
    return qq101Akari.patches(data)
  })
}

export function parseQq101TierList(response: unknown, patch: string) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('ranked', response, parser)
    const data = schemas.ranked.parse(parsed)
    return qq101Akari.ranked(data, patch)
  })
}

export function parseQq101ClassicTierList(
  response: unknown,
  position: Qq101ClassicPosition = 'all'
) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('classic', response, parser)
    const data = schemas.classic.parse(parsed)
    return qq101Akari.classic(data, position)
  })
}

export function parseQq101Trend(response: unknown, championId: number) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('trend', response, parser)
    const data = schemas.trend.parse(parsed)
    return qq101Akari.trend(data, championId)
  })
}

export function parseQq101Matchups(response: unknown, championId: number) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('matchups', response, parser)
    const data = schemas.matchups.parse(parsed)
    return qq101Akari.matchups(data, championId)
  })
}

export function parseQq101Synergies(response: unknown, championId: number) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('synergies', response, parser)
    const data = schemas.synergies.parse(parsed)
    return qq101Akari.synergies(data, championId)
  })
}

export function parseQq101SummonerSpells(response: unknown, championId: number) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('spells', response, parser)
    const data = schemas.spells.parse(parsed)
    return qq101Akari.spells(data, championId)
  })
}

export function parseQq101SkillOrder(response: unknown, championId: number) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('skills', response, parser)
    const data = schemas.skills.parse(parsed)
    return qq101Akari.skills(data, championId)
  })
}

export function parseQq101TierStats(response: unknown, championId: number) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('tiers', response, parser)
    const data = schemas.tiers.parse(parsed)
    return qq101Akari.tiers(data, championId)
  })
}

export function parseQq101Build(response: unknown, championId: number) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('build', response, parser)
    const data = schemas.build.parse(parsed)
    return qq101Akari.build(data, championId)
  })
}

export function parseQq101Runes(response: unknown, championId: number) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('runes', response, parser)
    const data = schemas.runes.parse(parsed)
    return qq101Akari.runes(data, championId)
  })
}

export function parseQq101Positions(response: unknown, championId: number) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('positions', response, parser)
    const data = schemas.positions.parse(parsed)
    return qq101Akari.positions(data, championId)
  })
}

export function parseQq101Durations(response: unknown, championId: number) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('durations', response, parser)
    const data = schemas.durations.parse(parsed)
    return qq101Akari.durations(data, championId)
  })
}

export function parseQq101AramChampions(response: unknown, date: string) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('aram', response, parser)
    const data = schemas.aram.parse(parsed)
    return qq101Akari.aram(data, date)
  })
}

export function parseQq101MayhemChampions(response: unknown, date: string) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('mayhem', response, parser)
    const data = schemas.mayhem.parse(parsed)
    return qq101Akari.mayhem(data, date)
  })
}

export function parseQq101MayhemAugments(response: unknown, _requestedDate?: string) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('augments', response, parser)
    const data = schemas.augments.parse(parsed)
    return qq101Akari.augments(data)
  })
}

export function parseQq101MayhemPairSynergies(response: unknown) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('pairs', response, parser)
    const data = schemas.pairs.parse(parsed)
    return qq101Akari.pairs(data)
  })
}

export function parseQq101ClassicLanes(response: unknown) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('lanes', response, parser)
    const data = schemas.lanes.parse(parsed)
    return qq101Akari.lanes(data)
  })
}

export function parseQq101JungleRoutes(response: unknown, championId: number) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('jungle', response, parser)
    const data = schemas.jungle.parse(parsed)
    return qq101Akari.jungle(data, championId)
  })
}

export function parseQq101MayhemDetails(response: unknown, championId: number) {
  return parser.parse(() => {
    const parsed = parseQq101Protocol('mayhemDetails', response, parser)
    const data = schemas.mayhemDetails.parse(parsed)
    return qq101Akari.mayhemDetails(data, championId)
  })
}

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
