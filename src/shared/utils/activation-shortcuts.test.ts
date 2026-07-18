import { describe, expect, it } from 'vitest'

import {
  keyboardEventToActivationShortcutId,
  shortcutIdToElectronAccelerator
} from './activation-shortcuts'

describe('activation shortcuts', () => {
  it('converts the persisted key ids to Electron accelerators', () => {
    expect(shortcutIdToElectronAccelerator('LeftMeta+Shift+K')).toBe('Command+Shift+K')
    expect(shortcutIdToElectronAccelerator('LeftControl+RightControl+A')).toBe('Control+A')
    expect(shortcutIdToElectronAccelerator('Alt+LeftArrow')).toBe('Alt+Left')
  })

  it('rejects modifier-only, multi-key, and unsupported key combinations', () => {
    expect(shortcutIdToElectronAccelerator('LeftMeta')).toBeNull()
    expect(shortcutIdToElectronAccelerator('A+B')).toBeNull()
    expect(shortcutIdToElectronAccelerator('LeftMeta+Numpad1')).toBeNull()
  })

  it('captures a macOS Command shortcut from a renderer keyboard event', () => {
    expect(
      keyboardEventToActivationShortcutId({
        code: 'KeyK',
        altKey: false,
        ctrlKey: false,
        metaKey: true,
        shiftKey: true
      })
    ).toBe('LeftMeta+Shift+K')
  })

  it('ignores repeats and modifier-only keydown events', () => {
    expect(
      keyboardEventToActivationShortcutId({
        code: 'KeyK',
        altKey: false,
        ctrlKey: false,
        metaKey: true,
        shiftKey: false,
        repeat: true
      })
    ).toBeNull()
    expect(
      keyboardEventToActivationShortcutId({
        code: 'MetaLeft',
        altKey: false,
        ctrlKey: false,
        metaKey: true,
        shiftKey: false
      })
    ).toBeNull()
  })
})
