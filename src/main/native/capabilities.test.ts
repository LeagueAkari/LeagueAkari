import { describe, expect, it } from 'vitest'

import { resolveNativeSupport } from './capabilities'

describe('resolveNativeSupport', () => {
  it('reports Win32-only capabilities as unsupported on macOS', () => {
    const support = resolveNativeSupport({
      platform: 'darwin',
      isElevated: true,
      nativeInputAddonLoaded: false,
      nativeInputInstalled: false
    })

    expect(support).toEqual({
      nativeInput: {
        available: false,
        availableOnCurrentPlatform: false,
        requiresElevation: true
      },
      activationShortcut: {
        available: true,
        availableOnCurrentPlatform: true,
        requiresElevation: false
      },
      getLeagueClientWindowPlacement: {
        available: false,
        availableOnCurrentPlatform: false,
        requiresElevation: false
      },
      adjustLeagueClientWindowSize: {
        available: false,
        availableOnCurrentPlatform: false,
        requiresElevation: true
      },
      isProcessForeground: {
        available: false,
        availableOnCurrentPlatform: false,
        requiresElevation: true
      }
    })
  })

  it('distinguishes elevation from platform support on Windows', () => {
    const support = resolveNativeSupport({
      platform: 'win32',
      isElevated: false,
      nativeInputAddonLoaded: true,
      nativeInputInstalled: false
    })

    expect(support.nativeInput).toEqual({
      available: false,
      availableOnCurrentPlatform: true,
      requiresElevation: true
    })
    expect(support.activationShortcut).toEqual({
      available: false,
      availableOnCurrentPlatform: true,
      requiresElevation: true
    })
    expect(support.getLeagueClientWindowPlacement.available).toBe(true)
    expect(support.adjustLeagueClientWindowSize.available).toBe(false)
    expect(support.isProcessForeground.available).toBe(false)
  })

  it('reports installed elevated Windows capabilities as available', () => {
    const support = resolveNativeSupport({
      platform: 'win32',
      isElevated: true,
      nativeInputAddonLoaded: true,
      nativeInputInstalled: true
    })

    expect(Object.values(support).every((capability) => capability.available)).toBe(true)
  })

  it('does not report activation shortcuts on unsupported platforms', () => {
    const support = resolveNativeSupport({
      platform: 'linux',
      isElevated: false,
      nativeInputAddonLoaded: false,
      nativeInputInstalled: false
    })

    expect(support.activationShortcut).toEqual({
      available: false,
      availableOnCurrentPlatform: false,
      requiresElevation: false
    })
  })
})
