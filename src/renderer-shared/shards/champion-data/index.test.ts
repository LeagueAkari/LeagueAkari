import 'reflect-metadata'

import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ChampionDataRenderer } from '.'
import {
  CHAMPION_DATA_MAIN_NAMESPACE,
  CHAMPION_DATA_OPGG_NAMESPACE,
  CHAMPION_DATA_QQ101_NAMESPACE
} from './context'
import { useChampionDataStore } from './store'

const api = vi.hoisted(() => ({
  getPatches: vi.fn(),
  getTierList: vi.fn()
}))

vi.mock('./http-api', () => ({
  createChampionDataApis: () => ({ qq101: api })
}))

describe('shared champion-data initialization', () => {
  afterEach(() => {
    setActivePinia(undefined)
    vi.clearAllMocks()
  })

  it.each([false, true])(
    'loads full sources only when explicitly enabled (enableFullData: %s)',
    async (enableFullData) => {
      setActivePinia(createPinia())
      const store = useChampionDataStore()
      const overview = { date: '20260916', patch: '16.18', champions: [] }
      api.getPatches.mockResolvedValue([{ id: 18, name: '16.18' }])
      api.getTierList.mockResolvedValue(overview)

      const sync = vi.fn(async (namespace: string, stateId: string) => {
        if (namespace === CHAMPION_DATA_OPGG_NAMESPACE && stateId === 'resources') {
          store.opgg.aramBalance = []
        }

        if (namespace === CHAMPION_DATA_QQ101_NAMESPACE) {
          store.qq101.enabled = true
        }
      })
      const shard = new ChampionDataRenderer(
        { call: vi.fn() } as unknown as ConstructorParameters<typeof ChampionDataRenderer>[0],
        { sync } as unknown as ConstructorParameters<typeof ChampionDataRenderer>[1],
        {} as ConstructorParameters<typeof ChampionDataRenderer>[2],
        { warn: vi.fn() } as unknown as ConstructorParameters<typeof ChampionDataRenderer>[3],
        enableFullData ? { enableFullData: true } : undefined
      )

      try {
        await shard.onInit()
        expect(store.opgg.aramBalance).toEqual([])

        if (enableFullData) {
          await vi.waitFor(() => expect(store.qq101.isLoading).toBe(false))
          expect(store.qq101.overview).toEqual({ mode: 'ranked', data: overview })
          expect(api.getTierList).toHaveBeenCalledOnce()
          expect(sync).toHaveBeenCalledWith(
            CHAMPION_DATA_MAIN_NAMESPACE,
            'settings',
            store.settings
          )
        } else {
          expect(sync).toHaveBeenCalledTimes(1)
          expect(api.getPatches).not.toHaveBeenCalled()
          expect(api.getTierList).not.toHaveBeenCalled()
        }
      } finally {
        await shard.onDispose()
      }
    }
  )
})
