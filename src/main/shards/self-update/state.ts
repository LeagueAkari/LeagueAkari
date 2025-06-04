import { makeAutoObservable, observable } from 'mobx'

interface UpdateProgressInfo {
  /**
   * 当前更新阶段
   */
  phase: 'downloading' | 'unpacking' | 'waiting-for-restart' | 'download-failed' | 'unpack-failed'

  /**
   * 当前下载进度，0 到 1
   */
  downloadingProgress: number

  /**
   * 平均下载速度，单位 B/s
   */
  averageDownloadSpeed: number

  /**
   * 剩余下载时间，单位秒
   */
  downloadTimeLeft: number

  /**
   * 更新包大小
   */
  fileSize: number

  /**
   * 解压进度，0 到 1
   */
  unpackingProgress: number
}

interface LastUpdateResult {
  success: boolean
  reason: string
}

export class SelfUpdateSettings {
  /**
   * 是否自动检查更新，检查到更新才会下载更新
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
