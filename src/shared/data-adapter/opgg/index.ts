import { ResponseParser } from '../response-parser'
import { toOpggChampionBalance } from './akari-adapter'
import { createOpggSchemas } from './schemas'

const parser = new ResponseParser()
const schemas = createOpggSchemas(parser)

export function parseOpggRankedOverview(input: unknown) {
  return parser.parse(() => schemas.rankedOverview.parse(input))
}

export function parseOpggWinRateOverview(input: unknown) {
  return parser.parse(() => schemas.winRateOverview.parse(input))
}

export function parseOpggArenaOverview(input: unknown) {
  return parser.parse(() => schemas.arenaOverview.parse(input))
}

export function parseOpggRankedCounters(input: unknown) {
  return parser.parse(() => schemas.rankedCounters.parse(input))
}

export function parseOpggRankedDetails(input: unknown, championId?: number) {
  return parser.parse(() => {
    const response = schemas.rankedDetails.parse(input)
    if (!response.data.summary.id && championId) response.data.summary.id = championId

    return response
  })
}

export function parseOpggWinRateDetails(input: unknown, championId?: number) {
  return parser.parse(() => {
    const response = schemas.winRateDetails.parse(input)
    if (!response.data.summary.id && championId) response.data.summary.id = championId

    return response
  })
}

export function parseOpggArenaDetails(input: unknown, championId?: number) {
  return parser.parse(() => {
    const response = schemas.arenaDetails.parse(input)
    if (!response.data.summary.id && championId) response.data.summary.id = championId

    return response
  })
}

export function parseOpggVersions(input: unknown) {
  return parser.parse(() => schemas.versions.parse(input))
}

export function parseOpggMayhemTiers(input: unknown) {
  return parser.parse(() => schemas.mayhemTiers.parse(input))
}

export function parseOpggMayhemAugments(input: unknown) {
  return parser.parse(() => schemas.mayhemAugments.parse(input))
}

export function parseOpggAramBalance(input: unknown) {
  return parser.parse(() => schemas.balance.parse(input).data.map(toOpggChampionBalance))
}
