export type MainWindowCloseAction = 'minimize-to-tray' | 'quit' | 'ask'

export type DownloadTaskState = 'progressing' | 'completed' | 'interrupted' | 'cancelled'

export interface DownloadTask {
  /** 唯一标识 */
  id: string
  /** 文件名 */
  filename: string
  /** 下载 URL */
  url: string
  /** 保存路径 (下载完成后才有) */
  savePath: string
  /** 已接收字节数 */
  receivedBytes: number
  /** 总字节数 (可能为 0，表示未知) */
  totalBytes: number
  /** 下载状态 */
  state: DownloadTaskState
  /** 开始时间戳 */
  startTime: number
  /** 结束时间戳 */
  endTime?: number
}
