import type { AkariSupportedPlatform } from '@shared/types/common'

export function shouldShowWmiAdministratorPrompt(
  platform: AkariSupportedPlatform,
  useWmi: boolean,
  isElevated: boolean
) {
  return platform === 'win32' && useWmi && !isElevated
}

export function shouldShowCannotGetUxCommandLineWarning(
  platform: AkariSupportedPlatform,
  hasClientButNoCommandLine: boolean,
  isLeagueClientDisconnected: boolean
) {
  return platform === 'win32' && hasClientButNoCommandLine && isLeagueClientDisconnected
}
