import { describe, expect, it } from 'vitest'

import { type TabBarTab, getTabReorder, validateTabOrder } from './tab-order'

const tab = (id: string, fixedPosition?: number): TabBarTab => ({
  id,
  name: id,
  fixedPosition
})

describe('tab bar ordering', () => {
  it('allows a contiguous fixed prefix and independently non-closable flexible tabs', () => {
    const tabs = [
      tab('tier', 0),
      tab('overview', 1),
      { ...tab('ahri'), closable: false },
      tab('garen')
    ]
    expect(validateTabOrder(tabs)).toBe(2)
    expect(getTabReorder(tabs, 'ahri', 1)).toEqual({ id: 'ahri', fromIndex: 2, toIndex: 3 })
    expect(getTabReorder(tabs, 'overview', 2)).toBeNull()
    expect(getTabReorder(tabs, 'garen', -1)).toEqual({ id: 'garen', fromIndex: 3, toIndex: 2 })
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
    expect(() => validateTabOrder(tabs)).toThrow('ordered prefix')
  })

  it('rejects duplicate IDs and preserves a purely flexible list', () => {
    expect(() => validateTabOrder([tab('a'), tab('a')])).toThrow('unique')
    expect(validateTabOrder([])).toBe(0)
    expect(getTabReorder([tab('a'), tab('b')], 'a', 1)).toEqual({
      id: 'a',
      fromIndex: 0,
      toIndex: 1
    })
    expect(getTabReorder([tab('a')], 'a', 0)).toBeNull()
  })
})
