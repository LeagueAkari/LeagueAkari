import { bench, describe } from 'vitest'

import { RadixEventEmitter } from './event-emitter'
import { RadixMatcher } from './radix-matcher'

const ROUTE_GROUP_SIZE = 500
const LOOKUP_COUNT = 1_000

const staticRoutes = Array.from(
  { length: ROUTE_GROUP_SIZE },
  (_, index) => [`/lol-gameflow/v1/session/${index}`, `static-${index}`] as const
)

const placeholderRoutes = Array.from(
  { length: ROUTE_GROUP_SIZE },
  (_, index) =>
    [`/lol-summoner/v1/summoners/:puuid/profile-${index}`, `placeholder-${index}`] as const
)

const wildcardRoutes = Array.from(
  { length: ROUTE_GROUP_SIZE },
  (_, index) => [`/lol-chat/v1/conversations/${index}/**`, `wildcard-${index}`] as const
)

const staticPaths = Array.from(
  { length: LOOKUP_COUNT },
  (_, index) => `/lol-gameflow/v1/session/${index % ROUTE_GROUP_SIZE}`
)

const placeholderPaths = Array.from(
  { length: LOOKUP_COUNT },
  (_, index) => `/lol-summoner/v1/summoners/player-${index}/profile-${index % ROUTE_GROUP_SIZE}`
)

const wildcardPaths = Array.from(
  { length: LOOKUP_COUNT },
  (_, index) => `/lol-chat/v1/conversations/${index % ROUTE_GROUP_SIZE}/messages/${index}/events`
)

const mixedPath = '/bench/mixed/target'
const longMixedRoute =
  '/bench/long/:namespace/v1/*/summoners/:puuid/matches/*/timeline/:frameId/events/*/details/:detailId'
const longMixedPath =
  '/bench/long/lol/v1/region-1/summoners/player-1/matches/match-1/timeline/42/events/event-1/details/detail-1'

let cursor = 0
let sink: unknown

const nextIndex = () => {
  const index = cursor
  cursor = (cursor + 1) % LOOKUP_COUNT
  return index
}

const buildMatcher = () => {
  const matcher = new RadixMatcher()

  for (const [route, data] of staticRoutes) {
    matcher.insert(route, data)
  }

  for (const [route, data] of placeholderRoutes) {
    matcher.insert(route, data)
  }

  for (const [route, data] of wildcardRoutes) {
    matcher.insert(route, data)
  }

  matcher.insert(mixedPath, 'mixed-static')
  matcher.insert('/bench/mixed/:id', 'mixed-placeholder')
  matcher.insert('/bench/**', 'mixed-wildcard')
  matcher.insert(longMixedRoute, 'long-mixed')

  return matcher
}

const matcher = buildMatcher()

const buildEmitter = () => {
  const emitter = new RadixEventEmitter()
  const listener = (data: unknown, params: unknown) => {
    sink = [data, params]
  }

  for (const [route] of staticRoutes) {
    emitter.on(route, listener)
  }

  for (const [route] of placeholderRoutes) {
    emitter.on(route, listener)
  }

  for (const [route] of wildcardRoutes) {
    emitter.on(route, listener)
  }

  emitter.on(mixedPath, listener)
  emitter.on('/bench/mixed/:id', listener)
  emitter.on('/bench/**', listener)

  return emitter
}

const emitter = buildEmitter()

describe('RadixMatcher benchmark', () => {
  bench('insert static, placeholder, and wildcard routes', () => {
    sink = buildMatcher()
  })

  bench('findOne static route', () => {
    sink = matcher.findOne(staticPaths[nextIndex()])
  })

  bench('findOne placeholder route', () => {
    sink = matcher.findOne(placeholderPaths[nextIndex()])
  })

  bench('findOne wildcard route', () => {
    sink = matcher.findOne(wildcardPaths[nextIndex()])
  })

  bench('findAll exact, placeholder, and wildcard matches', () => {
    sink = matcher.findAll(mixedPath)
  })

  bench('findOne long mixed placeholder route', () => {
    sink = matcher.findOne(longMixedPath)
  })
})

describe('RadixEventEmitter benchmark', () => {
  bench('emit exact, placeholder, and wildcard listeners', () => {
    emitter.emit(mixedPath, { eventType: 'Update' })
  })
})

export const getRadixMatcherBenchSink = () => sink
