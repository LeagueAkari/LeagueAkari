import type { ChampSelectSession, ChampSelectTeam } from '@shared/types/league-client/champ-select'
import { describe, expect, it } from 'vitest'

import {
  EMPTY_DRAFT_CHAMP_SELECT_SNAPSHOT,
  readDraftChampSelectSnapshot,
  toChampionDataPosition
} from './champ-select-snapshot'

function member(overrides: Partial<ChampSelectTeam>): ChampSelectTeam {
  return overrides as ChampSelectTeam
}

function session(overrides: {
  localPlayerCellId: number
  myTeam?: ChampSelectTeam[]
  theirTeam?: ChampSelectTeam[]
}): ChampSelectSession {
  return {
    localPlayerCellId: overrides.localPlayerCellId,
    myTeam: overrides.myTeam ?? [],
    theirTeam: overrides.theirTeam ?? []
  } as ChampSelectSession
}

describe('draft advisor position mapping', () => {
  it('normalizes the position spellings the client actually emits', () => {
    expect(toChampionDataPosition('TOP')).toBe('top')
    expect(toChampionDataPosition('JUNGLE')).toBe('jungle')
    expect(toChampionDataPosition('MIDDLE')).toBe('middle')
    expect(toChampionDataPosition('MID')).toBe('middle')
    expect(toChampionDataPosition('ADC')).toBe('bottom')
    expect(toChampionDataPosition('BOTTOM')).toBe('bottom')
    expect(toChampionDataPosition('UTILITY')).toBe('utility')
    expect(toChampionDataPosition('SUPPORT')).toBe('utility')
  })

  it('returns null instead of guessing when the position is empty or unknown', () => {
    expect(toChampionDataPosition('')).toBeNull()
    expect(toChampionDataPosition(null)).toBeNull()
    expect(toChampionDataPosition(undefined)).toBeNull()
    expect(toChampionDataPosition('FILL')).toBeNull()
  })
})

describe('draft advisor champ select snapshot', () => {
  it('reports an empty snapshot when there is no session', () => {
    expect(readDraftChampSelectSnapshot(null)).toEqual(EMPTY_DRAFT_CHAMP_SELECT_SNAPSHOT)
    expect(readDraftChampSelectSnapshot(undefined)).toEqual(EMPTY_DRAFT_CHAMP_SELECT_SNAPSHOT)
  })

  it('is not actionable while nothing has been picked', () => {
    const snapshot = readDraftChampSelectSnapshot(
      session({ localPlayerCellId: 0, myTeam: [member({ cellId: 0 })] })
    )

    expect(snapshot.actionable).toBe(false)
    expect(snapshot.allyChampionIds).toEqual([])
    expect(snapshot.enemyChampionIds).toEqual([])
    expect(snapshot.selfChampionId).toBeNull()
  })

  it('prefers a locked champion over the pick intent for allies', () => {
    const snapshot = readDraftChampSelectSnapshot(
      session({
        localPlayerCellId: 0,
        myTeam: [member({ cellId: 0, championId: 22, championPickIntent: 99 })]
      })
    )

    expect(snapshot.allyChampionIds).toEqual([22])
  })

  it('uses the pick intent when an ally has not locked in yet', () => {
    const snapshot = readDraftChampSelectSnapshot(
      session({
        localPlayerCellId: 0,
        myTeam: [member({ cellId: 0, championId: 0, championPickIntent: 99 })]
      })
    )

    expect(snapshot.allyChampionIds).toEqual([99])
  })

  it('does not leak the enemy pick intent into the enemy team', () => {
    const snapshot = readDraftChampSelectSnapshot(
      session({
        localPlayerCellId: 0,
        theirTeam: [member({ cellId: 5, championId: 0, championPickIntent: 99 })]
      })
    )

    expect(snapshot.enemyChampionIds).toEqual([])
    expect(snapshot.actionable).toBe(false)
  })

  it('collects both teams once anything is locked in', () => {
    const snapshot = readDraftChampSelectSnapshot(
      session({
        localPlayerCellId: 0,
        myTeam: [member({ cellId: 0, championId: 22 }), member({ cellId: 1, championId: 64 })],
        theirTeam: [member({ cellId: 5, championId: 103 })]
      })
    )

    expect(snapshot.allyChampionIds).toEqual([22, 64])
    expect(snapshot.enemyChampionIds).toEqual([103])
    expect(snapshot.actionable).toBe(true)
  })

  it('de-duplicates champions that appear more than once', () => {
    const snapshot = readDraftChampSelectSnapshot(
      session({
        localPlayerCellId: 0,
        myTeam: [member({ cellId: 0, championId: 22 }), member({ cellId: 1, championId: 22 })],
        theirTeam: [member({ cellId: 5, championId: 103 }), member({ cellId: 6, championId: 103 })]
      })
    )

    expect(snapshot.allyChampionIds).toEqual([22])
    expect(snapshot.enemyChampionIds).toEqual([103])
  })

  it('identifies the local player and their position', () => {
    const snapshot = readDraftChampSelectSnapshot(
      session({
        localPlayerCellId: 3,
        myTeam: [
          member({ cellId: 0, championId: 22, assignedPosition: 'TOP' }),
          member({ cellId: 3, championId: 0, championPickIntent: 81, assignedPosition: 'ADC' })
        ]
      })
    )

    expect(snapshot.selfChampionId).toBe(81)
    expect(snapshot.selfPosition).toBe('bottom')
  })

  it('leaves the position unknown when the client reports an unhandled value', () => {
    const snapshot = readDraftChampSelectSnapshot(
      session({
        localPlayerCellId: 0,
        myTeam: [member({ cellId: 0, championId: 22, assignedPosition: '' })]
      })
    )

    expect(snapshot.selfPosition).toBeNull()
    expect(snapshot.selfChampionId).toBe(22)
  })

  it('ignores champion ids of zero', () => {
    const snapshot = readDraftChampSelectSnapshot(
      session({
        localPlayerCellId: 0,
        myTeam: [member({ cellId: 0, championId: 0, championPickIntent: 0 })],
        theirTeam: [member({ cellId: 5, championId: 0 })]
      })
    )

    expect(snapshot.allyChampionIds).toEqual([])
    expect(snapshot.enemyChampionIds).toEqual([])
  })
})
