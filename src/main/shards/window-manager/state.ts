import { makeAutoObservable } from 'mobx'

export class WindowManagerSettings {
  backgroundMaterial: 'mica' | 'none' = 'none'

  /** not used */
  overlayType: 'window-band' | 'topmost' = 'window-band'

  contentProtection: boolean = false

  setBackgroundMaterial(material: 'mica' | 'none') {
    this.backgroundMaterial = material
  }

  setOverlayType(type: 'window-band' | 'topmost') {
    this.overlayType = type
  }

  setContentProtection(protection: boolean) {
    this.contentProtection = protection
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class WindowManagerState {
  supportsMica: boolean = false

  isManagerFinishedInit: boolean = false

  setSupportsMica(supports: boolean) {
    this.supportsMica = supports
  }

  setManagerFinishedInit(ready: boolean) {
    this.isManagerFinishedInit = ready
  }

  constructor() {
    makeAutoObservable(this)
  }
}
