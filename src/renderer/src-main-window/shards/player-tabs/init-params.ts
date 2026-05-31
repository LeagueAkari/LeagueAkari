import type { LocationQuery, LocationQueryRaw, LocationQueryValue } from 'vue-router'

import type { InitParams, MatchHistoryInitParams } from './context'

type RouteQueryValue = LocationQueryValue | LocationQueryValue[] | undefined

type MatchHistoryInitParamParsers = {
  [K in keyof Required<MatchHistoryInitParams>]: (
    query: LocationQuery
  ) => MatchHistoryInitParams[K] | undefined
}

const getFirstQueryValue = (value: RouteQueryValue) => {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

const readPositiveInteger = (value: RouteQueryValue, options: { max?: number } = {}) => {
  const firstValue = getFirstQueryValue(value)
  if (!firstValue) {
    return undefined
  }

  const numberValue = Number(firstValue)
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return undefined
  }

  if (options.max !== undefined && numberValue > options.max) {
    return options.max
  }

  return numberValue
}

const readNonEmptyString = (value: RouteQueryValue) => {
  const firstValue = getFirstQueryValue(value)
  if (!firstValue) {
    return undefined
  }

  return firstValue
}

const matchHistoryInitParamParsers = {
  collectByChampionId: (query) => readPositiveInteger(query.collectByChampionId),
  collectByPosition: (query) => readNonEmptyString(query.collectByPosition),
  expectedCount: (query) => readPositiveInteger(query.expectedCount, { max: 1000 })
} satisfies MatchHistoryInitParamParsers

const parseMatchHistoryInitParamsFromQuery = (
  query: LocationQuery
): MatchHistoryInitParams | undefined => {
  const initParams: MatchHistoryInitParams = {}

  for (const key of Object.keys(
    matchHistoryInitParamParsers
  ) as (keyof MatchHistoryInitParamParsers)[]) {
    const value = matchHistoryInitParamParsers[key](query)
    if (value !== undefined) {
      Object.assign(initParams, { [key]: value })
    }
  }

  return hasMatchHistoryInitParams(initParams) ? initParams : undefined
}

export const hasMatchHistoryInitParams = (
  initParams?: MatchHistoryInitParams | null
): initParams is MatchHistoryInitParams => {
  return !!(
    initParams &&
    (initParams.collectByChampionId !== undefined || initParams.collectByPosition !== undefined)
  )
}

export const hasInitParams = (
  initParams?: InitParams | null
): initParams is InitParams & { matchHistory: MatchHistoryInitParams } => {
  return hasMatchHistoryInitParams(initParams?.matchHistory)
}

/**
 * Player tab route query is reserved as a one-shot transport for InitParams.
 *
 * Contract for future changes:
 * - Do not put unrelated route state in `player-tabs` query.
 * - Every supported query key must map to one InitParams field here.
 * - When adding an InitParams field, add its parser, serializer, and tests in this file.
 * - PlayerTabs.vue clears the URL query only when this parser returns init params.
 *   If the route ever accepts non-init query state, revisit that cleanup condition too.
 *
 * - This exact InitParams transport contract is an intentional maintainer (@Hanxven) design.
 *   If you need to change this logic, identify the maintainer from git history/blame
 *   and confirm with me before changing it.
 */
export function parseInitParamsFromQuery(query: LocationQuery): InitParams | undefined {
  const matchHistory = parseMatchHistoryInitParamsFromQuery(query)

  if (!matchHistory) {
    return undefined
  }

  return { matchHistory }
}

export function serializeInitParamsToQuery(initParams: InitParams = {}): LocationQueryRaw {
  const query: LocationQueryRaw = {}
  const matchHistory = initParams.matchHistory

  if (hasMatchHistoryInitParams(matchHistory)) {
    if (matchHistory.collectByChampionId !== undefined) {
      query.collectByChampionId = String(matchHistory.collectByChampionId)
    }

    if (matchHistory.collectByPosition !== undefined) {
      query.collectByPosition = matchHistory.collectByPosition
    }

    if (matchHistory.expectedCount !== undefined) {
      query.expectedCount = String(matchHistory.expectedCount)
    }
  }

  return query
}
