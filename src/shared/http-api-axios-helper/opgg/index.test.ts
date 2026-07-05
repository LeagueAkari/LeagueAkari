import type { AxiosInstance } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { OpggHttpApiAxiosHelper } from './index'

describe('OpggHttpApiAxiosHelper', () => {
  it('requests ARAM Mayhem tiers with the OP.GG content type', async () => {
    const get = vi.fn().mockResolvedValue({ data: { data: [] } })
    const httpClient = {
      defaults: {},
      get
    } as unknown as AxiosInstance
    const signal = new AbortController().signal

    const helper = new OpggHttpApiAxiosHelper(httpClient)

    await helper.getAramMayhemTiers({ signal })

    expect(get).toHaveBeenCalledWith('/api/contents/tiers', {
      params: {
        type: 'aram_mayhem'
      },
      signal
    })
  })
})
