import type { Component } from 'vue'

export interface TabBarTabAction {
  id: string
  icon: Component
  /** Accessible name and tooltip. */
  label: string
  onClick: (tab: TabBarTab) => void
  loading?: boolean
  disabled?: boolean
  /** Close actions are hidden when the tab is not closable. */
  kind?: 'close'
}

export interface TabBarTab {
  id: string
  icon?: Component
  name: string
  actions?: TabBarTabAction[]
  /** Defaults to true; independent of fixedPosition. */
  closable?: boolean
  /** Fixed tabs must occupy a contiguous prefix at their exact declared positions: 0, 1, 2... */
  fixedPosition?: number
}

export interface TabBarTabReorder {
  id: string
  fromIndex: number
  toIndex: number
}

export function validateTabOrder(tabs: readonly TabBarTab[]): number {
  const ids = new Set<string>()
  let fixedCount = 0

  tabs.forEach((tab, index) => {
    if (!tab.id || ids.has(tab.id)) {
      throw new Error(`TabBar: tab IDs must be nonempty and unique (${tab.id})`)
    }
    ids.add(tab.id)

    if (tab.fixedPosition !== undefined) {
      if (
        !Number.isInteger(tab.fixedPosition) ||
        tab.fixedPosition !== index ||
        index !== fixedCount
      ) {
        throw new Error('TabBar: fixedPosition must form an ordered prefix: 0, 1, 2...')
      }
      fixedCount++
    }
  })

  return fixedCount
}

export function getTabReorder(
  tabs: readonly TabBarTab[],
  id: string,
  sortableIndex: number
): TabBarTabReorder | null {
  const fixedCount = validateTabOrder(tabs)
  const fromIndex = tabs.findIndex((tab) => tab.id === id)
  if (fromIndex < fixedCount || fromIndex < 0 || !Number.isInteger(sortableIndex)) {
    return null
  }

  const toIndex = Math.min(Math.max(fixedCount + sortableIndex, fixedCount), tabs.length - 1)
  return fromIndex === toIndex ? null : { id, fromIndex, toIndex }
}
