import 'reflect-metadata'

import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import { ChampionDataRenderer } from '.'
import { CHAMPION_DATA_MAIN_NAMESPACE, CHAMPION_DATA_QQ101_NAMESPACE } from './context'
import { useChampionDataStore } from './store'

vi.mock('@renderer-shared/i18n', () => ({ i18next: { t: (key: string) => key } }))

const api = vi.hoisted(() => ({
  getPatches: vi.fn(),
  getTierList: vi.fn()
}))

vi.mock('./http-api', () => ({
  createChampionDataApis: () => ({ qq101: api })
}))

describe('champion data window initialization', () => {
  afterEach(() => {
    setActivePinia(undefined)
    vi.clearAllMocks()
  })

  it('syncs settings and starts the enabled sources when the window initializes', async () => {
    setActivePinia(createPinia())

    const store = useChampionDataStore()
    const overview = { date: '20260916', patch: '16.18', champions: [] }

    api.getPatches.mockResolvedValue({ data: { code: 0, data: [{ id: '18', name: '16.18' }] } })
    api.getTierList.mockResolvedValue({
      data: {
        code: 0,
        data: {
          _fieldValues: { R17960: JSON.stringify({ dtstatdate: '20260916', datadetails: '' }) }
        }
      }
    })

    const settingsSnapshot = Promise.withResolvers<void>()
    const sync = vi.fn(async (namespace: string) => {
      if (namespace === CHAMPION_DATA_MAIN_NAMESPACE) {
        await settingsSnapshot.promise
      }

      if (namespace === CHAMPION_DATA_QQ101_NAMESPACE) {
        store.qq101.enabled = true
      }
    })
    const setupInAppScope = new SetupInAppScopeRenderer()
    const scope = effectScope()

    const shard = new ChampionDataRenderer(
      { call: vi.fn() } as unknown as ConstructorParameters<typeof ChampionDataRenderer>[0],
      { sync } as unknown as ConstructorParameters<typeof ChampionDataRenderer>[1],
      {} as ConstructorParameters<typeof ChampionDataRenderer>[2],
      { warn: vi.fn() } as unknown as ConstructorParameters<typeof ChampionDataRenderer>[3],
      {} as ConstructorParameters<typeof ChampionDataRenderer>[4],
      setupInAppScope
    )

    try {
      const initialized = shard.onInit()
      await Promise.resolve()

      scope.run(() => setupInAppScope.runSetupFns())
      expect(api.getPatches).not.toHaveBeenCalled()

      settingsSnapshot.resolve()
      await initialized

      scope.run(() => setupInAppScope.runSetupFns())
      await vi.waitFor(() => expect(store.qq101.isLoading).toBe(false))

      expect(store.qq101.overview).toEqual({ mode: 'ranked', data: overview })
      expect(api.getTierList).toHaveBeenCalledOnce()
      expect(sync).toHaveBeenCalledWith(CHAMPION_DATA_MAIN_NAMESPACE, 'settings', store.settings)

      scope.stop()

      store.qq101.enabled = false
      store.qq101.enabled = true
      expect(api.getPatches).toHaveBeenCalledOnce()
    } finally {
      scope.stop()
      await shard.onDispose()
    }
  })
})
