import { describe, expect, it } from 'vitest'

import { parseOpggRankedCounters } from '.'

describe('OP.GG independent counters response', () => {
  it('reads the captured list envelope without treating it as champion details', () => {
    const counter = { champion_id: 58, play: 695, win: 359 }
    const result = parseOpggRankedCounters({
      data: [counter],
      meta: { version: '16.20', cached_at: '2026-10-18 02:35:41' }
    })

    expect(result).toEqual({ data: { data: [counter] }, issues: [] })
  })

  it('keeps healthy matchups, recovers broken counts and isolates diagnostics between calls', () => {
    const result = parseOpggRankedCounters({
      data: [
        { champion_id: 58, play: 695, win: 359 },
        { champion_id: 24, play: 'unknown', win: -1 },
        { champion_id: 0, play: 100, win: 50 }
      ]
    })

    expect(result.data.data).toEqual([
      { champion_id: 58, play: 695, win: 359 },
      { champion_id: 24, play: 0, win: null }
    ])
    expect(result.issues).toHaveLength(3)
    expect(result.issues.some((issue) => issue.path.includes('data.1'))).toBe(true)
    expect(result.issues.some((issue) => issue.path.includes('data.2'))).toBe(true)
    expect(parseOpggRankedCounters({ data: [] })).toEqual({ data: { data: [] }, issues: [] })
  })
})
