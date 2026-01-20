/**
 * 代表版本归档文件的信息
 */
export interface ReleaseArchiveFile {
  /** 文件名，如 "LeagueAkari-1.0.0-win.7z" */
  name: string

  /** 文件大小 (bytes) */
  size: number

  /** 文件下载链接 */
  downloadUrl: string

  /** 文件 MIME 类型 */
  contentType: string
}

export interface LatestReleaseInfo {
  /** 版本号，带 v 前缀的如 "v1.1.4" */
  version: string

  /** 当前应用版本 */
  currentVersion: string

  /** 该版本是否是新的版本 */
  isNew: boolean

  /** 版本来源
   * - github: 来自 GitHub Release
   * - gitee: 来自 Gitee Release
   * - last-resort: 在上述指定的仓库失效时，立即尝试从备用仓库拉取
   */
  source: 'github' | 'gitee' | 'last-resort'

  /** 发布时间 ISO 8601 格式 */
  publishedAt: string

  /**
   * 版本更新简介 Markdown 格式
   */
  description: string

  /**
   * 更新用的压缩包文件信息
   *
   * 可能会被自定义设置覆盖
   */
  archiveFile: ReleaseArchiveFile
}
