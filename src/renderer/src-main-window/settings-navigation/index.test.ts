import type { AkariNavigation } from '@renderer-shared/shards/akari-navigation'
import { describe, expect, test, vi } from 'vitest'

import { navigateToSetting } from './index'

describe('Settings navigation', () => {
  test('uses the registered fallback under the original navigation deadline', async () => {
    const navigate = vi
      .fn()
      .mockResolvedValueOnce({ status: 'unavailable' })
      .mockResolvedValueOnce({ status: 'completed' })
    const navigation = { navigate } satisfies AkariNavigation

    await expect(navigateToSetting(navigation, 'app.misc.http-proxy.host')).resolves.toMatchObject({
      status: 'completed'
    })

    expect(navigate).toHaveBeenCalledTimes(2)
    expect(navigate.mock.calls[0]?.[0].at(-1)?.key).toBe('settings-target:app.misc.http-proxy.host')
    expect(navigate.mock.calls[1]?.[0].at(-1)?.key).toBe(
      'settings-target:app.misc.http-proxy.strategy'
    )
    expect(navigate.mock.calls[0]?.[1].deadlineAt).toBe(navigate.mock.calls[1]?.[1].deadlineAt)
  })

  test('does not start a fallback after cancellation', async () => {
    const navigate = vi.fn().mockResolvedValue({ status: 'cancelled' })
    const navigation = { navigate } satisfies AkariNavigation

    await expect(navigateToSetting(navigation, 'app.misc.http-proxy.host')).resolves.toMatchObject({
      status: 'cancelled'
    })
    expect(navigate).toHaveBeenCalledOnce()
  })
})
