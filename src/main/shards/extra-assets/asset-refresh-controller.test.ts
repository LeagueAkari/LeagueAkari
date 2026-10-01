import type { GtimgHeroListJs } from '@shared/data-sources/gtimg'
import {
  EXTRA_ASSETS_GTIMG_HERO_LIST_FEATURE_GATE,
  EXTRA_ASSETS_GTIMG_KIWI_AUGMENTS_FEATURE_GATE
} from '@shared/shards/feature-gating/keys'
import { observable, reaction, runInAction } from 'mobx'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ExtraAssetsRefreshController } from './asset-refresh-controller'
import { type ExtraAssetsMainContext, GTIMG_HERO_LIST_UPDATE_INTERVAL } from './context'
import { ExtraAssetsStateGtimg } from './state'

const heroList: GtimgHeroListJs = {
  hero: [],
  version: 'current',
  fileName: 'hero_list.js',
  fileTime: ''
}

const controllers: ExtraAssetsRefreshController[] = []

function createRefresh(enabled?: boolean) {
  const gates = observable.map<string, boolean | undefined>([
    [EXTRA_ASSETS_GTIMG_HERO_LIST_FEATURE_GATE, enabled],
    [EXTRA_ASSETS_GTIMG_KIWI_AUGMENTS_FEATURE_GATE, enabled]
  ])
  const gtimg = new ExtraAssetsStateGtimg()
  const gtimgApi = {
    getHeroList: vi
      .fn<(signal?: AbortSignal) => Promise<GtimgHeroListJs>>()
      .mockResolvedValue(heroList),
    getKiwiAugments: vi.fn().mockResolvedValue([]),
    getClassicHeroes: vi.fn().mockResolvedValue([])
  }
  const isEnabled = vi.fn((key: string, fallback: boolean) => gates.get(key) ?? fallback)
  const controller = new ExtraAssetsRefreshController({
    namespace: 'extra-assets-main',
    gtimg,
    gtimgApi,
    featureGating: { isEnabled },
    mobxUtils: { reaction },
    logger: { info: vi.fn(), warn: vi.fn() }
  } as unknown as ExtraAssetsMainContext)
  controllers.push(controller)

  return {
    controller,
    gtimg,
    gtimgApi,
    isEnabled,
    setEnabled: (key: string, value: boolean) => {
      runInAction(() => {
        gates.set(key, value)
      })
    },
    setAllEnabled: (value: boolean) =>
      runInAction(() => {
        gates.set(EXTRA_ASSETS_GTIMG_HERO_LIST_FEATURE_GATE, value)
        gates.set(EXTRA_ASSETS_GTIMG_KIWI_AUGMENTS_FEATURE_GATE, value)
      })
  }
}

describe('GTIMG feature gate', () => {
  it('publishes ordinary heroes while the classic catalog is still pending', async () => {
    const refresh = createRefresh(true)
    const pending = Promise.withResolvers<never[]>()
    refresh.gtimgApi.getClassicHeroes.mockReturnValueOnce(pending.promise)
    refresh.controller.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(refresh.gtimg.heroList).toEqual(heroList)
    expect(refresh.gtimg.classicHeroes).toBeNull()
    refresh.controller.dispose()
    pending.resolve([])
    await vi.advanceTimersByTimeAsync(0)
    expect(refresh.gtimg.classicHeroes).toBeNull()
  })

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    for (const controller of controllers.splice(0)) {
      controller.dispose()
    }

    vi.useRealTimers()
  })

  it('clears existing GTIMG data and skips loading when initially disabled', async () => {
    const refresh = createRefresh(false)
    refresh.gtimg.setHeroList(heroList)
    refresh.gtimg.setKiwiAugments([])
    refresh.controller.start()

    await vi.advanceTimersByTimeAsync(GTIMG_HERO_LIST_UPDATE_INTERVAL)

    expect(refresh.gtimg.heroList).toBeNull()
    expect(refresh.gtimg.kiwiAugments).toBeNull()
    expect(refresh.gtimgApi.getHeroList).not.toHaveBeenCalled()
    expect(refresh.gtimgApi.getKiwiAugments).not.toHaveBeenCalled()
  })

  it('defaults to enabled, stops refreshes on disable, and reloads on re-enable', async () => {
    const refresh = createRefresh()
    refresh.controller.start()
    await vi.advanceTimersByTimeAsync(0)

    expect(refresh.isEnabled).toHaveBeenCalledWith(EXTRA_ASSETS_GTIMG_HERO_LIST_FEATURE_GATE, true)
    expect(refresh.isEnabled).toHaveBeenCalledWith(
      EXTRA_ASSETS_GTIMG_KIWI_AUGMENTS_FEATURE_GATE,
      true
    )
    expect(refresh.gtimg.heroList).toEqual(heroList)
    expect(refresh.gtimg.kiwiAugments).toEqual([])

    refresh.setAllEnabled(false)
    expect(refresh.gtimg.heroList).toBeNull()
    expect(refresh.gtimg.kiwiAugments).toBeNull()
    await vi.advanceTimersByTimeAsync(GTIMG_HERO_LIST_UPDATE_INTERVAL)
    expect(refresh.gtimgApi.getHeroList).toHaveBeenCalledTimes(1)
    expect(refresh.gtimgApi.getKiwiAugments).toHaveBeenCalledTimes(1)

    refresh.setAllEnabled(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(refresh.gtimgApi.getHeroList).toHaveBeenCalledTimes(2)
    expect(refresh.gtimgApi.getKiwiAugments).toHaveBeenCalledTimes(2)
    expect(refresh.gtimg.heroList).toEqual(heroList)
  })

  it.each([
    {
      key: EXTRA_ASSETS_GTIMG_HERO_LIST_FEATURE_GATE,
      state: 'heroList',
      method: 'getHeroList',
      otherState: 'kiwiAugments',
      otherMethod: 'getKiwiAugments'
    },
    {
      key: EXTRA_ASSETS_GTIMG_KIWI_AUGMENTS_FEATURE_GATE,
      state: 'kiwiAugments',
      method: 'getKiwiAugments',
      otherState: 'heroList',
      otherMethod: 'getHeroList'
    }
  ] as const)(
    'disables $state without interrupting the other resource',
    async ({ key, state, method, otherState, otherMethod }) => {
      const refresh = createRefresh()
      refresh.controller.start()
      await vi.advanceTimersByTimeAsync(0)
      const signal = refresh.gtimgApi[method].mock.calls[0][0] as AbortSignal
      const otherSignal = refresh.gtimgApi[otherMethod].mock.calls[0][0] as AbortSignal
      const otherData = refresh.gtimg[otherState]

      refresh.setEnabled(key, false)
      expect(signal.aborted).toBe(true)
      expect(otherSignal.aborted).toBe(false)
      expect(refresh.gtimg[state]).toBeNull()
      expect(refresh.gtimg[otherState]).toEqual(otherData)

      await vi.advanceTimersByTimeAsync(GTIMG_HERO_LIST_UPDATE_INTERVAL)
      expect(refresh.gtimgApi[method]).toHaveBeenCalledTimes(1)
      expect(refresh.gtimgApi[otherMethod]).toHaveBeenCalledTimes(2)

      refresh.setEnabled(key, true)
      await vi.advanceTimersByTimeAsync(0)
      expect(refresh.gtimgApi[method]).toHaveBeenCalledTimes(2)
      expect(refresh.gtimgApi[otherMethod]).toHaveBeenCalledTimes(2)
      expect(refresh.gtimg[state]).not.toBeNull()
    }
  )

  it('aborts in-flight requests and rejects late results even after re-enabling', async () => {
    const refresh = createRefresh(true)
    let resolveOldHeroes!: (value: GtimgHeroListJs) => void
    let resolveOldAugments!: (value: unknown[]) => void
    refresh.gtimgApi.getHeroList.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOldHeroes = resolve
      })
    )
    refresh.gtimgApi.getKiwiAugments.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOldAugments = resolve
      })
    )
    refresh.controller.start()
    const signal = refresh.gtimgApi.getHeroList.mock.calls[0][0]!

    refresh.setAllEnabled(false)
    expect(signal.aborted).toBe(true)
    refresh.setAllEnabled(true)
    await vi.advanceTimersByTimeAsync(0)

    resolveOldHeroes({ ...heroList, version: 'stale' })
    resolveOldAugments([{ augmentID: -1 }])
    await vi.advanceTimersByTimeAsync(0)
    expect(refresh.gtimg.heroList).toEqual(heroList)
    expect(refresh.gtimg.kiwiAugments).toEqual([])

    refresh.controller.dispose()
    await vi.advanceTimersByTimeAsync(GTIMG_HERO_LIST_UPDATE_INTERVAL)
    expect(refresh.gtimgApi.getHeroList).toHaveBeenCalledTimes(2)
    expect(refresh.gtimgApi.getKiwiAugments).toHaveBeenCalledTimes(2)
  })
})
