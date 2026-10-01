import type { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OPGG_ARAM_BALANCE_UPDATE_INTERVAL } from '../context'
import { OpggChampionDataState } from '../state'
import { OpggAramBalanceLoader } from './aram-balance-loader'

const loaders: OpggAramBalanceLoader[] = []

function createLoader() {
  const state = new OpggChampionDataState()
  const getAramBalance = vi.fn().mockResolvedValue({ data: { data: [] } })
  const logger = { info: vi.fn(), warn: vi.fn() }
  const loader = new OpggAramBalanceLoader(
    { state, logger } as unknown as ConstructorParameters<typeof OpggAramBalanceLoader>[0],
    { getAramBalance } as unknown as OpggHttpApiAxiosHelper
  )
  loaders.push(loader)

  return { state, getAramBalance, loader }
}

describe('OP.GG ARAM balance refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    for (const loader of loaders.splice(0)) {
      loader.dispose()
    }

    vi.useRealTimers()
  })

  it('loads immediately and periodically even when the champion-data source is disabled', async () => {
    const { state, getAramBalance, loader } = createLoader()
    expect(state.enabled).toBe(false)

    loader.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(state.aramBalance).toEqual([])
    expect(getAramBalance).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(OPGG_ARAM_BALANCE_UPDATE_INTERVAL)
    expect(getAramBalance).toHaveBeenCalledTimes(2)
  })

  it('retains the last successful data after a failure and retries on the next interval', async () => {
    const { state, getAramBalance, loader } = createLoader()
    state.setAramBalance([])
    const previous = state.aramBalance
    getAramBalance.mockRejectedValueOnce(new Error('network unavailable'))

    loader.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(state.aramBalance).toBe(previous)

    await vi.advanceTimersByTimeAsync(OPGG_ARAM_BALANCE_UPDATE_INTERVAL)
    expect(getAramBalance).toHaveBeenCalledTimes(2)
    expect(state.aramBalance).not.toBe(previous)
    expect(state.aramBalance).toEqual([])
  })

  it('cancels requests on disposal and prevents late writes or rescheduling', async () => {
    const { state, getAramBalance, loader } = createLoader()
    let complete!: (value: unknown) => void
    getAramBalance.mockReturnValueOnce(
      new Promise((resolve) => {
        complete = resolve
      })
    )

    loader.start()
    const signal = getAramBalance.mock.calls[0][0].signal as AbortSignal
    loader.dispose()
    expect(signal.aborted).toBe(true)

    complete({ data: { data: [] } })
    await vi.advanceTimersByTimeAsync(OPGG_ARAM_BALANCE_UPDATE_INTERVAL)
    expect(state.aramBalance).toBeNull()
    expect(getAramBalance).toHaveBeenCalledTimes(1)
  })
})
