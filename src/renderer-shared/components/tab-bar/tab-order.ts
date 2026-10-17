import type { Component } from 'vue'

export interface TabBarAddOption {
  id: string
  label: string
  icon?: Component
  disabled?: boolean
}

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

/** Unordered descriptions keyed by stable IDs; the order model determines their positions. */
export type TabBarItems = Readonly<Record<string, Omit<TabBarTab, 'id'>>>

export function resolveTabOrder(items: TabBarItems, order: readonly string[]) {
  if (Object.keys(items).length !== order.length) {
    throw new Error('TabBar: order must contain every item exactly once')
  }

  const ids = new Set<string>()
  let fixedCount = 0

  const tabs = order.map((id, index): TabBarTab => {
    if (!id || ids.has(id) || !Object.hasOwn(items, id)) {
      throw new Error(`TabBar: order IDs must be nonempty, unique and present in items (${id})`)
    }

    ids.add(id)
    const tab = items[id]

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

    return { ...tab, id }
  })

  return { tabs, fixedCount }
}

export function getReorderedTabIds(
  items: TabBarItems,
  order: readonly string[],
  id: string,
  sortableIndex: number
): string[] | null {
  const { fixedCount } = resolveTabOrder(items, order)
  const fromIndex = order.indexOf(id)
  if (fromIndex < fixedCount || fromIndex < 0 || !Number.isInteger(sortableIndex)) {
    return null
  }

  const toIndex = Math.min(Math.max(fixedCount + sortableIndex, fixedCount), order.length - 1)
  if (fromIndex === toIndex) {
    return null
  }

  const next = [...order]
  next.splice(fromIndex, 1)
  next.splice(toIndex, 0, id)
  return next
}
