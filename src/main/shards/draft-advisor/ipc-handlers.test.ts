import {
  MAX_DRAFT_ADVISOR_CANDIDATE_LIMIT,
  MIN_DRAFT_ADVISOR_CANDIDATE_LIMIT
} from '@shared/types/draft-advisor'
import { describe, expect, it } from 'vitest'

import { clampCandidateLimit } from './ipc-handlers'

describe('draft advisor candidate limit clamping', () => {
  it('keeps the stored candidate limit inside the allowed range', () => {
    const cases: Array<[input: number, expected: number]> = [
      [MIN_DRAFT_ADVISOR_CANDIDATE_LIMIT, MIN_DRAFT_ADVISOR_CANDIDATE_LIMIT],
      [MAX_DRAFT_ADVISOR_CANDIDATE_LIMIT, MAX_DRAFT_ADVISOR_CANDIDATE_LIMIT],
      [12, 12],
      [MIN_DRAFT_ADVISOR_CANDIDATE_LIMIT - 1, MIN_DRAFT_ADVISOR_CANDIDATE_LIMIT],
      [-100, MIN_DRAFT_ADVISOR_CANDIDATE_LIMIT],
      [MAX_DRAFT_ADVISOR_CANDIDATE_LIMIT + 1, MAX_DRAFT_ADVISOR_CANDIDATE_LIMIT],
      [9999, MAX_DRAFT_ADVISOR_CANDIDATE_LIMIT],
      [12.4, 12],
      [12.6, 13]
    ]

    for (const [input, expected] of cases) {
      expect(clampCandidateLimit(input), `input: ${input}`).toBe(expected)
    }
  })

  it('falls back to the minimum for a non-finite value', () => {
    // 渲染层理论上不会送出这种东西, 但这里不能让 NaN 一路冒到设置校验那里。
    expect(clampCandidateLimit(Number.NaN)).toBe(MIN_DRAFT_ADVISOR_CANDIDATE_LIMIT)
  })
})
