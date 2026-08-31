import type { AkariAuxWindow } from './aux-window/window'
import { isSystemBackgroundMaterialSupported } from './background-material-resolver'
import type { AkariCdTimerWindow } from './cd-timer-window/windows'
import type { WindowManagerMainContext } from './context'
import type { AkariMainWindow } from './main-window/window'
import type { AkariOngoingGameWindow } from './ongoing-game-window/window'
import type { AkariOpggWindow } from './opgg-window/window'

interface WindowManagerWindows {
  mainWindow: AkariMainWindow
  auxWindow: AkariAuxWindow
  opggWindow: AkariOpggWindow
  ongoingGameWindow: AkariOngoingGameWindow
  cdTimerWindow: AkariCdTimerWindow
}

export class WindowManagerLifecycleController {
  constructor(
    private readonly _context: WindowManagerMainContext,
    private readonly _windows: WindowManagerWindows
  ) {}

  async init() {
    await this._context.settingService.applyToState()

    const supportsMica = this._context.shared.global.isWindows11_22H2_OrHigher
    this._context.windowManager.state.setSupportsMica(supportsMica)
    this._context.windowManager.state.setSupportsSystemBackgroundMaterial(
      isSystemBackgroundMaterialSupported(this._context.shared.global.platform, supportsMica)
    )

    this._context.mobxUtils.propSync(
      this._context.namespace,
      'state',
      this._context.windowManager.state,
      [
        'supportsMica',
        'supportsSystemBackgroundMaterial',
        'systemBackgroundMaterialActive',
        'downloadTasks'
      ]
    )
    this._context.mobxUtils.propSync(
      this._context.namespace,
      'settings',
      this._context.windowManager.settings,
      ['backgroundMaterial', 'contentProtection']
    )

    this._windows.mainWindow.on('main-window-close', () => {
      this._context.shared.global.quit()
    })

    await this._windows.mainWindow.onInit()
    await this._windows.auxWindow.onInit()
    await this._windows.opggWindow.onInit()
    await this._windows.ongoingGameWindow.onInit()
    await this._windows.cdTimerWindow.onInit()
  }

  finish() {
    this._context.shared.global.events.on('second-instance', () => {
      this._windows.mainWindow.showOrRestore()
    })
    this._context.windowManager.state.setManagerFinishedInit(true)
    this._windows.mainWindow.createWindow()
  }
}
