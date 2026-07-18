import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ElectronGlobalShortcutController,
  buildActivationShortcutDetails
} from './electron-global-shortcut-controller'

describe('ElectronGlobalShortcutController', () => {
  const callbacks = new Map<string, () => void>()
  const globalShortcut = {
    register: vi.fn((accelerator: string, callback: () => void) => {
      callbacks.set(accelerator, callback)
      return true
    }),
    unregister: vi.fn((accelerator: string) => {
      callbacks.delete(accelerator)
    }),
    unregisterAll: vi.fn()
  }
  const logger = { info: vi.fn() }

  beforeEach(() => {
    callbacks.clear()
    vi.clearAllMocks()
    globalShortcut.register.mockImplementation((accelerator, callback) => {
      callbacks.set(accelerator, callback)
      return true
    })
  })

  it('registers and dispatches an activation-only macOS shortcut', () => {
    const onActivated = vi.fn()
    const controller = new ElectronGlobalShortcutController(
      logger,
      onActivated,
      globalShortcut,
      'darwin'
    )

    controller.register('LeftMeta+Shift+K')
    callbacks.get('Command+Shift+K')?.()

    expect(onActivated).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'LeftMeta+Shift+K', pressed: true })
    )
  })

  it('replaces normalized variants without disturbing the OS registration', () => {
    const onActivated = vi.fn()
    const controller = new ElectronGlobalShortcutController(
      logger,
      onActivated,
      globalShortcut,
      'darwin'
    )

    controller.register('LeftControl+A')
    controller.replace('LeftControl+A', 'RightControl+A')
    callbacks.get('Control+A')?.()

    expect(globalShortcut.register).toHaveBeenCalledOnce()
    expect(globalShortcut.unregister).not.toHaveBeenCalled()
    expect(onActivated).toHaveBeenCalledWith(expect.objectContaining({ id: 'RightControl+A' }))
  })

  it('throws when Electron refuses a registration and keeps prior shortcuts owned', () => {
    const controller = new ElectronGlobalShortcutController(
      logger,
      vi.fn(),
      globalShortcut,
      'darwin'
    )
    controller.register('LeftMeta+A')
    globalShortcut.register.mockReturnValueOnce(false)

    expect(() => controller.replace('LeftMeta+A', 'LeftMeta+B')).toThrow(
      'Electron refused to register global shortcut LeftMeta+B'
    )
    expect(callbacks.has('Command+A')).toBe(true)
  })

  it('unregisters only shortcuts owned by this controller', () => {
    const controller = new ElectronGlobalShortcutController(
      logger,
      vi.fn(),
      globalShortcut,
      'darwin'
    )
    controller.register('LeftMeta+A')
    controller.register('LeftMeta+B')

    controller.clear()

    expect(globalShortcut.unregister).toHaveBeenCalledTimes(2)
    expect(globalShortcut.unregisterAll).not.toHaveBeenCalled()
  })

  it('reports the adapter unavailable outside macOS', () => {
    const controller = new ElectronGlobalShortcutController(
      logger,
      vi.fn(),
      globalShortcut,
      'win32'
    )

    expect(controller.available).toBe(false)
    expect(controller.isShortcutIdSupported('Control+A')).toBe(false)
  })

  it('builds platform-neutral shortcut details without the Win32 addon', () => {
    expect(buildActivationShortcutDetails('LeftMeta+K')).toEqual(
      expect.objectContaining({
        keyCodes: [91, 75],
        id: 'LeftMeta+K',
        unifiedId: 'Meta+K'
      })
    )
  })
})
