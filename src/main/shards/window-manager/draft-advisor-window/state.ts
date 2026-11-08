import type { Rectangle } from 'electron'
import { makeAutoObservable, observableRef } from 'mobx'

import type { BaseAkariWindowBasicState } from '../base-akari-window'

export class DraftAdvisorWindowSettings {
  pinned: boolean = false

  opacity: number = 1

  setPinned(pinned: boolean) {
    this.pinned = pinned
  }

  setOpacity(opacity: number) {
    this.opacity = opacity
  }

  constructor() {
    makeAutoObservable(this)
  }
}

export class DraftAdvisorWindowState implements BaseAkariWindowBasicState {
  status: 'normal' | 'maximized' | 'minimized' = 'normal'

  focus: 'focused' | 'blurred' = 'blurred'

  ready: boolean = false

  show: boolean = false

  trackedBounds: Rectangle | null = null

  setStatus(status: 'normal' | 'maximized' | 'minimized') {
    this.status = status
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
