import type { Rectangle } from 'electron'
import { makeAutoObservable, observableRef } from 'mobx'

import type { BaseAkariWindowBasicState } from '../base-akari-window'

export class HextechAugmentWindowSettings {
  pinned = true
  opacity = 1
  constructor() {
    makeAutoObservable(this)
  }
}

export class HextechAugmentWindowState implements BaseAkariWindowBasicState {
  status: 'normal' | 'maximized' | 'minimized' = 'normal'
  focus: 'focused' | 'blurred' = 'blurred'
  ready = false
  show = false
  trackedBounds: Rectangle | null = null
  constructor() {
    makeAutoObservable(this, { trackedBounds: observableRef })
  }
}
