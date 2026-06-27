import { LastUpdateResult, UpdateProgressInfo } from '@shared/shards/self-update'
import { makeAutoObservable, observable } from 'mobx'

export class SelfUpdateSettings {
  /**
   * 是否自动下载更新
   */
  autoDownloadUpdates: boolean = true

  /**
   * 忽略的版本号
   */
  ignoreVersion: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  setAutoDownloadUpdates(autoDownloadUpdates: boolean) {
    this.autoDownloadUpdates = autoDownloadUpdates
  }

  setIgnoreVersion(version: string | null) {
    this.ignoreVersion = version
  }
}

export class SelfUpdateState {
  updateProgressInfo: UpdateProgressInfo | null = null
  lastUpdateResult: LastUpdateResult | null = null

  constructor() {
    makeAutoObservable(this, {
      updateProgressInfo: observable.ref,
      lastUpdateResult: observable.ref
    })
  }

  setUpdateProgressInfo(info: UpdateProgressInfo | null) {
    this.updateProgressInfo = info
  }

  setLastUpdateResult(result: LastUpdateResult) {
    this.lastUpdateResult = result
  }
}
