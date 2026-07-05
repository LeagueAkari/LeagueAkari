import { describe, expect, it, vi } from 'vitest'

import { OngoingGamePlayerDataLoader } from './player-data-loader'

describe('OngoingGamePlayerDataLoader', () => {
  it('reloads only included saved info without cancelling unrelated player data tasks', () => {
    const context = {
      queueKeeper: {
        cancelByTags: vi.fn()
      }
    }
    const loader = new OngoingGamePlayerDataLoader(context as any, {} as any)
    const loadSummoner = vi.spyOn(loader, 'loadSummoner').mockResolvedValue(undefined)
    const loadRankedStats = vi.spyOn(loader, 'loadRankedStats').mockResolvedValue(undefined)
    const loadSavedInfo = vi.spyOn(loader, 'loadSavedInfo').mockResolvedValue(undefined)
    const loadChampionMastery = vi.spyOn(loader, 'loadChampionMastery').mockResolvedValue(undefined)

    loader.reloadPlayer('player-1', { includes: ['savedInfo'] })

    expect(context.queueKeeper.cancelByTags).toHaveBeenCalledWith(['player-1', 'saved-info'], 'and')
    expect(loadSavedInfo).toHaveBeenCalledWith('player-1', { force: true })
    expect(loadSummoner).not.toHaveBeenCalled()
    expect(loadRankedStats).not.toHaveBeenCalled()
    expect(loadChampionMastery).not.toHaveBeenCalled()
  })
})
