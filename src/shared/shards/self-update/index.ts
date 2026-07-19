import type { AkariReleaseArtifact } from '../akari-api'

export interface SelfUpdateReleaseInfo {
  version: string
  currentVersion: string
  publishedAt: string
  description: string
  isNew: boolean
  isUpdateSupported: boolean
  artifact: AkariReleaseArtifact | null
}

/**
 * 更新进度信息
 */
export interface UpdateProgressInfo {
  /**
   * 当前更新阶段
   */
  phase: 'downloading' | 'waiting-for-restart' | 'download-failed'

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
}
