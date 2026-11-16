import type { HextechAugmentSnapshot } from '@shared/types/hextech-augment'
import { screen } from 'electron'

import { BaseAkariWindow } from '../base-akari-window'
import type { WindowManagerMainContext } from '../context'
import { HextechAugmentWindowSettings, HextechAugmentWindowState } from './state'

export class AkariHextechAugmentWindow extends BaseAkariWindow<
  HextechAugmentWindowState,
  HextechAugmentWindowSettings
> {
  constructor(context: WindowManagerMainContext) {
    super(
      context,
      'hextech-augment-window',
      new HextechAugmentWindowState(),
      new HextechAugmentWindowSettings(),
      {
        baseWidth: 800,
        baseHeight: 600,
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
    if (!snapshot) {
      this.hide()
      return
    }
    if (!this._window || this._window.isDestroyed()) this.createWindow()
    if (!this._window || !this.state.ready) return
    // OCR returns physical pixels; Electron windows use device independent coordinates.
    const bounds = screen.screenToDipRect(null, {
      x: Math.round(snapshot.window.x),
      y: Math.round(snapshot.window.y),
      width: Math.round(snapshot.window.width),
      height: Math.round(snapshot.window.height)
    })
    this._window.setContentProtection(true)
    this._window.setIgnoreMouseEvents(true)
    this._window.setAlwaysOnTop(true, 'screen-saver', 1)
    this._window.setBounds(bounds)
    this.showOrRestore(true)
  }
}
