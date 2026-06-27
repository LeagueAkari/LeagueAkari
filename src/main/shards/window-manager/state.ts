import { DownloadTask } from '@shared/shards/window-manager'
import { makeAutoObservable, observable } from 'mobx'

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

/** 已结束任务的最大保留数量 */
const MAX_FINISHED_TASKS = 20

export class WindowManagerState {
  supportsMica: boolean = false

  isManagerFinishedInit: boolean = false

  /** 下载任务列表 */
  downloadTasks: DownloadTask[] = []

  setSupportsMica(supports: boolean) {
    this.supportsMica = supports
  }

  setManagerFinishedInit(ready: boolean) {
    this.isManagerFinishedInit = ready
  }

  addDownloadTask(task: DownloadTask) {
    this.downloadTasks = [...this.downloadTasks, task]
    this._cleanupFinishedTasks()
  }

  updateDownloadTask(id: string, updates: Partial<Omit<DownloadTask, 'id'>>) {
    const task = this.downloadTasks.find((t) => t.id === id)
    if (task) {
      this.downloadTasks = this.downloadTasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
      this._cleanupFinishedTasks()
    }
  }

  removeDownloadTask(id: string) {
    const index = this.downloadTasks.findIndex((t) => t.id === id)
    if (index !== -1) {
      this.downloadTasks = this.downloadTasks.filter((_, i) => i !== index)
      this._cleanupFinishedTasks()
    }
  }

  private _cleanupFinishedTasks() {
    const inProgressTasks = this.downloadTasks.filter((t) => t.state === 'progressing')
    const finishedTasks = this.downloadTasks.filter((t) => t.state !== 'progressing')

    finishedTasks.sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
    const keptFinishedTasks = finishedTasks.slice(0, MAX_FINISHED_TASKS)

    this.downloadTasks = [...inProgressTasks, ...keptFinishedTasks]
  }

  constructor() {
    makeAutoObservable(this, {
      downloadTasks: observable.ref
    })
  }
}
