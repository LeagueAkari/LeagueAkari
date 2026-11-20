import type {
  ChampionDataDetails,
  ChampionDataLoadResult
} from '@shared/data-adapter/champion-data'
import type { OcrFrame } from '@shared/types/hextech-augment'
import { observable, runInAction } from 'mobx'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HextechAugmentOverlayController } from './augment-overlay-controller'
import type { RecognitionWorkerMessage } from './recognition-worker-controller'
import { HextechAugmentSettings, HextechAugmentState } from './state'

const worker = vi.hoisted(() => ({
  send: null as null | ((message: RecognitionWorkerMessage) => void),
  start: vi.fn(),
  capture: vi.fn(),
  stop: vi.fn()
}))
vi.mock('./recognition-worker-controller', () => ({
  RecognitionWorkerController: class {
    constructor(send: (message: RecognitionWorkerMessage) => void) {
      worker.send = send
    }
    start() {
      worker.start()
    }
    capture(focused = true, regions: unknown[] = [], reuseCapture = false) {
      worker.capture(focused, regions, reuseCapture)
    }
    stop() {
      worker.stop()
    }
  }
}))

type Dependencies = ConstructorParameters<typeof HextechAugmentOverlayController>
const augmentNames = [
  { id: 1, nameTRA: '双重打击' },
  { id: 2, nameTRA: '针插垫' },
  { id: 3, nameTRA: '面包和黄油' },
  { id: 4, nameTRA: '珠光护手' },
  { id: 5, nameTRA: '夺金' }
]
function frame(ids = [1, 2, 3]): OcrFrame {
  return {
    type: 'frame',
    capturedAt: Date.now(),
    elapsedMs: 150,
    focused: true,
    window: { id: 'game', x: 0, y: 0, width: 1600, height: 900 },
    lines: ids.map((id, slot) => ({
      words: [
        {
          text: augmentNames.find((augment) => augment.id === id)!.nameTRA,
          x: ids.length === 4 ? 190 + 360 * slot : 180 + 480 * slot,
          y: 330,
          width: 140,
          height: 30
        }
      ]
    }))
  }
}

function ratings(championId = 1): ChampionDataLoadResult<ChampionDataDetails> {
  return {
    status: 'success',
    preferredSource: 'opgg',
    effectiveSource: 'opgg',
    fallbackReason: null,
    attempts: [],
    data: {
      metadata: {
        source: 'opgg',
        mode: 'aram_mayhem',
        patch: null,
        dataDate: null,
        updatedAt: null
      },
      championId,
      summary: {
        championId,
        position: 'none',
        counterChampionIds: [],
        performance: {
          games: null,
          wins: null,
          winRate: null,
          pickRate: null,
          banRate: null,
          kda: null,
          rank: null,
          rankChange: null,
          strengthTier: null,
          averagePlacement: null,
          firstPlaceRate: null
        }
      },
      sections: {
        augments: augmentNames.slice(0, 3).map((augment, tier) => ({
          augmentId: augment.id,
          tier,
          rank: null,
          rankChange: null,
          performanceScore: 50 + tier,
          popularity: null,
          bestChampionIds: [],
          performance: {
            games: null,
            wins: null,
            winRate: null,
            pickRate: null,
            rank: null,
            averagePlacement: null,
            firstPlaceRate: null
          }
        }))
      }
    }
  }
}

describe.skipIf(process.platform !== 'win32')('augment overlay state and async freshness', () => {
  const controllers: HextechAugmentOverlayController[] = []
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-15T12:00:00Z'))
  })
  afterEach(() => {
    controllers.splice(0).forEach((controller) => controller.dispose())
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  function setup(loadDetails = vi.fn().mockResolvedValue(ratings()), enabled = true) {
    const league = observable({
      state: { connectionState: 'connected' },
      data: {
        summoner: { me: { puuid: 'self' } },
        gameflow: {
          phase: 'InProgress',
          session: {
            gameData: {
              queue: { gameMode: 'KIWI' },
              playerChampionSelections: [{ puuid: 'self', championId: 1 }],
              teamOne: [],
              teamTwo: []
            },
            map: { gameMode: 'KIWI' }
          }
        },
        gameData: {
          augments: Object.fromEntries(augmentNames.map((augment) => [augment.id, augment]))
        }
      }
    })
    const championData = {
      settings: observable({
        preferredSource: 'opgg',
        preferences: { mode: 'ranked', region: 'global', tier: 'all', position: 'top' }
      }),
      loadDetails
    }
    const window = { present: vi.fn(), close: vi.fn() }
    const settings = new HextechAugmentSettings()
    settings.enabled = enabled
    const state = new HextechAugmentState()
    const controller = new HextechAugmentOverlayController(
      league as unknown as Dependencies[0],
      championData as unknown as Dependencies[1],
      window as unknown as Dependencies[2],
      settings,
      state,
      { warn: vi.fn() } as unknown as Dependencies[5]
    )
    controllers.push(controller)
    controller.watch()
    return { controller, league, settings, state, window, loadDetails, championData }
  }

  it('ranks equal tiers using performance and retains equal ranks for ties', async () => {
    const result = ratings()
    if (result.status !== 'success') throw new Error('Expected rating fixture')
    const augments = result.data.sections.augments!
    augments.forEach((augment, index) => {
      augment.tier = 2
      augment.performanceScore = [90, 80, 80][index]
    })
    augments.push({ ...augments[0], augmentId: 99, performanceScore: 95 })
    const { state } = setup(vi.fn().mockResolvedValue(result))
    await vi.advanceTimersByTimeAsync(0)
    worker.send!(frame())
    expect(
      state.snapshot?.labels.map(({ tier, tierRank, tierCount }) => ({ tier, tierRank, tierCount }))
    ).toEqual([
      { tier: 'B', tierRank: 2, tierCount: 4 },
      { tier: 'B', tierRank: 3, tierCount: 4 },
      { tier: 'B', tierRank: 3, tierCount: 4 }
    ])
  })

  it('keeps tiers independent and leaves missing performance unranked', async () => {
    const result = ratings()
    if (result.status !== 'success') throw new Error('Expected rating fixture')
    result.data.sections.augments![2].performanceScore = null
    const { state } = setup(vi.fn().mockResolvedValue(result))
    await vi.advanceTimersByTimeAsync(0)
    worker.send!(frame())
    expect(state.snapshot?.labels.map(({ tierRank }) => tierRank)).toEqual([1, 1, null])
  })

  it('waits for opt-in and stops recognition immediately when disabled', async () => {
    const { settings, state, loadDetails, window } = setup(undefined, false)
    await vi.advanceTimersByTimeAsync(1400)
    expect(worker.start).not.toHaveBeenCalled()
    expect(worker.capture).not.toHaveBeenCalled()
    expect(loadDetails).not.toHaveBeenCalled()
    runInAction(() => {
      settings.enabled = true
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(worker.start).toHaveBeenCalledOnce()
    worker.send!(frame())
    expect(state.snapshot?.labels).toHaveLength(3)
    runInAction(() => {
      settings.enabled = false
    })
    expect(state.snapshot).toBeNull()
    expect(state.status).toBe('disabled')
    expect(window.present).toHaveBeenLastCalledWith(null)
  })

  it('shows champion-specific raw grades from the existing data loader', async () => {
    const { state, loadDetails } = setup()
    await vi.advanceTimersByTimeAsync(0)
    worker.send!(frame())
    expect(state.snapshot?.labels.map((label) => label.tier)).toEqual(['S', 'A', 'B'])
    expect(state.snapshot?.championId).toBe(1)
    expect(loadDetails).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'aram_mayhem' }),
      1,
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  it('clears the previous rating when a card is rerolled to an unrated augment', async () => {
    const { state } = setup()
    await vi.advanceTimersByTimeAsync(0)
    worker.send!(frame())
    worker.send!(frame([1, 4, 3]))
    expect(state.snapshot?.labels[1]).toMatchObject({ id: 4, tier: null })
  })

  it('publishes and monitors four slots, clearing stale scores through a reroll and dismissal', async () => {
    const result = ratings()
    if (result.status !== 'success') throw new Error('Expected rating data')
    result.data.sections.augments!.push({
      ...result.data.sections.augments![0],
      augmentId: 4,
      performanceScore: 100
    })
    const { state, window } = setup(vi.fn().mockResolvedValue(result))
    await vi.advanceTimersByTimeAsync(0)
    worker.send?.(frame([1, 2, 3, 4]))
    expect(state.snapshot?.labels.map(({ id, tier }) => [id, tier])).toEqual([
      [1, 'S'],
      [2, 'A'],
      [3, 'B'],
      [4, 'S']
    ])
    expect(state.snapshot?.labels[3].tierRank).toBe(1)
    await vi.advanceTimersByTimeAsync(600)
    expect(worker.capture).toHaveBeenLastCalledWith(true, expect.any(Array), false)
    expect(worker.capture.mock.lastCall?.[1]).toHaveLength(4)

    const partial = frame([1, 2, 3, 4])
    partial.lines.splice(1, 1)
    partial.lines.pop()
    worker.send?.(partial)
    expect(state.snapshot?.labels.map(({ id }) => id)).toEqual([1, null, 3, null])
    await vi.advanceTimersByTimeAsync(600)
    expect(worker.capture).toHaveBeenLastCalledWith(true, [], false)

    worker.send?.(frame([1, 2, 3, 5]))
    expect(state.snapshot?.labels[3]).toMatchObject({ id: 5, slot: 3, tier: null })
    await vi.advanceTimersByTimeAsync(600)
    worker.send?.({ type: 'absent', capturedAt: Date.now() })
    expect(state.snapshot?.labels).toHaveLength(4)
    await vi.advanceTimersByTimeAsync(300)
    worker.send?.({ type: 'absent', capturedAt: Date.now() })
    expect(state.snapshot).toBeNull()
    expect(window.present).toHaveBeenLastCalledWith(null)
    await vi.advanceTimersByTimeAsync(300)
    worker.send?.(frame())
    expect(state.snapshot?.labels.map(({ id }) => id)).toEqual([1, 2, 3])
  })

  it('checks reused stable selections every 300 ms and waits 600 ms after an OCR read', async () => {
    setup()
    worker.send!({ type: 'ready' })
    await vi.advanceTimersByTimeAsync(80)
    worker.send!({ ...frame(), reused: true })
    worker.capture.mockClear()
    await vi.advanceTimersByTimeAsync(299)
    expect(worker.capture).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(worker.capture).toHaveBeenCalledTimes(1)
    worker.send!(frame([1, 4, 3]))
    await vi.advanceTimersByTimeAsync(300)
    expect(worker.capture).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(300)
    expect(worker.capture).toHaveBeenCalledTimes(2)
  })

  it('hides within two light checks after the cards disappear', async () => {
    const { state, window } = setup()
    worker.send!({ type: 'ready' })
    worker.send!(frame())
    window.present.mockClear()
    await vi.advanceTimersByTimeAsync(300)
    worker.send!({ type: 'absent', capturedAt: Date.now() })
    expect(state.snapshot?.labels).toHaveLength(3)
    await vi.advanceTimersByTimeAsync(300)
    expect(worker.capture).toHaveBeenLastCalledWith(true, expect.any(Array), false)
    worker.send!({ type: 'absent', capturedAt: Date.now() })
    expect(state.snapshot).toBeNull()
    expect(window.present).toHaveBeenLastCalledWith(null)
  })

  it('retains the selection through an isolated disappearance check and rejects stale checks', async () => {
    const { state } = setup()
    worker.send!(frame())
    worker.send!({ type: 'absent', capturedAt: Date.now() })
    worker.send!(frame())
    worker.send!({ type: 'absent', capturedAt: Date.now() - 3100 })
    worker.send!({ type: 'absent', capturedAt: Date.now() })
    expect(state.snapshot?.labels).toHaveLength(3)
    worker.send!({ type: 'absent', capturedAt: Date.now() })
    expect(state.snapshot).toBeNull()
    worker.send!(frame([1, 4, 3]))
    expect(state.snapshot?.labels[1].id).toBe(4)
  })

  it('starts with title-band OCR and reuses the same capture for a full fallback', async () => {
    setup()
    worker.send!({ type: 'ready' })
    expect(worker.capture).toHaveBeenLastCalledWith(true, [], false)
    worker.send!(frame())
    await vi.advanceTimersByTimeAsync(600)
    expect(worker.capture).toHaveBeenLastCalledWith(true, expect.any(Array), false)
    const regions = worker.capture.mock.lastCall![1]
    expect(regions).toHaveLength(3)
    frame().lines.forEach((line, slot) => {
      const title = line.words[0]
      expect(regions[slot].x).toBeLessThan(title.x)
      expect(regions[slot].x + regions[slot].width).toBeGreaterThan(title.x + title.width)
      expect(regions[slot].y).toBeLessThan(title.y)
      expect(regions[slot].y + regions[slot].height).toBeGreaterThan(title.y + title.height)
    })
    const incomplete = frame()
    incomplete.lines.splice(1)
    worker.send!(incomplete)
    expect(worker.capture).toHaveBeenLastCalledWith(false, [], true)
  })

  it('publishes two confirmed offers with the unread middle slot pending and then fills it', async () => {
    const { state } = setup()
    worker.send!({ type: 'ready' })
    const incomplete = frame()
    incomplete.lines.splice(1, 1)
    worker.send!(incomplete)
    expect(state.snapshot?.labels.map((label) => label.id)).toEqual([1, null, 3])
    await vi.advanceTimersByTimeAsync(600)
    expect(worker.capture).toHaveBeenLastCalledWith(true, [], false)
    worker.send!(frame())
    expect(state.snapshot?.labels.map((label) => label.id)).toEqual([1, 2, 3])
  })

  it('counts a title-band and full-read failure pair as one miss', async () => {
    const { state } = setup()
    worker.send!({ type: 'ready' })
    worker.send!(frame())
    worker.send!(frame([]))
    worker.send!({ ...frame([]), focused: false })
    expect(state.snapshot).not.toBeNull()
    worker.send!(frame([]))
    expect(state.snapshot).not.toBeNull()
    worker.send!({ ...frame([]), focused: false })
    expect(state.snapshot).toBeNull()
  })

  it('backs off idle reads and resumes acquisition when two offers appear', async () => {
    setup()
    worker.send!({ type: 'ready' })
    worker.send!({ ...frame([]), focused: false })
    worker.capture.mockClear()
    await vi.advanceTimersByTimeAsync(1499)
    expect(worker.capture).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(worker.capture).toHaveBeenCalledOnce()
    const partial = frame()
    partial.lines.splice(1, 1)
    worker.send!(partial)
    await vi.advanceTimersByTimeAsync(600)
    expect(worker.capture).toHaveBeenCalledTimes(2)
  })

  it('expires the displayed selection when capture stalls', async () => {
    const { state, window } = setup()
    await vi.advanceTimersByTimeAsync(0)
    worker.send!(frame())
    await vi.advanceTimersByTimeAsync(4001)
    expect(state.snapshot).toBeNull()
    expect(window.present).toHaveBeenLastCalledWith(null)
  })

  it('retains a selection through an isolated OCR miss and clears it after two full misses', async () => {
    const { state, window } = setup()
    await vi.advanceTimersByTimeAsync(0)
    worker.send!(frame())
    window.present.mockClear()
    const incomplete = { ...frame([]), focused: false }
    worker.send!(incomplete)
    expect(state.snapshot?.labels).toHaveLength(3)
    expect(window.present).not.toHaveBeenCalledWith(null)
    worker.send!(frame())
    worker.send!(incomplete)
    expect(state.snapshot?.labels).toHaveLength(3)
    worker.send!(incomplete)
    expect(state.snapshot).toBeNull()
    expect(window.present).toHaveBeenLastCalledWith(null)
  })

  it('removes a previous card rating while its rerolled title remains unreadable', async () => {
    const { state } = setup()
    await vi.advanceTimersByTimeAsync(0)
    worker.send!(frame())
    const incomplete = frame()
    incomplete.lines.splice(1, 1)
    worker.send!(incomplete)
    expect(state.snapshot?.labels[1]).toMatchObject({ id: null, tier: null })
    worker.send!(frame([1, 4, 3]))
    expect(state.snapshot?.labels[1]).toMatchObject({ id: 4, tier: null })
  })

  it('keeps ratings visible through a slow OCR read without extending the stall deadline', async () => {
    const { state, window } = setup()
    await vi.advanceTimersByTimeAsync(0)
    worker.send!(frame())
    window.present.mockClear()
    await vi.advanceTimersByTimeAsync(1400)
    expect(state.snapshot?.labels).toHaveLength(3)
    worker.send!({ ...frame(), capturedAt: Date.now() - 1400, elapsedMs: 1400 })
    expect(state.snapshot?.labels).toHaveLength(3)
    expect(window.present).not.toHaveBeenCalledWith(null)
    await vi.advanceTimersByTimeAsync(2601)
    expect(state.snapshot).toBeNull()
  })

  it('ignores an old frame without clearing a newer visible selection', async () => {
    const { state } = setup()
    await vi.advanceTimersByTimeAsync(0)
    worker.send!(frame([1, 4, 3]))
    worker.send!({ ...frame(), capturedAt: Date.now() - 3100 })
    expect(state.snapshot?.labels[1].id).toBe(4)
  })

  it('cannot publish a late data response after the champion context changes', async () => {
    let resolve!: (value: ChampionDataLoadResult<ChampionDataDetails>) => void
    const load = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done
          })
      )
      .mockResolvedValue(ratings(2))
    const { league, state } = setup(load)
    worker.send!(frame())
    runInAction(() => {
      league.data.gameflow.session.gameData.playerChampionSelections[0].championId = 2
    })
    await vi.advanceTimersByTimeAsync(0)
    resolve(ratings(1))
    await vi.advanceTimersByTimeAsync(0)
    worker.send!(frame())
    expect(state.snapshot?.championId).toBe(2)
    expect(state.snapshot?.labels[0].tier).toBe('S')
  })

  it('cancels and rejects an older rating response after preferences change for the same champion', async () => {
    let resolve!: (value: ChampionDataLoadResult<ChampionDataDetails>) => void
    const newer = ratings()
    if (newer.status !== 'success') throw new Error('Expected rating fixture')
    newer.data.sections.augments![0].tier = 1
    const load = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done
          })
      )
      .mockResolvedValue(newer)
    const { state, championData } = setup(load)
    const previousSignal = load.mock.calls[0][2].signal as AbortSignal
    runInAction(() => {
      championData.settings.preferences = { ...championData.settings.preferences, region: 'kr' }
    })
    expect(previousSignal.aborted).toBe(true)
    await vi.advanceTimersByTimeAsync(0)
    worker.send!(frame())
    expect(state.snapshot?.labels[0].tier).toBe('A')
    resolve(ratings())
    await vi.advanceTimersByTimeAsync(0)
    expect(state.snapshot?.labels[0].tier).toBe('A')
  })

  it('stops the worker and hides ratings when the connected game changes to another mode', async () => {
    const { state, league, window } = setup()
    await vi.advanceTimersByTimeAsync(0)
    worker.send!(frame())
    worker.stop.mockClear()
    runInAction(() => {
      league.data.gameflow.session.gameData.queue.gameMode = 'ARAM'
      league.data.gameflow.session.map.gameMode = 'ARAM'
    })
    expect(worker.stop).toHaveBeenCalledOnce()
    expect(state.snapshot).toBeNull()
    expect(window.present).toHaveBeenLastCalledWith(null)
    worker.send!(frame())
    expect(state.snapshot).toBeNull()
  })

  it('clears a worker error when the user disables ratings', async () => {
    const { state, settings } = setup()
    worker.send!({ type: 'error', message: 'OCR unavailable' })
    expect(state.error).toBe('OCR unavailable')
    runInAction(() => {
      settings.enabled = false
    })
    expect(state.error).toBeNull()
    expect(state.status).toBe('disabled')
  })

  it('rejects wrong-champion data and stops immediately when disabled or backgrounded', async () => {
    const { settings, state, window } = setup(vi.fn().mockResolvedValue(ratings(99)))
    await vi.advanceTimersByTimeAsync(0)
    worker.send!(frame())
    expect(state.snapshot?.labels.every((label) => label.tier === null)).toBe(true)
    worker.send!({ type: 'hidden' })
    expect(state.snapshot).toBeNull()
    runInAction(() => {
      settings.enabled = false
    })
    expect(state.status).toBe('disabled')
    expect(window.present).toHaveBeenLastCalledWith(null)
    expect(worker.stop).toHaveBeenCalled()
  })
})
