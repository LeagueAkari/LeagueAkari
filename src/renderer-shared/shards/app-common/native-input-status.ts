import type { NativeSupport } from '@shared/types/common'

export type NativeInputStatus =
  'available' | 'unsupported-platform' | 'requires-elevation' | 'initialization-failed'

export function resolveNativeInputStatus(
  nativeInput: NativeSupport['nativeInput'],
  isElevated: boolean
): NativeInputStatus {
  if (nativeInput.available) {
    return 'available'
  }

  if (!nativeInput.availableOnCurrentPlatform) {
    return 'unsupported-platform'
  }

  if (nativeInput.requiresElevation && !isElevated) {
    return 'requires-elevation'
  }

  return 'initialization-failed'
}
