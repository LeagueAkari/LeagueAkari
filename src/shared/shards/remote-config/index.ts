export interface AnnouncementFrontMatter {
  /**
   * low: 不会提醒
   * medium: 只会提示
   * high: 会弹窗提醒
   */
  alertLevel?: 'low' | 'medium' | 'high'

  /**
   * 公告摘要
   */
  summary?: string
}

export interface Announcement {
  content: string
  frontMatter: AnnouncementFrontMatter
  uniqueId: string
}
