import { Rectangle } from 'electron'
import { makeAutoObservable, observableRef } from 'mobx'

export class SecondaryWindowSettings {
  enabled: boolean = true
  autoShowInLobby: boolean = true
  autoShowInChampSelect: boolean = true
  opacity: number = 1
  pinned: boolean = true
  showShortcut: string | null = null
  showSkinSelector: boolean = false

  setOpacity(opacity: number) {
    this.opacity = opacity
  }

  setPinned(pinned: boolean) {
    this.pinned = pinned
  }

  setAutoShowInLobby(autoShow: boolean) {
    this.autoShowInLobby = autoShow
  }

  setAutoShowInChampSelect(autoShow: boolean) {
    this.autoShowInChampSelect = autoShow
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  setShowShortcut(showShortcut: string | null) {
    this.showShortcut = showShortcut
  }

  setShowSkinSelector(showSkinSelector: boolean) {
    this.showSkinSelector = showSkinSelector
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class SecondaryWindowState {
  status: 'normal' | 'maximized' | 'minimized' = 'normal'

  focus: 'focused' | 'blurred' = 'focused'

  /**
   * 对应 Electron 的 ready 事件
   */
  ready: boolean = false

  show: boolean = true

  trackedBounds: Rectangle | null = null

  setStatus(status: 'normal' | 'maximized' | 'minimized') {
    this.status = status
  }

  setFocus(focus: 'focused' | 'blurred') {
    this.focus = focus
  }

  setReady(ready: boolean) {
    this.ready = ready
  }

  setShow(show: boolean) {
    this.show = show
  }

  setTrackedBounds(bounds: Rectangle | null) {
    this.trackedBounds = bounds
  }

  constructor() {
    makeAutoObservable(this, {
      trackedBounds: observableRef
    })
  }
}
