import type { SelfUpdateReleaseInfo, UpdateProgressInfo } from '@shared/shards/self-update'
import {
  action,
  computedStruct,
  makeAutoObservable,
  makeObservable,
  observable,
  observableRef
} from 'mobx'

export class SelfUpdateSettings {
  /**
   * 是否自动检查更新
   */
  autoCheckUpdates: boolean = true

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

  setAutoCheckUpdates(autoCheckUpdates: boolean) {
    this.autoCheckUpdates = autoCheckUpdates
  }

  setAutoDownloadUpdates(autoDownloadUpdates: boolean) {
    this.autoDownloadUpdates = autoDownloadUpdates
  }

  setIgnoreVersion(version: string | null) {
    this.ignoreVersion = version
  }
}

export class SelfUpdateState {
  isUpdateSupportedOnCurrentPlatform: boolean
  isCheckingUpdates = false
  updateProgressInfo: UpdateProgressInfo | null = null
  lastUpdateSucceeded: boolean | null = null

  get releaseInfo() {
    return this._resolveReleaseInfo()
  }

  constructor(
    private readonly _resolveReleaseInfo: () => SelfUpdateReleaseInfo | null = () => null,
    isUpdateSupportedOnCurrentPlatform = false
  ) {
    this.isUpdateSupportedOnCurrentPlatform = isUpdateSupportedOnCurrentPlatform
    makeObservable(this, {
      isUpdateSupportedOnCurrentPlatform: observable,
      isCheckingUpdates: observable,
      releaseInfo: computedStruct,
      updateProgressInfo: observableRef,
      lastUpdateSucceeded: observable,
      setCheckingUpdates: action,
      setUpdateProgressInfo: action,
      setLastUpdateSucceeded: action
    })
  }

  setCheckingUpdates(isCheckingUpdates: boolean) {
    this.isCheckingUpdates = isCheckingUpdates
  }

  setUpdateProgressInfo(info: UpdateProgressInfo | null) {
    this.updateProgressInfo = info
  }

  setLastUpdateSucceeded(succeeded: boolean) {
    this.lastUpdateSucceeded = succeeded
  }
}
