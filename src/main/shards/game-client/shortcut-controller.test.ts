import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TERMINATE_GAME_CLIENT_SHORTCUT_TARGET_ID } from './context'
import { GameClientShortcutController } from './shortcut-controller'

const nativeSupportMock = vi.hoisted(() => ({
  isProcessForeground: { available: true }
}))

vi.mock('@main/native', () => ({
  NATIVE_SUPPORT: nativeSupportMock
}))

function createController() {
  const keyboardShortcuts = {
    register: vi.fn(),
    unregisterByTargetId: vi.fn()
  }
  const context = {
    gameClient: { terminateGameClient: vi.fn() },
    keyboardShortcuts,
    logger: { warn: vi.fn() },
    settings: {
      terminateGameClientWithShortcut: true,
      terminateShortcut: 'Control+Q'
    }
  }

  return {
    context,
    controller: new GameClientShortcutController(context as any),
    keyboardShortcuts
  }
}

describe('GameClientShortcutController capability gating', () => {
  beforeEach(() => {
    nativeSupportMock.isProcessForeground.available = true
  })

  it('registers the foreground-only termination shortcut when supported', () => {
    const { controller, keyboardShortcuts } = createController()

    controller.watch()

    expect(keyboardShortcuts.register).toHaveBeenCalledWith(
      TERMINATE_GAME_CLIENT_SHORTCUT_TARGET_ID,
      'Control+Q',
      'normal',
      expect.any(Function)
    )
  })

  it('removes persisted registrations when foreground detection is unavailable', () => {
    nativeSupportMock.isProcessForeground.available = false
    const { controller, keyboardShortcuts } = createController()

    controller.watch()
    controller.applyTerminateShortcutSettingSideEffect('Control+Q')

    expect(keyboardShortcuts.register).not.toHaveBeenCalled()
    expect(keyboardShortcuts.unregisterByTargetId).toHaveBeenCalledTimes(2)
    expect(keyboardShortcuts.unregisterByTargetId).toHaveBeenCalledWith(
      TERMINATE_GAME_CLIENT_SHORTCUT_TARGET_ID
    )
  })
})
