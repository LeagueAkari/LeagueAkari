import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { type TabState, usePlayerTabsStore } from './store'

function createTab(id: string): TabState {
  return {
    id,
    puuid: `puuid-${id}`,
    sgpServerId: 'HN10',
    isLoading: false,
    summoner: null,
    summonerProfile: null,
    refresh: null,
    initParams: null
  }
}

describe('usePlayerTabsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('selects the first created tab even when setCurrent is false', () => {
    const store = usePlayerTabsStore()

    store.createTab(createTab('tab-1'), { setCurrent: false })

    expect(store.currentTabId).toBe('tab-1')
  })

  it('moves a tab to its final index in either direction', () => {
    const store = usePlayerTabsStore()

    for (const id of ['tab-1', 'tab-2', 'tab-3', 'tab-4']) {
      store.createTab(createTab(id))
    }

    store.moveTabToIndex('tab-1', 2)
    expect(store.tabs.map((tab) => tab.id)).toEqual(['tab-2', 'tab-3', 'tab-1', 'tab-4'])

    store.moveTabToIndex('tab-4', 1)
    expect(store.tabs.map((tab) => tab.id)).toEqual(['tab-2', 'tab-4', 'tab-3', 'tab-1'])
  })

  it('keeps the current tab selected while reordering', () => {
    const store = usePlayerTabsStore()

    store.createTab(createTab('tab-1'))
    store.createTab(createTab('tab-2'), { setCurrent: true })

    store.moveTabToIndex('tab-2', 0)

    expect(store.currentTabId).toBe('tab-2')
  })
})
