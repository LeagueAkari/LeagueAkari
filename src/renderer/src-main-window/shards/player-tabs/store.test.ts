import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { type TabState, usePlayerTabsStore } from './store'

const createTab = (id: string): TabState => ({
  id,
  puuid: `puuid-${id}`,
  sgpServerId: 'HN10',
  isLoading: false,
  summoner: null,
  summonerProfile: null,
  refresh: null,
  initParams: null
})

describe('usePlayerTabsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('selects the first created tab even when setCurrent is false', () => {
    const store = usePlayerTabsStore()

    store.createTab(createTab('tab-1'), { setCurrent: false })

    expect(store.currentTabId).toBe('tab-1')
  })
})
