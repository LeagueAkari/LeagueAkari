import { describe, expect, it } from 'vitest'

import { shouldUseElectronGlobalShortcuts } from './platform'

describe('keyboard shortcut platform adapter', () => {
  it('uses Electron global shortcuts only for the macOS adapter', () => {
    expect(shouldUseElectronGlobalShortcuts('darwin')).toBe(true)
    expect(shouldUseElectronGlobalShortcuts('win32')).toBe(false)
    expect(shouldUseElectronGlobalShortcuts('linux')).toBe(false)
  })
})
