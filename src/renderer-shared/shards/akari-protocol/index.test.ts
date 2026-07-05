import { AKARI_PROTOCOL_MAIN_NAMESPACE } from '@shared/akari-protocol/namespace'
import { describe, expect, test, vi } from 'vitest'

import type { AkariIpcRenderer } from '../ipc'
import { AkariProtocolRenderer } from './index'

describe('AkariProtocolRenderer', () => {
  test('wraps proxy request cancellation IPC', async () => {
    const ipc = {
      call: vi.fn().mockResolvedValue(true)
    } as unknown as AkariIpcRenderer

    const akariProtocol = new AkariProtocolRenderer(ipc)

    await expect(akariProtocol.cancelProxyRequest('request-1')).resolves.toBe(true)
    expect(ipc.call).toHaveBeenCalledWith(
      AKARI_PROTOCOL_MAIN_NAMESPACE,
      'cancelProxyRequest',
      'request-1'
    )
  })
})
