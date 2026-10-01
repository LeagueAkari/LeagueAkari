import type { Qq101HttpApiAxiosHelper } from '@shared/http-api-axios-helper/qq101'
import type { Qq101ChampionDataPreferences } from '@shared/types/champion-data'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, onTestFinished, vi } from 'vitest'

import type { ChampionDataRendererContext } from '../context'
import { useChampionDataStore } from '../store'
import { Qq101ChampionDataController } from './data-controller'
import { Qq101ChampionDataLoader } from './data-loader'

const signal = new AbortController().signal

function createLoader(api: Partial<Qq101HttpApiAxiosHelper>) {
  const logger = { warn: vi.fn() }

  return {
    loader: new Qq101ChampionDataLoader(
      logger as unknown as ConstructorParameters<typeof Qq101ChampionDataLoader>[0],
      api as Qq101HttpApiAxiosHelper
    ),
    logger
  }
}

describe('QQ101 champion data loader', () => {
  it('keeps augment and partner rankings available when hero rankings fail', async () => {
    const { loader } = createLoader({
      getMayhemChampions: vi.fn().mockRejectedValue(new Error('hero snapshot unavailable')),
      getMayhemAugments: vi
        .fn()
        .mockResolvedValue({ date: '20260926', augments: [{ augmentId: 2132 }] }),
      getMayhemPairSynergies: vi.fn().mockResolvedValue({ date: '20260925', synergies: [] })
    })
    const result = await loader.loadOverview(
      { mode: 'aram_mayhem', position: 'all', patch: null, tier: 255 },
      signal
    )
    expect(result.overview.data).toMatchObject({
      champions: [],
      augments: [{ augmentId: 2132 }],
      synergies: [],
      errors: { champions: expect.stringContaining('hero snapshot unavailable') }
    })
  })

  it('uses China calendar dates and only falls back for an empty daily snapshot', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-26T17:00:00Z'))
    onTestFinished(() => {
      vi.useRealTimers()
    })
    const getAramChampions = vi
      .fn()
      .mockResolvedValueOnce({ date: '20260926', champions: [] })
      .mockResolvedValueOnce({ date: '20260925', champions: [{ championId: 22 }] })
    const { loader } = createLoader({ getAramChampions })
    const preferences = { mode: 'aram', position: 'all', patch: null, tier: 255 } as const
    const result = await loader.loadOverview(preferences, signal)
    expect(getAramChampions.mock.calls.map(([date]) => date)).toEqual(['20260926', '20260925'])
    expect(result.overview.data.date).toBe('20260925')

    getAramChampions.mockReset().mockRejectedValue(new Error('invalid schema'))
    await expect(loader.loadOverview(preferences, signal)).rejects.toThrow('invalid schema')
    expect(getAramChampions).toHaveBeenCalledTimes(1)
  })

  it('stops date fallback immediately when cancelled', async () => {
    const abort = new AbortController()
    const getAramChampions = vi.fn(async () => {
      abort.abort()
      return { date: '20260926', champions: [] }
    })
    const { loader } = createLoader({ getAramChampions })
    await expect(
      loader.loadOverview({ mode: 'aram', position: 'all', patch: null, tier: 255 }, abort.signal)
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(getAramChampions).toHaveBeenCalledTimes(1)
  })

  it('loads an unlisted hero in its resolved lane and keeps independent detail failures', async () => {
    const positions = {
      championId: 103,
      date: '20260925',
      positions: [
        { position: 'TOP', share: 0.1 },
        { position: 'MIDDLE', share: 0.9 }
      ]
    }
    const getPositions = vi.fn().mockResolvedValue(positions)
    const getBuild = vi.fn().mockRejectedValue(new Error('build failed'))
    const getRunes = vi.fn().mockResolvedValue({ championId: 103, pages: [] })
    const { loader } = createLoader({
      getPositions,
      getBuild,
      getRunes,
      getMatchups: vi.fn().mockResolvedValue(null),
      getSynergies: vi.fn().mockResolvedValue(null),
      getSummonerSpells: vi.fn().mockResolvedValue(null),
      getSkillOrder: vi.fn().mockResolvedValue(null),
      getTrend: vi.fn().mockResolvedValue(null),
      getTierStats: vi.fn().mockResolvedValue(null),
      getDurations: vi.fn().mockResolvedValue(null)
    })
    const result = await loader.loadDetails(
      { mode: 'ranked', position: 'all', patch: '16.19', tier: 26 },
      {
        mode: 'ranked',
        data: { patch: '16.19', date: '20260925', champions: [] }
      },
      103,
      signal
    )
    expect(getRunes).toHaveBeenCalledWith({ patch: '16.19', tier: 26, position: 'MIDDLE' }, 103, {
      signal
    })
    expect(result).toMatchObject({
      mode: 'ranked',
      data: {
        champion: null,
        championId: 103,
        position: 'MIDDLE',
        build: null,
        runes: { pages: [] },
        errors: { build: expect.stringContaining('build failed') }
      }
    })
  })

  it('does not overwrite each source snapshot date with the hero snapshot date', async () => {
    const { loader } = createLoader({
      getMayhemChampions: vi
        .fn()
        .mockResolvedValue({ date: '20260926', champions: [{ championId: 103 }] }),
      getMayhemAugments: vi.fn().mockResolvedValue({ date: '20260926', augments: [] }),
      getMayhemPairSynergies: vi.fn().mockResolvedValue({ date: '20260925', synergies: [] })
    })
    const result = await loader.loadOverview(
      { mode: 'aram_mayhem', position: 'all', patch: null, tier: 255 },
      signal
    )
    expect(result.overview.data).toMatchObject({
      date: '20260926',
      augmentDate: '20260926',
      synergyDate: '20260925'
    })
  })
  it.each([true, false])(
    'loads when enabled and cancels when disabled (enabled at startup: %s)',
    async (enabledAtStartup) => {
      setActivePinia(createPinia())

      const store = useChampionDataStore()
      const data = { date: '20260913', patch: '16.18', champions: [{ championId: 1 }] }
      const getTierList = vi.fn().mockResolvedValue(data)
      const { loader, logger } = createLoader({
        getPatches: vi.fn().mockResolvedValue([{ id: 18, name: '16.18' }]),
        getTierList
      })
      const controller = new Qq101ChampionDataController(
        {
          logger,
          ipc: {
            call: vi.fn(async (_namespace, _method, preferences: Qq101ChampionDataPreferences) => {
              store.settings.qq101Preferences = preferences
            })
          }
        } as unknown as ChampionDataRendererContext,
        loader
      )

      onTestFinished(() => {
        controller.dispose()
        setActivePinia(undefined)
      })

      store.qq101.enabled = enabledAtStartup
      controller.start()

      if (!enabledAtStartup) {
        expect(getTierList).not.toHaveBeenCalled()
        store.qq101.enabled = true
      }

      await vi.waitFor(() => expect(store.qq101.isLoading).toBe(false))
      expect(store.qq101.overview).toEqual({ mode: 'ranked', data })

      const pending = Promise.withResolvers<typeof data>()
      getTierList.mockReturnValueOnce(pending.promise)
      const refresh = controller.refresh()

      await vi.waitFor(() => expect(getTierList).toHaveBeenCalledTimes(2))
      const signal = getTierList.mock.calls[1][1].signal as AbortSignal
      store.qq101.enabled = false

      expect(signal.aborted).toBe(true)
      expect(store.qq101.isLoading).toBe(false)
      expect(store.qq101.overview).toBeNull()

      pending.resolve(data)
      await expect(refresh).resolves.toBe(false)
      expect(store.qq101.overview).toBeNull()
      expect(logger.warn).not.toHaveBeenCalled()
    }
  )

  it('falls back to the previous ranked patch without converting the response', async () => {
    const previous = {
      date: '20260830',
      patch: '16.16',
      champions: [{ championId: 1 }]
    }
    const getTierList = vi
      .fn()
      .mockResolvedValueOnce({ date: '20260831', patch: '16.17', champions: [] })
      .mockResolvedValueOnce(previous)
    const { loader } = createLoader({
      getPatches: vi.fn().mockResolvedValue([
        { id: 17, name: '16.17' },
        { id: 16, name: '16.16' }
      ]),
      getTierList
    })

    const result = await loader.loadOverview(
      { mode: 'ranked', position: 'middle', patch: null, tier: 26 },
      signal
    )

    expect(result.patch).toBe('16.16')
    expect(result.overview).toEqual({ mode: 'ranked', data: previous })
    expect(getTierList).toHaveBeenLastCalledWith(
      { patch: '16.16', tier: 26, position: 'MIDDLE' },
      { signal }
    )
  })

  it('keeps mayhem source sections independent and tolerates optional failures', async () => {
    const champions = [{ championId: 2, rank: 1 }]
    const synergies = [{ champions: [{ championId: 2 }, { championId: 3 }] }]
    const { loader, logger } = createLoader({
      getMayhemChampions: vi.fn().mockResolvedValue({ date: '20260830', champions }),
      getMayhemAugments: vi.fn().mockRejectedValue(new Error('augment unavailable')),
      getMayhemPairSynergies: vi.fn().mockResolvedValue({ date: '20260830', synergies })
    })

    const result = await loader.loadOverview(
      { mode: 'aram_mayhem', position: 'all', patch: null, tier: 255 },
      signal
    )

    expect(result.overview).toEqual({
      mode: 'aram_mayhem',
      data: {
        date: '20260830',
        augmentDate: null,
        synergyDate: '20260830',
        champions,
        augments: null,
        synergies,
        errors: { augments: expect.stringContaining('augment unavailable') }
      }
    })
    expect(logger.warn).toHaveBeenCalledWith(
      'QQ101 Mayhem augments failed; continuing with partial data',
      expect.stringContaining('augment unavailable')
    )
  })
})
