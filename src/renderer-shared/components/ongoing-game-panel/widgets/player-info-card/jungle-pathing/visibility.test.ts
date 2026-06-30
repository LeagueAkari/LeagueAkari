import { describe, expect, it } from 'vitest'

import { resolveJunglePathingAnalysis } from './visibility'

const analysis = {
  jungle: {
    gamesAnalyzed: 12
  }
}

describe('resolveJunglePathingAnalysis', () => {
  it('returns null when jungle pathing is globally disabled', () => {
    expect(
      resolveJunglePathingAnalysis({
        analysis,
        isCurrentJungler: true,
        showJunglePathing: false,
        showJunglePathingForAllPlayers: true
      })
    ).toBeNull()
  })

  it('keeps current junglers visible when jungle pathing is enabled', () => {
    expect(
      resolveJunglePathingAnalysis({
        analysis,
        isCurrentJungler: true,
        showJunglePathing: true,
        showJunglePathingForAllPlayers: false
      })
    ).toBe(analysis)
  })

  it('hides non-junglers unless the all-players option is enabled', () => {
    expect(
      resolveJunglePathingAnalysis({
        analysis,
        isCurrentJungler: false,
        showJunglePathing: true,
        showJunglePathingForAllPlayers: false
      })
    ).toBeNull()

    expect(
      resolveJunglePathingAnalysis({
        analysis,
        isCurrentJungler: false,
        showJunglePathing: true,
        showJunglePathingForAllPlayers: true
      })
    ).toBe(analysis)
  })
})
