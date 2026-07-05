import { describe, expect, it } from 'vitest'

import { ONGOING_GAME_PLAYER_RELOAD_SCOPES, resolveOngoingGamePlayerReloadScopes } from './reload'

describe('resolveOngoingGamePlayerReloadScopes', () => {
  it('defaults to every player reload scope', () => {
    expect(resolveOngoingGamePlayerReloadScopes()).toEqual(ONGOING_GAME_PLAYER_RELOAD_SCOPES)
  })

  it('uses includes as the exact reload scope list', () => {
    expect(resolveOngoingGamePlayerReloadScopes({ includes: ['savedInfo'] })).toEqual(['savedInfo'])
  })

  it('removes excluded scopes from the default scope list', () => {
    expect(resolveOngoingGamePlayerReloadScopes({ excludes: ['matchHistory'] })).toEqual([
      'summoner',
      'rankedStats',
      'savedInfo',
      'championMastery'
    ])
  })

  it('rejects using includes and excludes together', () => {
    expect(() =>
      resolveOngoingGamePlayerReloadScopes({
        includes: ['savedInfo'],
        excludes: ['matchHistory']
      } as any)
    ).toThrow('includes and excludes cannot be used together')
  })
})
