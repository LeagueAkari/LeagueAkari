export type AkariSupportedPlatform = 'darwin' | 'win32' | 'unknown'

export interface BaseConfig {
  disableHardwareAcceleration?: boolean
  logLevel?: string
}

type NativeSupportRequirement = {
  available: boolean
  availableOnCurrentPlatform: boolean
  requiresElevation: boolean
}

export interface NativeSupport {
  nativeInput: NativeSupportRequirement
  getLeagueClientWindowPlacement: NativeSupportRequirement
  adjustLeagueClientWindowSize: NativeSupportRequirement
  isProcessForeground: NativeSupportRequirement
}
