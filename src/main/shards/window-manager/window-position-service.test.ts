import { beforeEach, describe, expect, it, vi } from 'vitest'

import { repositionToAlignLeagueClientUx } from './window-position-service'

const nativeMock = vi.hoisted(() => ({
  placementAvailable: false,
  getLeagueClientWindowPlacement: vi.fn()
}))

vi.mock('@main/native', () => ({
  NATIVE_SUPPORT: {
    getLeagueClientWindowPlacement: {
      get available() {
        return nativeMock.placementAvailable
      }
    }
  },
  getLeagueClientWindowPlacement: nativeMock.getLeagueClientWindowPlacement
}))

vi.mock('electron', () => ({
  BrowserWindow: class {},
  screen: {
    getAllDisplays: vi.fn(),
    getDisplayMatching: vi.fn(),
    getPrimaryDisplay: vi.fn()
  }
}))

describe('repositionToAlignLeagueClientUx', () => {
  beforeEach(() => {
    nativeMock.placementAvailable = false
    nativeMock.getLeagueClientWindowPlacement.mockReset()
  })

  it('does not call the Win32 placement API when the capability is unavailable', () => {
    repositionToAlignLeagueClientUx({} as any)

    expect(nativeMock.getLeagueClientWindowPlacement).not.toHaveBeenCalled()
  })

  it('preserves placement lookup when the capability is available', () => {
    nativeMock.placementAvailable = true
    nativeMock.getLeagueClientWindowPlacement.mockReturnValue(null)

    repositionToAlignLeagueClientUx({} as any)

    expect(nativeMock.getLeagueClientWindowPlacement).toHaveBeenCalledOnce()
  })
})
