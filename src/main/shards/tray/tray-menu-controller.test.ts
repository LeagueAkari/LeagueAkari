import { beforeEach, describe, expect, test, vi } from 'vitest'

import { TrayMenuController } from './tray-menu-controller'

const electronMocks = vi.hoisted(() => ({
  quit: vi.fn()
}))

vi.mock('@resources/LA_ICON.ico?asset', () => ({ default: 'icon.ico' }))
vi.mock('@resources/iconTemplate.png?asset', () => ({ default: 'iconTemplate.png' }))

vi.mock('electron', () => {
  class MenuItem {
    constructor(options: Record<string, unknown>) {
      Object.assign(this, options)
    }
  }

  class Tray {
    addListener = vi.fn()
    destroy = vi.fn()
    setToolTip = vi.fn()
  }

  return {
    app: { name: 'League Akari', quit: electronMocks.quit },
    Menu: {
      buildFromTemplate: vi.fn((template) => template),
      setApplicationMenu: vi.fn()
    },
    MenuItem,
    Tray,
    nativeImage: {
      createFromPath: vi.fn()
    }
  }
})

vi.mock('i18next', () => ({
  default: { t: (key: string) => key }
}))

vi.mock('../app-common', () => ({
  AppCommonMain: { id: 'app-common-main' }
}))

function createController() {
  const noOpWindow = {
    settings: { enabled: true },
    close: vi.fn(),
    repositionWindowIfInvisible: vi.fn(),
    showOrRestore: vi.fn(),
    toggleDevtools: vi.fn()
  }
  const mainWindow = { ...noOpWindow, close: vi.fn() }

  const context = {
    ipc: { sendEvent: vi.fn() },
    windowManager: {
      auxWindow: noOpWindow,
      cdTimerWindow: noOpWindow,
      mainWindow,
      ongoingGameWindow: noOpWindow,
      opggWindow: noOpWindow
    }
  }

  return {
    controller: new TrayMenuController(context as any),
    mainWindow
  }
}

describe('TrayMenuController', () => {
  beforeEach(() => {
    electronMocks.quit.mockReset()
    vi.spyOn(process, 'platform', 'get').mockReturnValue('win32')
  })

  test('the Quit item quits the application instead of only closing the main window', () => {
    const { controller, mainWindow } = createController()
    controller.build()

    ;(controller.quitTrayItem as any).click()

    expect(electronMocks.quit).toHaveBeenCalledOnce()
    expect(mainWindow.close).not.toHaveBeenCalled()
  })
})
