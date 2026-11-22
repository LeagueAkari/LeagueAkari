import 'reflect-metadata'

import type { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { createChampionDataContext } from '@secondary-window/context'
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
    store.opgg.enabled = false
    const overview = { date: '20260916', patch: '16.18', champions: [] }

    api.getPatches.mockResolvedValue({ data: { code: 0, data: [{ id: '18', name: '16.18' }] } })
    api.getTierList.mockResolvedValue({
      data: {
        code: 0,
        data: {
          result: JSON.stringify({ dtstatdate: '20260916', datadetails: '' })
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
    const scope = effectScope()
    const call = vi.fn().mockResolvedValue(undefined)

    const shard = new ChampionDataRenderer(
      { call } as unknown as ConstructorParameters<typeof ChampionDataRenderer>[0],
      { sync } as unknown as ConstructorParameters<typeof ChampionDataRenderer>[1],
      {} as ConstructorParameters<typeof ChampionDataRenderer>[2],
      { warn: vi.fn() } as unknown as ConstructorParameters<typeof ChampionDataRenderer>[3]
    )

    try {
      const initialized = shard.onInit()
      await Promise.resolve()

      expect(api.getPatches).not.toHaveBeenCalled()

      settingsSnapshot.resolve()
      await initialized

      const window = scope.run(() =>
        createChampionDataContext(shard.context, shard.api, {} as LeagueClientRenderer)
      )!
      const state = window.qq101.state
      await vi.waitFor(() => expect(state.isLoading).toBe(false))

      expect(state.overview).toEqual({ mode: 'ranked', data: overview })
      expect(api.getTierList).toHaveBeenCalledOnce()
      expect(sync).toHaveBeenCalledWith(CHAMPION_DATA_MAIN_NAMESPACE, 'settings', store.settings)

      const loadedOverview = state.overview
      await shard.setFlashPosition('f')

      expect(call).toHaveBeenCalledWith(CHAMPION_DATA_MAIN_NAMESPACE, 'setOpggFlashPosition', 'f')
      expect(state.overview).toBe(loadedOverview)
      expect(api.getTierList).toHaveBeenCalledOnce()

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
