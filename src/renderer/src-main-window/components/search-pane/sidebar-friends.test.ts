import { describe, expect, test } from 'vitest'

import { isFriendSpectatable } from './sidebar-friends'

type FriendSpectateState = Parameters<typeof isFriendSpectatable>[0]
type FriendSpectateStateOverrides = Omit<Partial<FriendSpectateState>, 'lol'> & {
  lol?: Partial<FriendSpectateState['lol']>
}

const createFriend = ({
  lol,
  ...overrides
}: FriendSpectateStateOverrides = {}): FriendSpectateState =>
  ({
    puuid: 'friend-puuid',
    availability: 'dnd',
    lol: {
      gameStatus: 'inGame',
      isObservable: 'ALL',
      spectatorKey: 'spectator-key',
      ...lol
    } as FriendSpectateState['lol'],
    ...overrides
  }) as FriendSpectateState

describe('isFriendSpectatable', () => {
  test('allows spectating observable in-game friends', () => {
    expect(isFriendSpectatable(createFriend())).toBe(true)
  })

  test('blocks friends who are not in game', () => {
    expect(isFriendSpectatable(createFriend({ availability: 'chat' }))).toBe(false)
    expect(isFriendSpectatable(createFriend({ lol: { gameStatus: 'outOfGame' } }))).toBe(false)
  })

  test('blocks in-game friends without spectator key', () => {
    expect(isFriendSpectatable(createFriend({ lol: { spectatorKey: '' } }))).toBe(false)
  })

  test('allows fallback to lol puuid', () => {
    expect(isFriendSpectatable(createFriend({ puuid: '', lol: { puuid: 'lol-puuid' } }))).toBe(true)
  })

  test('blocks friends without any puuid', () => {
    expect(isFriendSpectatable(createFriend({ puuid: '', lol: { puuid: '' } }))).toBe(false)
  })
})
