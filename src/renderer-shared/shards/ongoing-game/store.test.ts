import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useOngoingGameStore } from './store'

describe('useOngoingGameStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('enables jungle pathing by default', () => {
    const store = useOngoingGameStore()

    expect(store.settings.showJunglePathing).toBe(true)
  })
})
