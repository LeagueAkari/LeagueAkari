import { describe, expect, it, vi } from 'vitest'

import { ONGOING_GAME_MAIN_NAMESPACE } from './context'
import { OngoingGameIpcHandlers } from './ipc-handlers'

describe('OngoingGameIpcHandlers', () => {
  it('reloads only saved info when reloadPlayer includes savedInfo', () => {
    const handlers: Record<string, (...args: any[]) => void> = {}
    const context = {
      ipc: {
        onCall: vi.fn((_namespace, name, handler) => {
          handlers[name] = handler
        })
      },
      state: {
        additionalGame: {},
        apiShouldUse: 'lcu',
        championMastery: {},
        gameDetails: {},
        matchHistory: {},
        matchHistoryTagParams: {},
        rankedStats: {},
        savedInfo: {},
        summoner: {},
        teams: {}
      },
      settings: {
        matchHistoryLoadCount: 10
      }
    }
    const matchHistory = {
      loadMatchHistory: vi.fn(),
      updateMatchHistories: vi.fn()
    }
    const playerData = {
      reloadPlayer: vi.fn(),
      updateChampionMasteries: vi.fn(),
      updateRankedStats: vi.fn(),
      updateSavedInfo: vi.fn(),
      updateSummoners: vi.fn()
    }
    const additionalInfo = {
      update: vi.fn()
    }

    new OngoingGameIpcHandlers(
      context as any,
      matchHistory as any,
      playerData as any,
      additionalInfo as any
    ).register()

    handlers.reloadPlayer(undefined, 'player-1', { includes: ['savedInfo'] })

    expect(context.ipc.onCall).toHaveBeenCalledWith(
      ONGOING_GAME_MAIN_NAMESPACE,
      'reloadPlayer',
      expect.any(Function)
    )
    expect(playerData.reloadPlayer).toHaveBeenCalledWith('player-1', { includes: ['savedInfo'] })
    expect(matchHistory.loadMatchHistory).not.toHaveBeenCalled()
  })
})
