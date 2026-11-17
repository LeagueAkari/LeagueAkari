import type { HextechAugmentSnapshot } from '@shared/types/hextech-augment'
import { type Rectangle, screen } from 'electron'

import { BaseAkariWindow } from '../base-akari-window'
import type { WindowManagerMainContext } from '../context'
import { HextechAugmentWindowSettings, HextechAugmentWindowState } from './state'

export class AkariHextechAugmentWindow extends BaseAkariWindow<
  HextechAugmentWindowState,
  HextechAugmentWindowSettings
> {
  private _gameBounds: Rectangle | null = null
  private _snapshot: HextechAugmentSnapshot | null = null

  constructor(context: WindowManagerMainContext) {
    super(
      context,
      'hextech-augment-window',
      new HextechAugmentWindowState(),
      new HextechAugmentWindowSettings(),
      {
        baseWidth: 352,
        baseHeight: 136,
        minWidth: 1,
        minHeight: 1,
        htmlEntry: 'hextech-augment-window.html',
        browserWindowOptions: {
          title: 'Hextech augment ratings',
          show: false,
          frame: false,
          transparent: true,
          focusable: false,
          resizable: false,
          maximizable: false,
          minimizable: false,
          fullscreenable: false,
          skipTaskbar: true,
          hasShadow: false,
          roundedCorners: false,
          backgroundColor: '#00000000',
          webPreferences: { backgroundThrottling: false }
        }
      }
    )
  }

  present(snapshot: HextechAugmentSnapshot | null) {
    this._snapshot = snapshot
    if (!snapshot || Date.now() >= snapshot.expiresAt) {
      this._snapshot = null
      this.hide()
      return
    }
    if (!this._window || this._window.isDestroyed()) {
      this._gameBounds = null
      this.createWindow()
      this._window?.once('ready-to-show', () => this.present(this._snapshot))
    }
    if (!this._window || !this.state.ready) return
    // OCR returns physical pixels; Electron windows use device independent coordinates.
    const bounds = screen.screenToDipRect(null, {
      x: Math.round(snapshot.window.x),
      y: Math.round(snapshot.window.y),
      width: Math.round(snapshot.window.width),
      height: Math.round(snapshot.window.height)
    })
    const previous = this._gameBounds
    if (
      !previous ||
      (['x', 'y', 'width', 'height'] as const).some((key) => previous[key] !== bounds[key])
    ) {
      const current = this._window.getBounds()
      const width = Math.min(352, bounds.width)
      const height = Math.min(136, bounds.height)
      const x = previous ? current.x + bounds.x - previous.x : bounds.x + (bounds.width - width) / 2
      const y = previous ? current.y + bounds.y - previous.y : bounds.y + 24
      this._window.setBounds({
        x: Math.round(Math.max(bounds.x, Math.min(x, bounds.x + bounds.width - width))),
        y: Math.round(Math.max(bounds.y, Math.min(y, bounds.y + bounds.height - height))),
        width,
        height
      })
      this._gameBounds = bounds
    }
    this._window.setContentProtection(true)
    this._window.setAlwaysOnTop(true, 'screen-saver', 1)
    this.showOrRestore(true)
  }
}
