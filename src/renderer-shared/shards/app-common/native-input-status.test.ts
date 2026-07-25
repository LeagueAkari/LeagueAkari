import { describe, expect, test } from 'vitest'

import { resolveNativeInputStatus } from './native-input-status'

describe('resolveNativeInputStatus', () => {
  test.each([
    [true, true, true, true, 'available'],
    [false, false, true, true, 'unsupported-platform'],
    [false, true, true, false, 'requires-elevation'],
    [false, true, true, true, 'initialization-failed']
  ] as const)(
    'resolves available=%s platform=%s requiresElevation=%s elevated=%s as %s',
    (available, availableOnCurrentPlatform, requiresElevation, isElevated, expected) => {
      expect(
        resolveNativeInputStatus(
          {
            available,
            availableOnCurrentPlatform,
            requiresElevation
          },
          isElevated
        )
      ).toBe(expected)
    }
  )
})
