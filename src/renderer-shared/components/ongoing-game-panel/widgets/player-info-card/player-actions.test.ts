import { describe, expect, it } from 'vitest'

import { PLAYER_INFO_CARD_ACTION_KEYS, getPlayerInfoCardActionKeys } from './player-actions'

describe('getPlayerInfoCardActionKeys', () => {
  it('includes tag editing before match collection for non-self players', () => {
    expect(
      getPlayerInfoCardActionKeys({
        canCollectByChampion: true,
        canCollectByPosition: true,
        canEditTag: true
      })
    ).toEqual([
      PLAYER_INFO_CARD_ACTION_KEYS.editTag,
      PLAYER_INFO_CARD_ACTION_KEYS.collectByChampion,
      PLAYER_INFO_CARD_ACTION_KEYS.collectByPosition
    ])
  })

  it('omits tag editing for self players', () => {
    expect(
      getPlayerInfoCardActionKeys({
        canCollectByChampion: false,
        canCollectByPosition: false,
        canEditTag: false
      })
    ).toEqual([])
  })

  it('omits all full-feature actions in the standalone ongoing-game window', () => {
    expect(
      getPlayerInfoCardActionKeys({
        isStandaloneOngoingGameWindow: true,
        canCollectByChampion: true,
        canCollectByPosition: true,
        canEditTag: true
      })
    ).toEqual([])
  })
})
