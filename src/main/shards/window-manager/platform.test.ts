import { describe, expect, it } from 'vitest'

import { shouldShowOverlayOnAllWorkspaces } from './platform'

describe('window manager platform guards', () => {
  it('uses the macOS all-Spaces behavior only on macOS', () => {
    expect(shouldShowOverlayOnAllWorkspaces('darwin')).toBe(true)
    expect(shouldShowOverlayOnAllWorkspaces('win32')).toBe(false)
    expect(shouldShowOverlayOnAllWorkspaces('linux')).toBe(false)
  })
})
