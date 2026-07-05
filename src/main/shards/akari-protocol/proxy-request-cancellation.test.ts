import { describe, expect, test } from 'vitest'

import {
  AKARI_PROXY_REQUEST_ID_HEADER,
  AkariProtocolProxyRequestCancellation
} from './proxy-request-cancellation'

describe('AkariProtocolProxyRequestCancellation', () => {
  test('aborts and clears a registered proxy request by request id', () => {
    const cancellation = new AkariProtocolProxyRequestCancellation()
    const request = new Request('akari://league-client/lol-gameflow/v1/session', {
      headers: {
        [AKARI_PROXY_REQUEST_ID_HEADER]: 'request-1'
      }
    })

    const registration = cancellation.register(request)

    expect(registration?.requestId).toBe('request-1')
    expect(registration?.signal.aborted).toBe(false)

    expect(cancellation.cancel('request-1')).toBe(true)
    expect(registration?.signal.aborted).toBe(true)

    cancellation.dispose(registration!)
    expect(cancellation.cancel('request-1')).toBe(false)
  })

  test('ignores requests without a proxy request id', () => {
    const cancellation = new AkariProtocolProxyRequestCancellation()
    const request = new Request('akari://league-client/lol-gameflow/v1/session')

    expect(cancellation.register(request)).toBeNull()
    expect(cancellation.cancel('missing')).toBe(false)
  })
})
