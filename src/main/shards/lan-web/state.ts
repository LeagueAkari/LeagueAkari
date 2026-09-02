import {
  LAN_WEB_DEFAULT_PORT,
  type LanWebRuntimeState,
  type LanWebServiceStatus,
  type LanWebSettingsData
} from '@shared/shards/lan-web'
import { makeAutoObservable, observableRef } from 'mobx'

export class LanWebSettings implements LanWebSettingsData {
  enabled = false
  port = LAN_WEB_DEFAULT_PORT

  constructor() {
    makeAutoObservable(this)
  }
}

export class LanWebState implements LanWebRuntimeState {
  status: LanWebServiceStatus = 'stopped'
  listeningPort: number | null = null
  accessUrls: string[] = []
  errorMessage: string | null = null

  constructor() {
    makeAutoObservable(this, {
      accessUrls: observableRef
    })
  }

  setStarting() {
    this.status = 'starting'
    this.errorMessage = null
  }

  setRunning(port: number, accessUrls: string[], errorMessage: string | null = null) {
    this.status = 'running'
    this.listeningPort = port
    this.accessUrls = accessUrls
    this.errorMessage = errorMessage
  }

  setStopped() {
    this.status = 'stopped'
    this.listeningPort = null
    this.accessUrls = []
    this.errorMessage = null
  }

  setError(message: string) {
    this.status = 'error'
    this.listeningPort = null
    this.accessUrls = []
    this.errorMessage = message
  }
}
