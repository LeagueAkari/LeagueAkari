import 'reflect-metadata'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { KeyboardShortcutsMain } from './index'

const nativeInputMock = vi.hoisted(() => {
  const pressed = new Set<number>()

  return {
    pressed,
    on: vi.fn(),
    off: vi.fn(),
    getKeyStates: vi.fn(() =>
      Array.from({ length: 256 }, (_, vkCode) => ({
        vkCode,
        pressed: pressed.has(vkCode),
        scanCode: vkCode
      }))
    )
  }
})

const nativeSupportMock = vi.hoisted(() => ({
  nativeInput: {
    available: true,
    availableOnCurrentPlatform: true,
    requiresElevation: true
  },
  activationShortcut: {
    available: true,
    availableOnCurrentPlatform: true,
    requiresElevation: false
  }
}))

const globalShortcutMock = vi.hoisted(() => {
  const callbacks = new Map<string, () => void>()

  return {
    callbacks,
    register: vi.fn((accelerator: string, callback: () => void) => {
      callbacks.set(accelerator, callback)
      return true
    }),
    unregister: vi.fn((accelerator: string) => {
      callbacks.delete(accelerator)
    }),
    unregisterAll: vi.fn()
  }
})

vi.mock('electron', () => ({
  globalShortcut: globalShortcutMock
}))

vi.mock('@main/native', () => {
  const VKEY_MAP = {
    17: { keyId: 'Control' },
    65: { keyId: 'A' },
    81: { keyId: 'Q' },
    162: { keyId: 'LeftControl' },
    163: { keyId: 'RightControl' },
    135: { keyId: 'F24' },
    133: { keyId: 'F22' },
    13: { keyId: 'Enter' }
  }

  return {
    NATIVE_SUPPORT: nativeSupportMock,
    nativeInput: {
      VKEY_MAP,
      UNIFIED_KEY_ID: {
        17: 'Control',
        162: 'Control',
        163: 'Control'
      },
      isModifierKey: (keyCode: number) => [17, 162, 163].includes(keyCode),
      instance: {
        on: nativeInputMock.on,
        off: nativeInputMock.off,
        getKeyStates: nativeInputMock.getKeyStates
      }
    }
  }
})

interface TestKeyEvent {
  keyCode: number
  isDown: boolean
  isModifier?: boolean
  isCommonModifier?: boolean
}

function createKeyboardShortcuts() {
  return new KeyboardShortcutsMain(
    {
      sendEvent: vi.fn(),
      onCall: vi.fn()
    } as any,
    {
      create: () => ({
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn()
      })
    } as any
  )
}

function emitKey(kbd: KeyboardShortcutsMain, event: TestKeyEvent) {
  if (event.isDown) {
    nativeInputMock.pressed.add(event.keyCode)
  } else {
    nativeInputMock.pressed.delete(event.keyCode)
  }

  ;(kbd as any)._processNativeKeyEvent({
    keyCode: event.keyCode,
    isDown: event.isDown,
    isModifier: event.isModifier ?? [17, 162, 163].includes(event.keyCode),
    isCommonModifier: event.isCommonModifier ?? event.keyCode === 17
  })
}

describe('KeyboardShortcutsMain', () => {
  beforeEach(() => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin')
    nativeSupportMock.nativeInput.available = true
    nativeSupportMock.activationShortcut.available = true
    nativeInputMock.pressed.clear()
    nativeInputMock.on.mockClear()
    nativeInputMock.off.mockClear()
    nativeInputMock.getKeyStates.mockClear()
    globalShortcutMock.callbacks.clear()
    globalShortcutMock.register.mockClear()
    globalShortcutMock.register.mockImplementation((accelerator, callback) => {
      globalShortcutMock.callbacks.set(accelerator, callback)
      return true
    })
    globalShortcutMock.unregister.mockClear()
    globalShortcutMock.unregisterAll.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses Electron for normal shortcuts when native input is unavailable on macOS', async () => {
    nativeSupportMock.nativeInput.available = false
    const kbd = createKeyboardShortcuts()
    const callback = vi.fn()

    kbd.register('macos-shortcut', 'LeftMeta+A', 'normal', callback)
    await kbd.onInit()
    globalShortcutMock.callbacks.get('Command+A')?.()

    expect(kbd.getRegistration('LeftMeta+A')).toEqual(
      expect.objectContaining({ targetId: 'macos-shortcut', type: 'normal' })
    )
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'LeftMeta+A', pressed: true })
    )
    expect(nativeInputMock.on).not.toHaveBeenCalled()
  })

  it('leaves stateful and last-active shortcuts unavailable without native input', () => {
    nativeSupportMock.nativeInput.available = false
    const kbd = createKeyboardShortcuts()

    kbd.register('stateful', 'LeftMeta+A', 'stateful', vi.fn())
    kbd.register('last-active', 'LeftMeta+B', 'last-active', vi.fn())

    expect(kbd.getRegistrationByTargetId('stateful')).toBeNull()
    expect(kbd.getRegistrationByTargetId('last-active')).toBeNull()
    expect(globalShortcutMock.register).not.toHaveBeenCalled()
  })

  it('rejects reserved and non-Electron activation shortcuts on macOS', () => {
    nativeSupportMock.nativeInput.available = false
    const kbd = createKeyboardShortcuts()

    expect(() => kbd.register('reserved', 'LeftMeta+Enter', 'normal', vi.fn())).toThrow(
      'contains reserved keys'
    )
    expect(() => kbd.register('unsupported', 'LeftMeta+Numpad1', 'normal', vi.fn())).toThrow(
      'unavailable for activation-only shortcuts'
    )
    expect(kbd.getRegistration('LeftMeta+Enter')).toEqual(
      expect.objectContaining({ targetId: KeyboardShortcutsMain.DISABLED_KEYS_TARGET_ID })
    )
    expect(kbd.getRegistration('LeftMeta+Numpad1')).toEqual(
      expect.objectContaining({ targetId: KeyboardShortcutsMain.DISABLED_KEYS_TARGET_ID })
    )
  })

  it('keeps the Windows native registration path unchanged', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32')
    const kbd = createKeyboardShortcuts()
    const callback = vi.fn()

    kbd.register('windows-shortcut', 'A', 'normal', callback)
    emitKey(kbd, { keyCode: 65, isDown: true, isModifier: false })

    expect(callback).toHaveBeenCalledOnce()
    expect(globalShortcutMock.register).not.toHaveBeenCalled()
  })

  it('recovers when a side-specific modifier is released as a common modifier event', () => {
    const kbd = createKeyboardShortcuts()
    const callback = vi.fn()

    kbd.register('send-all', 'LeftControl+A', 'last-active', callback)

    emitKey(kbd, { keyCode: 162, isDown: true })
    emitKey(kbd, { keyCode: 65, isDown: true, isModifier: false })
    emitKey(kbd, { keyCode: 65, isDown: false, isModifier: false })
    emitKey(kbd, { keyCode: 17, isDown: false, isCommonModifier: true })

    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ id: 'LeftControl+A' }))
  })

  it('releases a stateful shortcut when any key in the active combination is released', () => {
    const kbd = createKeyboardShortcuts()
    const callback = vi.fn()

    kbd.register('overlay/show', 'LeftControl+Q', 'stateful', callback)

    emitKey(kbd, { keyCode: 162, isDown: true })
    emitKey(kbd, { keyCode: 81, isDown: true, isModifier: false })
    emitKey(kbd, { keyCode: 162, isDown: false })

    expect(callback).toHaveBeenNthCalledWith(1, expect.objectContaining({ pressed: true }))
    expect(callback).toHaveBeenNthCalledWith(2, expect.objectContaining({ pressed: false }))
  })

  it('ignores repeated keydown events while the same non-modifier key is already pressed', () => {
    const kbd = createKeyboardShortcuts()
    const callback = vi.fn()

    kbd.register('toggle', 'A', 'normal', callback)

    emitKey(kbd, { keyCode: 65, isDown: true, isModifier: false })
    emitKey(kbd, { keyCode: 65, isDown: true, isModifier: false })

    expect(callback).toHaveBeenCalledOnce()
  })

  it('does not let two targets register the same shortcut id', () => {
    const kbd = createKeyboardShortcuts()
    const first = vi.fn()
    const second = vi.fn()

    kbd.register('first', 'A', 'normal', first)

    expect(() => kbd.register('second', 'A', 'normal', second)).toThrow(
      'Shortcut A is already registered'
    )

    emitKey(kbd, { keyCode: 65, isDown: true, isModifier: false })

    expect(first).toHaveBeenCalledOnce()
    expect(second).not.toHaveBeenCalled()
  })

  it('ignores non-standard keyboard keys so they cannot hold the pressed state open', () => {
    const kbd = createKeyboardShortcuts()
    const callback = vi.fn()

    kbd.register('send-all', 'A', 'last-active', callback)

    emitKey(kbd, { keyCode: 135, isDown: true, isModifier: false })
    emitKey(kbd, { keyCode: 65, isDown: true, isModifier: false })
    emitKey(kbd, { keyCode: 65, isDown: false, isModifier: false })

    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ id: 'A' }))
  })

  it('rejects shortcut registrations containing non-standard keyboard keys', () => {
    const kbd = createKeyboardShortcuts()

    expect(() => kbd.register('legacy-weird-key', 'F24', 'normal', vi.fn())).toThrow(
      'Shortcut F24 contains unsupported keys'
    )
  })

  it('does not reconcile native key states for ignored non-standard key events', () => {
    const kbd = createKeyboardShortcuts()

    emitKey(kbd, { keyCode: 135, isDown: true, isModifier: false })

    expect(nativeInputMock.getKeyStates).not.toHaveBeenCalled()
  })

  it('returns a serializable debug state for supported standard keys', () => {
    const kbd = createKeyboardShortcuts()

    emitKey(kbd, { keyCode: 162, isDown: true })
    emitKey(kbd, { keyCode: 65, isDown: true, isModifier: false })

    const state = kbd.getDebugState()

    expect(state.available).toBe(true)
    expect(state.pressedModifierKeys).toEqual([162])
    expect(state.pressedOtherKeys).toEqual([65])
    expect(state.activeShortcut).toEqual(expect.objectContaining({ id: 'LeftControl+A' }))
    expect(state.keyStates.find((key) => key.keyCode === 65)).toEqual(
      expect.objectContaining({ keyId: 'A', pressed: true })
    )
    expect(state.keyStates.find((key) => key.keyCode === 135)).toBeUndefined()
  })
})
