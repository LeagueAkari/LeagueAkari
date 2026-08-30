import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BaseAkariWindow } from './base-akari-window'

vi.mock('@electron-toolkit/utils', () => ({
  is: { dev: false }
}))

vi.mock('@main/i18n', () => ({
  i18next: { t: (key: string) => key }
}))

vi.mock('electron', () => ({
  BrowserWindow: vi.fn(),
  app: { getPath: vi.fn() },
  dialog: { showMessageBox: vi.fn() },
  shell: { openExternal: vi.fn() }
}))

vi.mock('./window-position-service', () => ({
  repositionWindowIfInvisible: vi.fn()
}))

function createContext() {
  const logger = {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }

  return {
    namespace: 'window-manager-main',
    loggerFactory: {
      create: vi.fn(() => logger)
    },
    settingFactory: {
      register: vi.fn(() => ({
        applyToState: vi.fn(),
        set: vi.fn(),
        _getFromStorage: vi.fn(),
        _saveToStorage: vi.fn()
      }))
    },
    appCommon: {},
    ipc: { onCall: vi.fn() },
    mobxUtils: { reaction: vi.fn(), propSync: vi.fn() },
    leagueClient: {},
    gameClient: {},
    windowManager: {},
    protocol: {},
    keyboardShortcuts: {},
    logger
  }
}

class TestAkariWindow extends BaseAkariWindow<any, any> {
  constructor(context: ReturnType<typeof createContext>, stateShow: boolean) {
    super(
      context as any,
      'test-window',
      {
        status: 'normal',
        focus: 'blurred',
        ready: true,
        show: stateShow,
        trackedBounds: null
      },
      { pinned: false, opacity: 1 },
      {
        baseWidth: 320,
        baseHeight: 240,
        minWidth: 320,
        minHeight: 240,
        htmlEntry: 'test.html'
      }
    )
  }

  attachWindow(window: Record<string, unknown>) {
    this._window = window as any
  }
}

function createNativeWindow(options: { visible: boolean; minimized?: boolean }) {
  let visible = options.visible
  return {
    isMinimized: vi.fn(() => options.minimized ?? false),
    isVisible: vi.fn(() => visible),
    show: vi.fn(() => {
      visible = true
    }),
    showInactive: vi.fn(() => {
      visible = true
    }),
    hide: vi.fn(() => {
      visible = false
    }),
    restore: vi.fn(),
    focus: vi.fn()
  }
}

describe('BaseAkariWindow visibility recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reissues show when public state is hidden but the native window reports visible', () => {
    const context = createContext()
    const akariWindow = new TestAkariWindow(context, false)
    const nativeWindow = createNativeWindow({ visible: true })
    akariWindow.attachWindow(nativeWindow)

    akariWindow.showOrRestore()

    expect(nativeWindow.show).toHaveBeenCalledOnce()
    expect(akariWindow.state.show).toBe(true)
    expect(context.logger.warn).toHaveBeenCalledOnce()
  })

  it('reissues show when public state is visible but the native window reports hidden', () => {
    const context = createContext()
    const akariWindow = new TestAkariWindow(context, true)
    const nativeWindow = createNativeWindow({ visible: false })
    akariWindow.attachWindow(nativeWindow)

    akariWindow.show()

    expect(nativeWindow.show).toHaveBeenCalledOnce()
    expect(akariWindow.state.show).toBe(true)
    expect(context.logger.warn).toHaveBeenCalledOnce()
  })

  it('only focuses a window when public and native visibility are both visible', () => {
    const context = createContext()
    const akariWindow = new TestAkariWindow(context, true)
    const nativeWindow = createNativeWindow({ visible: true })
    akariWindow.attachWindow(nativeWindow)

    akariWindow.showOrRestore()

    expect(nativeWindow.show).not.toHaveBeenCalled()
    expect(nativeWindow.focus).toHaveBeenCalledOnce()
    expect(context.logger.warn).not.toHaveBeenCalled()
  })

  it('synchronizes public state when hide finds the native window already hidden', () => {
    const context = createContext()
    const akariWindow = new TestAkariWindow(context, true)
    const nativeWindow = createNativeWindow({ visible: false })
    akariWindow.attachWindow(nativeWindow)

    akariWindow.hide()

    expect(nativeWindow.hide).not.toHaveBeenCalled()
    expect(akariWindow.state.show).toBe(false)
  })
})
