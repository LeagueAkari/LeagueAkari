import icon from '@resources/LA_ICON.ico?asset&asarUnpack'
import type { BackgroundMaterialSetting } from '@shared/shards/window-manager'
import { Event } from 'electron'
import { compareShallow } from 'mobx'
import { z } from 'zod'

import {
  type NativeBackgroundMaterial,
  resolveNativeBackgroundMaterial
} from '../background-material-resolver'
import { BaseAkariWindow } from '../base-akari-window'
import type { WindowManagerMainContext } from '../context'
import { MainWindowSettings, MainWindowState } from './state'

export class AkariMainWindow extends BaseAkariWindow<MainWindowState, MainWindowSettings> {
  static readonly NAMESPACE_SUFFIX = 'main-window'
  static readonly HTML_ENTRY = 'main-window.html'
  static readonly TITLE = 'League Akari'
  static readonly BASE_WIDTH = 1500
  static readonly BASE_HEIGHT = 860
  static readonly MIN_WIDTH = 840
  static readonly MIN_HEIGHT = 600

  private _nextCloseAction: string | null = null

  constructor(_context: WindowManagerMainContext) {
    const state = new MainWindowState()
    const settings = new MainWindowSettings()

    super(_context, AkariMainWindow.NAMESPACE_SUFFIX, state, settings, {
      baseWidth: AkariMainWindow.BASE_WIDTH,
      baseHeight: AkariMainWindow.BASE_HEIGHT,
      minWidth: AkariMainWindow.MIN_WIDTH,
      minHeight: AkariMainWindow.MIN_HEIGHT,
      htmlEntry: AkariMainWindow.HTML_ENTRY,
      rememberPosition: true,
      rememberSize: true,
      repositionWindowIfInvisible: true,
      settingSchema: {
        closeAction: {
          default: settings.closeAction,
          schema: z.enum(['minimize-to-tray', 'quit', 'ask'])
        }
      },
      browserWindowOptions: {
        title: AkariMainWindow.TITLE,
        icon: icon,
        show: false,
        frame: false,
        fullscreenable: false,
        maximizable: true,
        titleBarStyle: 'hidden',
        trafficLightPosition: {
          x: 4,
          y: 12
        },
        // Constructor-time vibrancy also initializes Chromium's backing as transparent.
        // Calling setVibrancy() only after creation leaves the default opaque backing in place.
        ...(process.platform === 'darwin' ? { vibrancy: 'under-window' as const } : {})
      }
    })
  }

  private _watchMainWindow() {
    this._mobxUtils.reaction(
      () => this.state.ready,
      (ready) => {
        if (ready) {
          this.showOrRestore()
        }
      }
    )

    this._mobxUtils.reaction(
      () => [this._windowManager.settings.backgroundMaterial, this.state.ready] as const,
      ([material, ready]) => {
        if (ready) {
          this._applyBackgroundMaterial(material)
        }
      },
      { fireImmediately: true, equals: compareShallow }
    )

    this._mobxUtils.reaction(
      () => this._context.selfUpdate.state.updateProgressInfo,
      (info) => {
        if (!this._window) {
          return
        }

        if (!info) {
          this._window.setProgressBar(-1)
          return
        }

        switch (info.phase) {
          case 'downloading':
            this._window.setProgressBar(info.downloadingProgress)
            break
          case 'download-failed':
            this._window.setProgressBar(info.downloadingProgress, { mode: 'error' })
            break
          default:
            this._window.setProgressBar(-1)
        }
      }
    )
  }

  private _applyBackgroundMaterial(material: BackgroundMaterialSetting) {
    if (!this._window) {
      this._windowManager.state.setSystemBackgroundMaterialActive(false)
      return
    }

    if (material === 'system' && !this._windowManager.state.supportsSystemBackgroundMaterial) {
      this._windowManager.state.setSystemBackgroundMaterialActive(false)
      return
    }

    const nativeMaterial = resolveNativeBackgroundMaterial(
      material,
      this._context.shared.global.platform,
      this._windowManager.state.supportsMica
    )

    try {
      this._setNativeBackgroundMaterial(nativeMaterial)
      this._windowManager.state.setSystemBackgroundMaterialActive(nativeMaterial !== 'none')
    } catch (error) {
      this._windowManager.state.setSystemBackgroundMaterialActive(false)

      if (material === 'system') {
        this._windowManager.state.setSupportsSystemBackgroundMaterial(false)
      }

      this._logger.warn(
        'Failed to apply system background material, falling back to a solid background',
        {
          platform: this._context.shared.global.platform,
          nativeMaterial
        },
        error
      )

      try {
        this._setNativeBackgroundMaterial('none')
      } catch (clearError) {
        this._logger.warn('Failed to clear native background material after fallback', clearError)
      }
    }
  }

  private _setNativeBackgroundMaterial(material: NativeBackgroundMaterial) {
    if (!this._window) {
      return
    }

    if (this._context.shared.global.platform === 'darwin') {
      this._window.setVibrancy(material === 'vibrancy' ? 'under-window' : null)
      return
    }

    if (this._context.shared.global.platform === 'win32') {
      this._window.setBackgroundMaterial(material === 'mica' ? 'mica' : 'none')
    }
  }

  private _registerMainWindowIpcHandlers() {
    this._ipc.onCall(this._namespace, 'closeMainWindow', async (_, strategy) => {
      this._nextCloseAction = strategy
      this._window?.close()
    })

    this._ipc.onCall(this._namespace, 'closeMainWindowForce', async () => {
      this.close(true)
    })

    this._ipc.onCall(
      this._namespace,
      'setTrafficLightPosition',
      async (_, x: number, y: number) => {
        if (process.platform !== 'darwin') {
          return
        }

        this._window?.setWindowButtonPosition({ x, y })
      }
    )
  }

  protected override handleClose(event: Event) {
    if (this._trueClose || this._context.shared.global.isReadyToQuit) {
      this.emit('main-window-close')
      return
    }

    const s = this._nextCloseAction || this.settings.closeAction

    if (s === 'minimize-to-tray' || process.platform === 'darwin') {
      event.preventDefault()
      this._window?.hide()
    } else if (s === 'ask') {
      event.preventDefault()

      if (!this.state.show) {
        this._window?.show()
      }

      this._context.ipc.sendEvent(this._namespace, 'close-asking')
      this.showOrRestore()
    } else {
      this.close(true)
    }

    this._nextCloseAction = null
  }

  protected override getSettingPropKeys() {
    return ['closeAction'] as const
  }

  override async onInit() {
    await super.onInit()

    this._watchMainWindow()
    this._registerMainWindowIpcHandlers()
  }
}
