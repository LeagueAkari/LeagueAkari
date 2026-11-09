import { wasRelaunchedAsAdministrator } from '@main/administrator-relaunch'
import { BrowserWindow } from 'electron'
import { reaction } from 'mobx'
import { EventEmitter } from 'node:events'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DelayedTaskScheduler } from '../../setting-factory/delayed-task-scheduler'
import { SetterSettingService } from '../../setting-factory/setter-setting-service'
import { repositionWindowIfInvisible } from '../window-position-service'
import { AkariMainWindow } from './window'

vi.mock('@resources/LA_ICON.ico?asset&asarUnpack', () => ({ default: 'akari-icon.ico' }))
vi.mock('@main/administrator-relaunch', () => ({
  wasRelaunchedAsAdministrator: vi.fn(() => false)
}))
vi.mock('@electron-toolkit/utils', () => ({ is: { dev: false } }))
vi.mock('@main/i18n', () => ({ i18next: { t: (key: string) => key } }))
vi.mock('../window-position-service', () => ({ repositionWindowIfInvisible: vi.fn() }))
vi.mock('electron', () => ({
  BrowserWindow: vi.fn(function (options) {
    return new NativeWindow(options)
  }),
  app: { getPath: vi.fn() },
  dialog: { showMessageBox: vi.fn() },
  shell: { openExternal: vi.fn() }
}))

const normalBounds = { x: 100, y: 80, width: 1100, height: 720 }
const maximizedKey = 'window-manager-main/main-window/maximized'
const boundsKey = 'window-manager-main/main-window/trackedBounds'
const disposers: (() => void)[] = []
const windows: AkariMainWindow[] = []
const schedulers: DelayedTaskScheduler[] = []

class NativeWindow extends EventEmitter {
  visible = false
  minimized = false
  maximized = false
  destroyed = false
  bounds = { ...normalBounds }
  webContents = Object.assign(new EventEmitter(), {
    session: new EventEmitter(),
    setZoomFactor: vi.fn(),
    setWindowOpenHandler: vi.fn()
  })
  constructor(_options: unknown) {
    super()
  }
  isDestroyed() {
    return this.destroyed
  }
  isMinimized() {
    return this.minimized
  }
  isMaximized() {
    return this.maximized
  }
  isMaximizable() {
    return true
  }
  isFullScreen() {
    return false
  }
  isFocused() {
    return false
  }
  isVisible() {
    return this.visible
  }
  setContentProtection = vi.fn()
  setOpacity = vi.fn()
  setAlwaysOnTop = vi.fn()
  setProgressBar = vi.fn()
  setVibrancy = vi.fn()
  setBackgroundMaterial = vi.fn()
  loadFile = vi.fn()
  focus = vi.fn()
  getContentBounds() {
    return this.maximized ? { x: 0, y: 0, width: 1920, height: 1080 } : this.bounds
  }
  getNormalBounds() {
    return normalBounds
  }
  setContentBounds(bounds: typeof normalBounds) {
    this.bounds = { ...bounds }
    this.emit('resize')
  }
  show() {
    this.visible = true
    this.emit('show')
  }
  hide() {
    this.visible = false
    this.emit('hide')
  }
  maximize = vi.fn(() => {
    this.maximized = true
    this.emit('maximize')
    this.emit('resize')
    this.show()
  })
  unmaximize() {
    this.maximized = false
    this.emit('unmaximize')
    this.emit('resize')
  }
  minimize() {
    this.minimized = true
    this.emit('minimize')
  }
  restore() {
    this.minimized = false
    this.emit('restore')
  }
  close() {
    this.emit('close', { preventDefault: vi.fn() })
  }
}

function createContext(stored: Map<string, unknown>) {
  const logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
  const scheduler = new DelayedTaskScheduler()
  schedulers.push(scheduler)
  const settingFactory = {
    _delayed: scheduler,
    _getFromStorage: async (namespace: string, key: string, fallback: unknown) =>
      stored.has(`${namespace}/${key}`) ? stored.get(`${namespace}/${key}`) : fallback,
    _saveToStorage: async (namespace: string, key: string, value: unknown) => {
      stored.set(`${namespace}/${key}`, value)
    },
    register(namespace: string, schema: any, settings: any) {
      return new SetterSettingService(
        settingFactory as any,
        namespace,
        schema,
        settings,
        logger as any
      )
    }
  }
  return {
    namespace: 'window-manager-main',
    loggerFactory: { create: () => logger },
    settingFactory,
    mobxUtils: {
      propSync: vi.fn(),
      reaction: (...args: Parameters<typeof reaction>) => {
        const dispose = reaction(...args)
        disposers.push(dispose)
        return dispose
      }
    },
    protocol: { registerPartition: vi.fn() },
    ipc: { onCall: vi.fn(), sendEvent: vi.fn() },
    shared: { global: { isReadyToQuit: false, platform: 'win32' } },
    windowManager: {
      settings: { backgroundMaterial: 'none', contentProtection: false },
      state: { setSystemBackgroundMaterialActive: vi.fn() }
    },
    selfUpdate: { state: { updateProgressInfo: null } },
    appCommon: {},
    keyboardShortcuts: {},
    leagueClient: {},
    gameClient: {},
    scheduler
  }
}

async function launch(stored = new Map<string, unknown>(), ready = true, platform = 'win32') {
  const context = createContext(stored)
  context.shared.global.platform = platform
  const mainWindow = new AkariMainWindow(context as any)
  windows.push(mainWindow)
  await mainWindow.onInit()
  mainWindow.createWindow()
  const nativeWindow = vi.mocked(BrowserWindow).mock.results.at(-1)!.value as NativeWindow
  if (ready) {
    nativeWindow.emit('ready-to-show')
    await Promise.resolve()
  }
  return { mainWindow, nativeWindow, context }
}

afterEach(async () => {
  disposers.splice(0).forEach((dispose) => dispose())
  await Promise.all(schedulers.splice(0).map((scheduler) => scheduler.flush()))
  await Promise.all(windows.splice(0).map((window) => window.onDispose()))
  vi.useRealTimers()
  vi.clearAllMocks()
  vi.mocked(wasRelaunchedAsAdministrator).mockReturnValue(false)
})

describe('elevated main-window startup', () => {
  it('recovers from SW_HIDE even when Chromium incorrectly reports visible, preserving maximization', async () => {
    vi.mocked(wasRelaunchedAsAdministrator).mockReturnValue(true)
    const { mainWindow, nativeWindow } = await launch(new Map([[maximizedKey, true]]), false)
    let hwndVisible = false
    let hiddenAgain = false
    vi.spyOn(nativeWindow, 'hide').mockImplementation(() => {
      hiddenAgain = true
      nativeWindow.visible = false
      nativeWindow.emit('hide')
    })
    vi.spyOn(nativeWindow, 'show').mockImplementation(() => {
      nativeWindow.visible = true
      hwndVisible = hiddenAgain
      nativeWindow.emit('show')
    })
    nativeWindow.emit('ready-to-show')
    await Promise.resolve()
    expect(hwndVisible).toBe(true)
    expect(mainWindow.state.show).toBe(true)
    expect(nativeWindow.isMaximized()).toBe(true)
  })
})

describe('main window maximized-state persistence', () => {
  it('replaces macOS zoom-animation bounds with the actual normal restore rectangle', async () => {
    const stored = new Map<string, unknown>([[boundsKey, normalBounds]])
    const { mainWindow, nativeWindow, context } = await launch(stored, true, 'darwin')
    nativeWindow.bounds = { x: 0, y: 0, width: 1900, height: 1000 }
    nativeWindow.emit('resize')
    nativeWindow.maximize()
    await context.scheduler.flush()
    expect(mainWindow.state.trackedBounds).toEqual(normalBounds)
    expect(stored.get(boundsKey)).toEqual(normalBounds)
  })

  it('keeps the existing normal size for installations without a maximized preference', async () => {
    const { nativeWindow } = await launch(new Map([[boundsKey, normalBounds]]))
    expect(nativeWindow.maximize).not.toHaveBeenCalled()
    expect(nativeWindow.bounds).toEqual(normalBounds)
    expect(nativeWindow.isVisible()).toBe(true)
  })

  it('restores maximization only after the saved normal bounds have been recovered', async () => {
    const stored = new Map<string, unknown>([
      [boundsKey, normalBounds],
      [maximizedKey, true]
    ])
    const { nativeWindow } = await launch(stored, false)
    expect(nativeWindow.isVisible()).toBe(false)
    expect(nativeWindow.maximize).not.toHaveBeenCalled()
    nativeWindow.emit('ready-to-show')
    expect(repositionWindowIfInvisible).toHaveBeenCalledWith(nativeWindow)
    expect(nativeWindow.maximize).toHaveBeenCalledOnce()
    expect(vi.mocked(repositionWindowIfInvisible).mock.invocationCallOrder.at(-1)).toBeLessThan(
      nativeWindow.maximize.mock.invocationCallOrder[0]
    )
    expect(nativeWindow.isVisible()).toBe(true)
    nativeWindow.unmaximize()
    expect(nativeWindow.getContentBounds()).toEqual(normalBounds)
  })

  it('retains maximization across minimizing, restoring, hiding to tray, and relaunching', async () => {
    const stored = new Map<string, unknown>([[boundsKey, normalBounds]])
    const first = await launch(stored)
    first.nativeWindow.maximize()
    first.nativeWindow.minimize()
    first.nativeWindow.emit('unmaximize')
    expect(first.mainWindow.state.status).toBe('minimized')
    first.mainWindow.showOrRestore()
    expect(first.nativeWindow.isMaximized()).toBe(true)
    expect(first.mainWindow.state.status).toBe('maximized')
    first.mainWindow.settings.setCloseAction('minimize-to-tray')
    first.nativeWindow.close()
    expect(first.nativeWindow.isVisible()).toBe(false)
    await first.context.scheduler.flush()
    expect(stored.get(maximizedKey)).toBe(true)
    expect(stored.get(boundsKey)).toEqual(normalBounds)
    const second = await launch(stored)
    expect(second.nativeWindow.isMaximized()).toBe(true)
  })

  it('defers maximization until bounds recovery even if shown before ready', async () => {
    const { mainWindow, nativeWindow } = await launch(new Map([[maximizedKey, true]]), false)
    mainWindow.showOrRestore()
    expect(nativeWindow.isVisible()).toBe(true)
    expect(nativeWindow.maximize).not.toHaveBeenCalled()
    nativeWindow.emit('ready-to-show')
    expect(nativeWindow.maximize).toHaveBeenCalledOnce()
    expect(vi.mocked(repositionWindowIfInvisible).mock.invocationCallOrder.at(-1)).toBeLessThan(
      nativeWindow.maximize.mock.invocationCallOrder[0]
    )
  })

  it('persists the final manual choice during rapid toggles and restores the normal size', async () => {
    const stored = new Map<string, unknown>([
      [boundsKey, normalBounds],
      [maximizedKey, true]
    ])
    const first = await launch(stored)
    first.nativeWindow.unmaximize()
    first.nativeWindow.maximize()
    first.nativeWindow.unmaximize()
    await first.context.scheduler.flush()
    expect(stored.get(maximizedKey)).toBe(false)
    const second = await launch(stored)
    expect(second.nativeWindow.maximize).not.toHaveBeenCalled()
    expect(second.nativeWindow.getContentBounds()).toEqual(normalBounds)
  })

  it('does not replace the saved state with a teardown unmaximize event', async () => {
    const stored = new Map<string, unknown>([[maximizedKey, true]])
    const { context, nativeWindow } = await launch(stored)
    context.shared.global.isReadyToQuit = true
    nativeWindow.unmaximize()
    await context.scheduler.flush()
    expect(stored.get(maximizedKey)).toBe(true)
  })

  it('also restores maximization through the existing force-ready fallback', async () => {
    vi.useFakeTimers()
    const { nativeWindow } = await launch(new Map([[maximizedKey, true]]), false)
    nativeWindow.webContents.emit('did-finish-load')
    await vi.advanceTimersByTimeAsync(5000)
    expect(nativeWindow.isMaximized()).toBe(true)
    expect(nativeWindow.isVisible()).toBe(true)
  })
})
