import { createAkariResourceProvider } from '@renderer-shared/providers/akari-resource/akari'
import { OPGG_ARAM_BALANCE_SYNC_NAMESPACE } from '@shared/shards/extra-assets'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, expect, it, vi } from 'vitest'

import type { ExtraAssetsRendererContext } from './context'
import { syncExtraAssetsState } from './state-sync'
import { useExtraAssetsStore } from './store'

vi.mock('@renderer-shared/i18n', () => ({ i18next: { t: (key: string) => key } }))
vi.mock('i18next-vue', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))

afterEach(() => setActivePinia(undefined))

it.each([false, true])(
  'exposes ARAM balance to subscribed windows (subscribed: %s)',
  async (subscribed) => {
    setActivePinia(createPinia())
    const store = useExtraAssetsStore()
    const resources = createAkariResourceProvider()
    const balance = { championId: 103, damageDealt: 105 }

    const sync = vi.fn(async (namespace: string, stateId: string, target: object) => {
      if (namespace === OPGG_ARAM_BALANCE_SYNC_NAMESPACE && stateId === 'resources') {
        Object.assign(target, { aramBalance: [balance] })
      }
    })

    await syncExtraAssetsState(
      { piniaMobxUtils: { sync } } as unknown as ExtraAssetsRendererContext,
      subscribed ? { subscribeAramBalance: true } : undefined
    )

    expect(sync).toHaveBeenCalledTimes(subscribed ? 2 : 1)
    expect(resources.champions.aramBalance(103)).toEqual(subscribed ? balance : null)

    store.opgg.aramBalance = []
    expect(resources.champions.aramBalance(103)).toBeNull()
  }
)
