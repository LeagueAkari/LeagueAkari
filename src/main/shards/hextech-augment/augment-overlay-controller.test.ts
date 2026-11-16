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
    capture(focused = false, regions: unknown[] = []) {
      worker.capture(focused, regions)
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
  { id: 4, nameTRA: '珠光护手' }
]
function frame(ids = [1, 2, 3]): OcrFrame {
  return {
    type: 'frame',
    capturedAt: Date.now(),
    elapsedMs: 150,
    window: { id: 'game', x: 0, y: 0, width: 1600, height: 900 },
    lines: ids.map((id, slot) => ({
      words: [
        {
          text: augmentNames.find((augment) => augment.id === id)!.nameTRA,
          x: 180 + 480 * slot,
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
    expect(state.snapshot?.labels[1]).toMatchObject({ id: 4, tier: null, performance: null })
  })

  it('reduces repeat captures for stable quick reads and resumes fast reads after a reroll', async () => {
    setup()
    await vi.advanceTimersByTimeAsync(0)
    worker.send!({ type: 'ready' })
    for (let i = 0; i < 3; i++) worker.send!(frame())
    worker.capture.mockClear()
    await vi.advanceTimersByTimeAsync(700)
    expect(worker.capture).toHaveBeenCalledTimes(1)
    worker.send!(frame([1, 4, 3]))
    worker.capture.mockClear()
    await vi.advanceTimersByTimeAsync(700)
    expect(worker.capture).toHaveBeenCalledTimes(2)
  })

  it('keeps slow recognition at full cadence to preserve the frame freshness budget', async () => {
    setup()
    await vi.advanceTimersByTimeAsync(0)
    worker.send!({ type: 'ready' })
    for (let i = 0; i < 3; i++) worker.send!({ ...frame(), elapsedMs: 450 })
    worker.capture.mockClear()
    await vi.advanceTimersByTimeAsync(700)
    expect(worker.capture).toHaveBeenCalledTimes(2)
  })

  it('prefers focused reads after a verified selection and falls back after an incomplete read', async () => {
    setup()
    worker.send!({ type: 'ready' })
    expect(worker.capture).toHaveBeenLastCalledWith(false, [])
    worker.send!(frame())
    await vi.advanceTimersByTimeAsync(350)
    expect(worker.capture).toHaveBeenLastCalledWith(true, expect.any(Array))
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
    incomplete.lines.pop()
    worker.send!(incomplete)
    await vi.advanceTimersByTimeAsync(700)
    expect(worker.capture).toHaveBeenLastCalledWith(false, [])
  })

  it('tries a title-region read when full-window acquisition fails, without publishing guessed cards', async () => {
    const { state } = setup()
    worker.send!({ type: 'ready' })
    const incomplete = frame()
    incomplete.lines.pop()
    worker.send!(incomplete)
    await vi.advanceTimersByTimeAsync(700)
    expect(worker.capture).toHaveBeenLastCalledWith(true, [])
    expect(state.snapshot).toBeNull()
    worker.send!(incomplete)
    await vi.advanceTimersByTimeAsync(700)
    expect(worker.capture).toHaveBeenLastCalledWith(false, [])
  })

  it('reduces OCR requests while no selection is recognized and resumes fast acquisition on a sighting', async () => {
    setup()
    worker.send!({ type: 'ready' })
    const incomplete = frame()
    incomplete.lines.pop()
    worker.send!(incomplete)
    worker.capture.mockClear()
    await vi.advanceTimersByTimeAsync(700)
    expect(worker.capture).toHaveBeenCalledTimes(1)
    worker.send!(frame())
    worker.capture.mockClear()
    await vi.advanceTimersByTimeAsync(700)
    expect(worker.capture).toHaveBeenCalledTimes(2)
  })

  it('hides unrecognized selections and expires a frame when capture stalls', async () => {
    const { state, window } = setup()
    await vi.advanceTimersByTimeAsync(0)
    worker.send!(frame())
    await vi.advanceTimersByTimeAsync(1201)
    expect(state.snapshot).toBeNull()
    expect(window.present).toHaveBeenLastCalledWith(null)
    worker.send!(frame())
    const incomplete = frame()
    incomplete.lines.pop()
    worker.send!(incomplete)
    expect(state.snapshot).toBeNull()
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
    newer.data.sections.augments![0].performanceScore = 99
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
    expect(state.snapshot?.labels[0].performance).toBe(99)
    resolve(ratings())
    await vi.advanceTimersByTimeAsync(0)
    expect(state.snapshot?.labels[0].performance).toBe(99)
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
