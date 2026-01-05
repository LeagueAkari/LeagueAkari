/**
 * 更新进度信息
 */
export interface UpdateProgressInfo {
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

/**
 * 上次更新结果
 */
export interface LastUpdateResult {
  success: boolean
  reason: string
}
