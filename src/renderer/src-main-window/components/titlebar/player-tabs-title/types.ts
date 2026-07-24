export interface PlayerTabStripItem {
  id: string
  gameName?: string
  tagLine?: string
  profileIconId?: number
  championId?: number | null
  serverLabel?: string
  loading?: boolean
}

export interface PlayerTabStripScrollOptions {
  behavior?: ScrollBehavior
  inline?: 'nearest' | 'center'
}

export interface PlayerTabStripReorderEvent {
  id: string
  fromIndex: number
  toIndex: number
}

export interface PlayerTabStripExpose {
  scrollToTab(id: string, options?: PlayerTabStripScrollOptions): Promise<boolean>
}
