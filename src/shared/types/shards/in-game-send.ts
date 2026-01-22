export interface SendableItemContentPlaintext {
  type: 'plaintext'
  content: string
}

export interface SendableItemContentTemplate {
  type: 'template'
  templateId: string | null
}

export type SendableItemContent = SendableItemContentPlaintext | SendableItemContentTemplate

export interface SendableItem {
  id: string
  name: string
  enabled: boolean

  /**
   * 通用快捷键, 或发送到全局
   */
  sendAllShortcut: string | null

  /**
   * 发送到己方
   */
  sendAllyShortcut: string | null

  /**
   * 发送到敌方
   */
  sendEnemyShortcut: string | null

  /**
   * 内容
   */
  content: SendableItemContent
}

export interface InGameSendTemplateCatalog {
  templates: Array<{
    id: string
    name: string
    type: string
    description: string
  }>
}
