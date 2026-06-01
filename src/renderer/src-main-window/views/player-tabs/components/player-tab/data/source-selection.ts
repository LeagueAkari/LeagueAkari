import type { SgpApiStatus } from '@renderer-shared/composables/useSgpApiStatus'

export type PlayerTabPreferredSource = 'lcu' | 'sgp'

export type PlayerTabDataSourceDecision =
  | {
      type: 'load'
      source: PlayerTabPreferredSource
      fallbackReason?: 'sgp-api-unavailable'
    }
  | {
      type: 'wait'
      source: 'sgp'
      reason: 'sgp-token-not-ready'
    }
  | {
      type: 'unavailable'
      source: 'sgp'
      reason: 'sgp-api-unavailable'
    }

export function toLoadStatus(options: {
  preferredSource: PlayerTabPreferredSource
  isCrossRegion: boolean
  sgpApiStatus: SgpApiStatus
}): PlayerTabDataSourceDecision {
  if (options.isCrossRegion) {
    if (!options.sgpApiStatus.canUse) {
      return {
        type: 'unavailable',
        source: 'sgp',
        reason: 'sgp-api-unavailable'
      }
    }

    if (!options.sgpApiStatus.isReady) {
      return {
        type: 'wait',
        source: 'sgp',
        reason: 'sgp-token-not-ready'
      }
    }

    return {
      type: 'load',
      source: 'sgp'
    }
  }

  if (options.preferredSource === 'sgp') {
    if (!options.sgpApiStatus.canUse) {
      return {
        type: 'load',
        source: 'lcu',
        fallbackReason: 'sgp-api-unavailable'
      }
    }

    if (!options.sgpApiStatus.isReady) {
      return {
        type: 'wait',
        source: 'sgp',
        reason: 'sgp-token-not-ready'
      }
    }
  }

  return {
    type: 'load',
    source: options.preferredSource
  }
}

export function toRequiredSgpLoadStatus(sgpApiStatus: SgpApiStatus): PlayerTabDataSourceDecision {
  if (!sgpApiStatus.canUse) {
    return {
      type: 'unavailable',
      source: 'sgp',
      reason: 'sgp-api-unavailable'
    }
  }

  if (!sgpApiStatus.isReady) {
    return {
      type: 'wait',
      source: 'sgp',
      reason: 'sgp-token-not-ready'
    }
  }

  return {
    type: 'load',
    source: 'sgp'
  }
}
