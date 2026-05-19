import { describe, expect, it } from 'vitest'

import { RadixMatcher } from './radix-matcher'

const dataOf = (results: { data: unknown }[]) => results.map((r) => r.data)

describe('RadixMatcher.validateRoute', () => {
  it('accepts static, placeholder, anonymous placeholder, and wildcard routes', () => {
    expect(() => RadixMatcher.validateRoute('/lol-gameflow/v1/session')).not.toThrow()
    expect(() => RadixMatcher.validateRoute('/lol-summoner/v1/summoners/:puuid')).not.toThrow()
    expect(() => RadixMatcher.validateRoute('/lol-chat/v1/conversations/*/messages')).not.toThrow()
    expect(() => RadixMatcher.validateRoute('/lol-champ-select/v1/session/**')).not.toThrow()
    expect(() => RadixMatcher.validateRoute('/**')).not.toThrow()
  })

  it('rejects empty routes and malformed dynamic segments', () => {
    expect(() => RadixMatcher.validateRoute('')).toThrow('route should not be empty')
    expect(() => RadixMatcher.validateRoute('/')).toThrow('route should not be empty')
    expect(() => RadixMatcher.validateRoute('/lol/:')).toThrow('placeholder should have a name')
    expect(() => RadixMatcher.validateRoute('/lol/**/session')).toThrow(
      'wildcard should be the last part'
    )
    expect(() => RadixMatcher.validateRoute('/lol/**session')).toThrow('wildcard should be **')
    expect(() => RadixMatcher.validateRoute('/lol/*session')).toThrow(
      'placeholder * should be the only part'
    )
    expect(() => RadixMatcher.validateRoute('/lol/game:flow')).toThrow(
      'normal nodes should not have : or *'
    )
    expect(() => RadixMatcher.validateRoute('/lol/game*flow')).toThrow(
      'normal nodes should not have : or *'
    )
  })
})

describe('RadixMatcher static routes', () => {
  it('matches static routes exactly and returns static routes before dynamic matches', () => {
    const matcher = new RadixMatcher()
    matcher.insert('/lol-gameflow/v1/session', 'static-session')
    matcher.insert('/lol-gameflow/v1/:resource', 'dynamic-resource')

    expect(matcher.findOne('/lol-gameflow/v1/session')).toEqual({ data: 'static-session' })
    expect(dataOf(matcher.findAll('/lol-gameflow/v1/session'))).toEqual([
      'static-session',
      'dynamic-resource'
    ])
    expect(matcher.findOne('/lol-gameflow/v1/session/extra')).toBeUndefined()
  })

  it('gets, removes, and clears static routes', () => {
    const matcher = new RadixMatcher()
    matcher.insert('/lol-gameflow/v1/session', 'session')

    expect(matcher.getRouteData('/lol-gameflow/v1/session')).toEqual({ data: 'session' })
    expect(matcher.remove('/lol-gameflow/v1/session')).toBe(true)
    expect(matcher.findAll('/lol-gameflow/v1/session')).toEqual([])
    expect(matcher.remove('/lol-gameflow/v1/session')).toBe(false)

    matcher.insert('/lol-gameflow/v1/session', 'session')
    matcher.clear()
    expect(matcher.findOne('/lol-gameflow/v1/session')).toBeUndefined()
  })

  it('rejects nullish data and duplicate static routes', () => {
    const matcher = new RadixMatcher()

    expect(() => matcher.insert('/lol-gameflow/v1/session', null)).toThrow(
      'data should not be undefined or null'
    )
    expect(() => matcher.insert('/lol-gameflow/v1/session', undefined)).toThrow(
      'data should not be undefined or null'
    )

    matcher.insert('/lol-gameflow/v1/session', 'session')
    expect(() => matcher.insert('/lol-gameflow/v1/session', 'session-2')).toThrow(
      "route '/lol-gameflow/v1/session' already exists"
    )
  })
})

describe('RadixMatcher placeholder routes', () => {
  it('captures named placeholder parameters', () => {
    const matcher = new RadixMatcher()
    matcher.insert('/lol-summoner/v1/summoners/:puuid', 'summoner')

    expect(matcher.findOne('/lol-summoner/v1/summoners/player-1')).toEqual({
      data: 'summoner',
      params: { puuid: 'player-1' }
    })
    expect(matcher.getRouteData('/lol-summoner/v1/summoners/:puuid')).toEqual({
      data: 'summoner'
    })
    expect(matcher.getRouteData('/lol-summoner/v1/summoners/player-1')).toBeUndefined()
  })

  it('captures anonymous placeholders in stable _N keys', () => {
    const matcher = new RadixMatcher()
    matcher.insert('/lol-chat/v1/conversations/*/messages/*', 'chat-message')

    expect(matcher.findOne('/lol-chat/v1/conversations/conv-1/messages/msg-1')).toEqual({
      data: 'chat-message',
      params: { _0: 'conv-1', _1: 'msg-1' }
    })
  })

  it('allows falsy non-null data on dynamic routes', () => {
    const matcher = new RadixMatcher()
    matcher.insert('/flags/:name', false)
    matcher.insert('/counts/:name', 0)
    matcher.insert('/labels/:name', '')

    expect(matcher.findOne('/flags/enabled')?.data).toBe(false)
    expect(matcher.findOne('/counts/zero')?.data).toBe(0)
    expect(matcher.findOne('/labels/empty')?.data).toBe('')
    expect(matcher.getRouteData('/flags/:name')?.data).toBe(false)
  })

  it('rejects duplicate dynamic routes, including routes with anonymous placeholders', () => {
    const matcher = new RadixMatcher()
    matcher.insert('/lol-summoner/v1/summoners/:puuid', 'summoner')
    matcher.insert('/lol-chat/v1/conversations/:conversationId/*', 'chat-message')

    expect(() => matcher.insert('/lol-summoner/v1/summoners/:puuid', 'summoner-2')).toThrow(
      "route '/lol-summoner/v1/summoners/:puuid' already exists"
    )
    expect(() => matcher.insert('/lol-chat/v1/conversations/:conversationId/*', 'chat-2')).toThrow(
      "route '/lol-chat/v1/conversations/:conversationId/*' already exists"
    )
    expect(dataOf(matcher.findAll('/lol-chat/v1/conversations/conv-1/msg-1'))).toEqual([
      'chat-message'
    ])
  })

  it('removes one dynamic route without pruning shared prefixes used by sibling routes', () => {
    const matcher = new RadixMatcher()
    matcher.insert('/lol-summoner/v1/summoners/:puuid/profile', 'profile')
    matcher.insert('/lol-summoner/v1/summoners/:puuid/ranked-stats', 'ranked')

    expect(matcher.remove('/lol-summoner/v1/summoners/:puuid/profile')).toBe(true)
    expect(matcher.findOne('/lol-summoner/v1/summoners/player-1/profile')).toBeUndefined()
    expect(matcher.findOne('/lol-summoner/v1/summoners/player-1/ranked-stats')).toEqual({
      data: 'ranked',
      params: { puuid: 'player-1' }
    })
  })

  it('captures many named and anonymous placeholders across a long route', () => {
    const matcher = new RadixMatcher()
    matcher.insert(
      '/deep/:namespace/v1/*/summoners/:puuid/matches/*/timeline/:frameId/events/*/details/:detailId',
      'deep-dynamic'
    )

    expect(
      matcher.findOne(
        '/deep/lol/v1/region-1/summoners/player-1/matches/match-1/timeline/42/events/event-1/details/detail-1'
      )
    ).toEqual({
      data: 'deep-dynamic',
      params: {
        namespace: 'lol',
        _0: 'region-1',
        puuid: 'player-1',
        _1: 'match-1',
        frameId: '42',
        _2: 'event-1',
        detailId: 'detail-1'
      }
    })
  })
})

describe('RadixMatcher wildcard routes', () => {
  it('matches a wildcard route at the prefix itself and at deeper paths', () => {
    const matcher = new RadixMatcher()
    matcher.insert('/lol-champ-select/v1/session/**', 'champ-select')

    expect(matcher.findOne('/lol-champ-select/v1/session')).toEqual({
      data: 'champ-select',
      params: {}
    })
    expect(matcher.findOne('/lol-champ-select/v1/session/actions/1')).toEqual({
      data: 'champ-select',
      params: { __: 'actions/1' }
    })
  })

  it('combines wildcard suffix and placeholder params', () => {
    const matcher = new RadixMatcher()
    matcher.insert('/lol-chat/v1/conversations/:conversationId/**', 'conversation')

    expect(matcher.findOne('/lol-chat/v1/conversations/conv-1/messages/msg-1')).toEqual({
      data: 'conversation',
      params: { __: 'messages/msg-1', conversationId: 'conv-1' }
    })
  })

  it('supports the root wildcard route', () => {
    const matcher = new RadixMatcher()
    matcher.insert('/**', 'all')

    expect(matcher.findOne('/')).toEqual({ data: 'all', params: {} })
    expect(matcher.findOne('/lol-gameflow/v1/session')).toEqual({
      data: 'all',
      params: { __: 'lol-gameflow/v1/session' }
    })
  })

  it('keeps wildcard routes separate from exact prefix routes', () => {
    const matcher = new RadixMatcher()
    matcher.insert('/lol-gameflow/v1/session/**', 'session-tree')
    matcher.insert('/lol-gameflow/v1/session', 'session-root')

    expect(dataOf(matcher.findAll('/lol-gameflow/v1/session'))).toEqual([
      'session-root',
      'session-tree'
    ])
    expect(matcher.getRouteData('/lol-gameflow/v1/session')).toEqual({ data: 'session-root' })
    expect(matcher.getRouteData('/lol-gameflow/v1/session/**')).toEqual({
      data: 'session-tree'
    })
  })

  it('removes wildcard routes without leaving stale prefix matches', () => {
    const matcher = new RadixMatcher()
    matcher.insert('/lol-gameflow/v1/session/**', 'session-tree')
    matcher.insert('/lol-gameflow/v1/session', 'session-root')

    expect(matcher.remove('/lol-gameflow/v1/session/**')).toBe(true)
    expect(matcher.findAll('/lol-gameflow/v1/session/actions')).toEqual([])
    expect(dataOf(matcher.findAll('/lol-gameflow/v1/session'))).toEqual(['session-root'])
    expect(matcher.remove('/lol-gameflow/v1/session/**')).toBe(false)
  })

  it('findOne prefers the most specific dynamic route before a broad wildcard', () => {
    const matcher = new RadixMatcher()
    matcher.insert('/lol-chat/**', 'all-chat')
    matcher.insert('/lol-chat/v1/conversations/:conversationId/messages/:messageId', 'message')

    expect(matcher.findOne('/lol-chat/v1/conversations/conv-1/messages/msg-1')).toEqual({
      data: 'message',
      params: {
        conversationId: 'conv-1',
        messageId: 'msg-1'
      }
    })
  })

  it('matches and removes one route among many wildcard routes sharing a prefix', () => {
    const matcher = new RadixMatcher()
    matcher.insert('/lol-chat/**', 'all-chat')

    for (let i = 0; i < 100; i++) {
      matcher.insert(`/lol-chat/v1/conversations/${i}/**`, `conversation-${i}`)
    }

    expect(matcher.findOne('/lol-chat/v1/conversations/42/messages/1')).toEqual({
      data: 'conversation-42',
      params: { __: 'messages/1' }
    })
    expect(dataOf(matcher.findAll('/lol-chat/v1/conversations/42/messages/1'))).toEqual([
      'all-chat',
      'conversation-42'
    ])

    expect(matcher.remove('/lol-chat/v1/conversations/42/**')).toBe(true)
    expect(matcher.findOne('/lol-chat/v1/conversations/42/messages/1')).toEqual({
      data: 'all-chat',
      params: { __: 'v1/conversations/42/messages/1' }
    })
    expect(matcher.findOne('/lol-chat/v1/conversations/43/messages/1')).toEqual({
      data: 'conversation-43',
      params: { __: 'messages/1' }
    })
  })
})

describe('RadixMatcher long static routes', () => {
  it('matches a long static route exactly without matching shorter or longer paths', () => {
    const matcher = new RadixMatcher()
    const longRoute = `/${Array.from({ length: 40 }, (_, index) => `segment-${index}`).join('/')}`

    matcher.insert(longRoute, 'long-static')

    expect(matcher.findOne(longRoute)).toEqual({ data: 'long-static' })
    expect(matcher.findOne(longRoute.split('/').slice(0, -1).join('/'))).toBeUndefined()
    expect(matcher.findOne(`${longRoute}/extra`)).toBeUndefined()
  })
})
