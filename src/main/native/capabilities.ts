import type { NativeSupport } from '@shared/types/common'

export interface NativeSupportRuntime {
  platform: NodeJS.Platform
  isElevated: boolean
  nativeInputAddonLoaded: boolean
  nativeInputInstalled: boolean
}

export function resolveNativeSupport(runtime: NativeSupportRuntime): NativeSupport {
  const isWindows = runtime.platform === 'win32'
  const isMacOS = runtime.platform === 'darwin'
  const nativeInputAvailable =
    isWindows &&
    runtime.nativeInputAddonLoaded &&
    runtime.nativeInputInstalled &&
    runtime.isElevated

  return {
    nativeInput: {
      available: nativeInputAvailable,
      availableOnCurrentPlatform: isWindows,
      requiresElevation: true
    },
    activationShortcut: {
      available: isMacOS || nativeInputAvailable,
      availableOnCurrentPlatform: isMacOS || isWindows,
      requiresElevation: isWindows
    },
    getLeagueClientWindowPlacement: {
      available: isWindows,
      availableOnCurrentPlatform: isWindows,
      requiresElevation: false
    },
    adjustLeagueClientWindowSize: {
      available: isWindows && runtime.isElevated,
      availableOnCurrentPlatform: isWindows,
      requiresElevation: true
    },
    isProcessForeground: {
      available: isWindows && runtime.isElevated,
      availableOnCurrentPlatform: isWindows,
      requiresElevation: true
    }
  }
}
