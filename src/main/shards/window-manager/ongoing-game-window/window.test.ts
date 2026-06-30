import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AkariOngoingGameWindow } from './window'

const nativeSupportMock = vi.hoisted(() => ({
  nativeInput: {
    available: false,
    availableOnCurrentPlatform: true,
    requiresElevation: true
  }
}))

vi.mock('@electron-toolkit/utils', () => ({
  is: {
    dev: false
  }
}))

vi.mock('@main/i18n', () => ({
  i18next: {
    t: (key: string) => key
  }
}))

vi.mock('@main/native', () => ({
  NATIVE_SUPPORT: nativeSupportMock,
  nativeInput: {
    instance: {},
    VKEY_MAP: {},
    UNIFIED_KEY_ID: {},
    isModifierKey: vi.fn()
  }
}))

vi.mock('@main/shards/game-client', () => ({
  GameClientMain: {
    isGameClientForeground: vi.fn()
  }
}))

vi.mock('@resources/LA_ICON.ico?asset', () => ({
  default: 'akari-icon.ico'
}))

vi.mock('electron', () => ({
  BrowserWindow: vi.fn(),
  app: {
    getPath: vi.fn()
  },
  dialog: {
    showMessageBox: vi.fn()
  },
  shell: {
    openExternal: vi.fn()
  }
}))

function createContext() {
  const logger = {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
  const settingService = {
    applyToState: vi.fn(),
    set: vi.fn(),
    _getFromStorage: vi.fn(),
    _saveToStorage: vi.fn()
  }

  const context = {
    namespace: 'window-manager-main',
    windowManager: {
      settings: {
        contentProtection: false
      },
      state: {
        isManagerFinishedInit: true
      }
    },
    settingFactory: {
      register: vi.fn(() => settingService)
    },
    loggerFactory: {
      create: vi.fn(() => logger)
    },
    mobxUtils: {
      reaction: vi.fn(
        (
          getter: () => unknown,
          effect: (value: unknown) => void,
          options?: { fireImmediately?: boolean }
        ) => {
          if (options?.fireImmediately) {
            effect(getter())
          }
        }
      ),
      propSync: vi.fn()
    },
    protocol: {
      registerPartition: vi.fn()
    },
    keyboardShortcuts: {
      register: vi.fn(),
      unregisterByTargetId: vi.fn()
    },
    ipc: {
      onCall: vi.fn()
    },
    shared: {
      global: {
        isReadyToQuit: false
      }
    },
    appCommon: {},
    leagueClient: {},
    gameClient: {},
    logger
  }

  return context
}

describe('AkariOngoingGameWindow', () => {
  beforeEach(() => {
    nativeSupportMock.nativeInput.available = false
    vi.clearAllMocks()
  })

  it('does not create a window when native shortcuts are unavailable', () => {
    const ongoingGameWindow = new AkariOngoingGameWindow(createContext() as any)
    ongoingGameWindow.settings.setEnabled(true)
    const createWindow = vi.spyOn(ongoingGameWindow, 'createWindow').mockImplementation(() => {})
    const close = vi.spyOn(ongoingGameWindow, 'close').mockImplementation(() => {})

    ;(ongoingGameWindow as any)._watchOngoingGameWindow()

    expect(createWindow).not.toHaveBeenCalled()
    expect(close).toHaveBeenCalledWith(true)
  })
})
