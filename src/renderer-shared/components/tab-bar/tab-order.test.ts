import { describe, expect, it } from 'vitest'

import { type TabBarItems, type TabBarTab, getReorderedTabIds, resolveTabOrder } from './tab-order'

function tab(id: string, fixedPosition?: number): TabBarTab {
  return { id, name: id, fixedPosition }
}

function createItems(...tabs: TabBarTab[]): TabBarItems {
  return Object.fromEntries(tabs.map(({ id, ...item }) => [id, item]))
}

describe('tab bar ordering', () => {
  it('uses the order model rather than metadata insertion order', () => {
    const items = createItems(tab('garen'), tab('tier', 0), tab('ahri'))
    const { tabs, fixedCount } = resolveTabOrder(items, ['tier', 'ahri', 'garen'])

    expect(tabs.map((tab) => tab.id)).toEqual(['tier', 'ahri', 'garen'])
    expect(tabs[1]).toMatchObject({ id: 'ahri', name: 'ahri' })
    expect(fixedCount).toBe(1)
  })

  it('allows a contiguous fixed prefix and independently non-closable flexible tabs', () => {
    const items = createItems(
      tab('tier', 0),
      tab('overview', 1),
      { ...tab('ahri'), closable: false },
      tab('garen')
    )
    const order = ['tier', 'overview', 'ahri', 'garen']

    expect(resolveTabOrder(items, order).fixedCount).toBe(2)
    expect(getReorderedTabIds(items, order, 'ahri', 1)).toEqual([
      'tier',
      'overview',
      'garen',
      'ahri'
    ])
    expect(getReorderedTabIds(items, order, 'overview', 2)).toBeNull()
    expect(getReorderedTabIds(items, order, 'garen', -1)).toEqual([
      'tier',
      'overview',
      'garen',
      'ahri'
    ])
    expect(order).toEqual(['tier', 'overview', 'ahri', 'garen'])
    expect(Object.keys(items)).toEqual(order)
  })

  it.each([
    [tab('a', 1)],
    [tab('a', 0), tab('b', 0)],
    [tab('a', 0), tab('b', 2)],
    [tab('a'), tab('b', 1)],
    [tab('a', 0), tab('b'), tab('c', 2)],
    [tab('a', -1)],
    [tab('a', 0.5)]
  ])('rejects invalid fixed positions: %j', (...tabs) => {
    expect(() =>
      resolveTabOrder(
        createItems(...tabs),
        tabs.map((tab) => tab.id)
      )
    ).toThrow('ordered prefix')
  })

  it.each([['a'], ['a', 'a'], ['a', 'missing'], ['', 'b']])(
    'rejects incomplete, duplicate or unknown order IDs: %j',
    (...order) => {
      expect(() => resolveTabOrder(createItems(tab('a'), tab('b')), order)).toThrow('TabBar:')
    }
  )

  it('preserves empty, unchanged and purely flexible orders', () => {
    expect(resolveTabOrder({}, [])).toEqual({ tabs: [], fixedCount: 0 })
    const items = createItems(tab('a'), tab('b'))

    expect(getReorderedTabIds(items, ['a', 'b'], 'a', 1)).toEqual(['b', 'a'])
    expect(getReorderedTabIds(items, ['a', 'b'], 'a', 0)).toBeNull()
    expect(getReorderedTabIds(items, ['a', 'b'], 'missing', 0)).toBeNull()
    expect(getReorderedTabIds(items, ['a', 'b'], 'a', Number.NaN)).toBeNull()
  })
})
