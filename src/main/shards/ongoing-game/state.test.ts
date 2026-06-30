import { describe, expect, it, vi } from 'vitest'

import { OngoingGameSettings } from './state'

vi.mock('@main/native', () => ({
  NATIVE_SUPPORT: {}
}))

describe('OngoingGameSettings', () => {
  it('enables jungle pathing by default and allows disabling it', () => {
    const settings = new OngoingGameSettings()

    expect(settings.showJunglePathing).toBe(true)

    settings.setShowJunglePathing(false)

    expect(settings.showJunglePathing).toBe(false)
  })
})
