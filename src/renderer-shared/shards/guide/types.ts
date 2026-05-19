// 和 NPopover 保持一致
export type ForwardedPlacementType =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-start'
  | 'top-end'
  | 'left-start'
  | 'left-end'
  | 'right-start'
  | 'right-end'
  | 'bottom-start'
  | 'bottom-end'

export interface GuideRendererConfig {
  /** 默认为 false */
  enabled: boolean
}

export interface GuideItem {
  groupId: string
  guideId: string
  order: number
}

export interface GuideGroup {
  groupId: string
  guideItems: GuideItem[]
}
