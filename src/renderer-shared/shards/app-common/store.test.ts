import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { useAppCommonStore } from './store'

vi.mock('i18next-vue', () => ({
  useTranslation: () => ({
    t: (key: string) => (key === 'appName' ? 'League Akari' : key)
  })
}))

describe('app common title', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('keeps the regular app name when running elevated', () => {
    const store = useAppCommonStore()

    store.isElevated = true

    expect(store.appTitle).toBe('League Akari')
  })
})
