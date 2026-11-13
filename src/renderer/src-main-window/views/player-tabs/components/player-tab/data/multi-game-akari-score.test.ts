import type { AkariScore } from '@shared/data-adapter/analysis/player'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fetchPlayerMultiGameAkariScore,
  getMultiGameAkariScoreCacheKey,
  multiGameAkariScoreLruMap
} from './multi-game-akari-score'

vi.mock('@shared/data-adapter/analysis/player', () => ({
  analyzeGames: vi.fn((games: any[]) => {
    if (games.length === 0) return null
    return {
      akariScore: {
        total: 3.5,
        outstanding: 0.8,
        extraordinary: 0.2
      }
    }
  })
}))

describe('multi-game-akari-score', () => {
  beforeEach(() => {
    multiGameAkariScoreLruMap.clear()
    vi.clearAllMocks()
  })

  describe('getMultiGameAkariScoreCacheKey', () => {
    it('normalizes undefined and all-tag to all', () => {
      expect(getMultiGameAkariScoreCacheKey('hn1', 'puuid-1', undefined, 20)).toBe(
        'hn1:puuid-1:all:20'
      )
      expect(getMultiGameAkariScoreCacheKey('hn1', 'puuid-1', '<akari:all>', 20)).toBe(
        'hn1:puuid-1:all:20'
      )
    })

    it('preserves specific queue tags', () => {
      expect(getMultiGameAkariScoreCacheKey('hn1', 'puuid-1', 'q_420', 200)).toBe(
        'hn1:puuid-1:q_420:200'
      )
    })
  })

  describe('fetchPlayerMultiGameAkariScore', () => {
    it('returns cached score immediately if present', async () => {
      const cacheKey = getMultiGameAkariScoreCacheKey('hn1', 'puuid-cached', 'all', 20)
      const fakeScore = {
        total: 4.2,
        outstanding: 1.0,
        extraordinary: 0.5
      } as unknown as AkariScore
      multiGameAkariScoreLruMap.set(cacheKey, fakeScore)

      const getSgpMatchHistory = vi.fn()
      const score = await fetchPlayerMultiGameAkariScore({
        puuid: 'puuid-cached',
        sgpServerId: 'hn1',
        tag: undefined,
        count: 20,
        source: 'sgp',
        sgp: {
          api: { matchHistoryQuery: { getMatchHistorySummaryByPlayerPuuid: getSgpMatchHistory } }
        } as any,
        lc: {} as any
      })

      expect(score).toEqual(fakeScore)
      expect(getSgpMatchHistory).not.toHaveBeenCalled()
    })

    it('fetches from SGP and caches result', async () => {
      const getSgpMatchHistory = vi.fn().mockResolvedValue({
        data: {
          games: [
            {
              json: {
                gameId: 1001,
                participants: []
              }
            }
          ]
        }
      })

      const score = await fetchPlayerMultiGameAkariScore({
        puuid: 'puuid-new',
        sgpServerId: 'hn1',
        tag: 'q_2400',
        count: 50,
        source: 'sgp',
        sgp: {
          api: { matchHistoryQuery: { getMatchHistorySummaryByPlayerPuuid: getSgpMatchHistory } }
        } as any,
        lc: {} as any
      })

      expect(score).toEqual({
        total: 3.5,
        outstanding: 0.8,
        extraordinary: 0.2
      })
      expect(getSgpMatchHistory).toHaveBeenCalledWith('puuid-new', {
        tag: 'q_2400',
        startIndex: 0,
        count: 50,
        __sgpServerId: 'hn1'
      })

      // Verify cached
      const cacheKey = getMultiGameAkariScoreCacheKey('hn1', 'puuid-new', 'q_2400', 50)
      expect(multiGameAkariScoreLruMap.get(cacheKey)).toEqual(score)
    })

    it('deduplicates simultaneous in-flight requests', async () => {
      let resolvePromise: (value: any) => void
      const getSgpMatchHistory = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve
          })
      )

      const options = {
        puuid: 'puuid-inflight',
        sgpServerId: 'hn1',
        tag: undefined,
        count: 20,
        source: 'sgp' as const,
        sgp: {
          api: { matchHistoryQuery: { getMatchHistorySummaryByPlayerPuuid: getSgpMatchHistory } }
        } as any,
        lc: {} as any
      }

      const p1 = fetchPlayerMultiGameAkariScore(options)
      const p2 = fetchPlayerMultiGameAkariScore(options)

      resolvePromise!({
        data: {
          games: [{ json: { gameId: 2001 } }]
        }
      })

      const [res1, res2] = await Promise.all([p1, p2])
      expect(res1).toEqual(res2)
      expect(getSgpMatchHistory).toHaveBeenCalledTimes(1)
    })

    it('handles SGP errors gracefully by returning null', async () => {
      const getSgpMatchHistory = vi.fn().mockRejectedValue(new Error('Network error'))

      const score = await fetchPlayerMultiGameAkariScore({
        puuid: 'puuid-err',
        sgpServerId: 'hn1',
        tag: undefined,
        count: 20,
        source: 'sgp',
        sgp: {
          api: { matchHistoryQuery: { getMatchHistorySummaryByPlayerPuuid: getSgpMatchHistory } }
        } as any,
        lc: {} as any
      })

      expect(score).toBeNull()
    })
  })
})
