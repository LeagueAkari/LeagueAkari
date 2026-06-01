import { describe, expect, it } from 'vitest'

import { toLoadStatus, toRequiredSgpLoadStatus } from './source-selection'

describe('resolvePlayerTabDataSource', () => {
  it('requires SGP for cross-region tabs and skips loading when the target SGP API is unavailable', () => {
    expect(
      toLoadStatus({
        preferredSource: 'lcu',
        isCrossRegion: true,
        sgpApiStatus: { canUse: false, isReady: false }
      })
    ).toEqual({
      type: 'unavailable',
      source: 'sgp',
      reason: 'sgp-api-unavailable'
    })
  })

  it('waits for SGP token readiness when the cross-region target API is configured', () => {
    expect(
      toLoadStatus({
        preferredSource: 'lcu',
        isCrossRegion: true,
        sgpApiStatus: { canUse: true, isReady: false }
      })
    ).toEqual({
      type: 'wait',
      source: 'sgp',
      reason: 'sgp-token-not-ready'
    })
  })

  it('falls back to LCU for same-region SGP preference when the target SGP API is unavailable', () => {
    expect(
      toLoadStatus({
        preferredSource: 'sgp',
        isCrossRegion: false,
        sgpApiStatus: { canUse: false, isReady: false }
      })
    ).toEqual({
      type: 'load',
      source: 'lcu',
      fallbackReason: 'sgp-api-unavailable'
    })
  })

  it('waits instead of falling back when same-region SGP is configured but token is not ready', () => {
    expect(
      toLoadStatus({
        preferredSource: 'sgp',
        isCrossRegion: false,
        sgpApiStatus: { canUse: true, isReady: false }
      })
    ).toEqual({
      type: 'wait',
      source: 'sgp',
      reason: 'sgp-token-not-ready'
    })
  })

  it('keeps same-region LCU preference independent from SGP API availability', () => {
    expect(
      toLoadStatus({
        preferredSource: 'lcu',
        isCrossRegion: false,
        sgpApiStatus: { canUse: false, isReady: false }
      })
    ).toEqual({
      type: 'load',
      source: 'lcu'
    })
  })
})

describe('toRequiredSgpLoadStatus', () => {
  it('skips loading without fallback when SGP API is unavailable', () => {
    expect(toRequiredSgpLoadStatus({ canUse: false, isReady: false })).toEqual({
      type: 'unavailable',
      source: 'sgp',
      reason: 'sgp-api-unavailable'
    })
  })

  it('waits when SGP API is configured but token is not ready', () => {
    expect(toRequiredSgpLoadStatus({ canUse: true, isReady: false })).toEqual({
      type: 'wait',
      source: 'sgp',
      reason: 'sgp-token-not-ready'
    })
  })

  it('loads from SGP when API is configured and token is ready', () => {
    expect(toRequiredSgpLoadStatus({ canUse: true, isReady: true })).toEqual({
      type: 'load',
      source: 'sgp'
    })
  })
})
