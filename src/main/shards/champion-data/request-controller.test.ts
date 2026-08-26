import { describe, expect, it } from 'vitest'

import { ChampionDataRequestController } from './request-controller'

describe('ChampionDataRequestController', () => {
  it('aborts an active renderer request', async () => {
    const requests = new ChampionDataRequestController()
    let signal!: AbortSignal

    const pending = requests.run(7, 'details', async (requestSignal) => {
      signal = requestSignal
      await new Promise<void>((resolve) => requestSignal.addEventListener('abort', () => resolve()))
      requestSignal.throwIfAborted()
      return 'unreachable'
    })

    expect(requests.cancel(7, 'details')).toBe(true)
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(signal.aborted).toBe(true)
    expect(requests.cancel(7, 'details')).toBe(false)
  })

  it('keeps request ids isolated between renderers', async () => {
    const requests = new ChampionDataRequestController()
    let firstSignal!: AbortSignal
    let finishSecond!: () => void

    const first = requests.run(1, 'overview', async (signal) => {
      firstSignal = signal
      await new Promise<void>((resolve) => signal.addEventListener('abort', () => resolve()))
      signal.throwIfAborted()
      return 1
    })
    const second = requests.run(2, 'overview', async () => {
      await new Promise<void>((resolve) => (finishSecond = resolve))
      return 2
    })

    expect(requests.cancel(1, 'overview')).toBe(true)
    expect(firstSignal.aborted).toBe(true)
    finishSecond()
    await expect(first).rejects.toMatchObject({ name: 'AbortError' })
    await expect(second).resolves.toBe(2)
  })
})
