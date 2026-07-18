import { describe, expect, it, vi } from 'vitest'
import WebSocket from 'ws'

import { disposeUnexpectedWebSocketResponse } from './websocket-handshake'

describe('disposeUnexpectedWebSocketResponse', () => {
  it('drains the HTTP response and terminates a rejected CONNECTING socket', () => {
    const response = { destroy: vi.fn(), resume: vi.fn() }
    const webSocket = { readyState: WebSocket.CONNECTING, terminate: vi.fn() }

    disposeUnexpectedWebSocketResponse(webSocket, response)

    expect(response.resume).toHaveBeenCalledOnce()
    expect(response.destroy).toHaveBeenCalledOnce()
    expect(webSocket.terminate).toHaveBeenCalledOnce()
  })

  it('does not terminate a socket that has already left CONNECTING state', () => {
    const response = { destroy: vi.fn(), resume: vi.fn() }
    const webSocket = { readyState: WebSocket.CLOSED, terminate: vi.fn() }

    disposeUnexpectedWebSocketResponse(webSocket, response)

    expect(response.resume).toHaveBeenCalledOnce()
    expect(response.destroy).toHaveBeenCalledOnce()
    expect(webSocket.terminate).not.toHaveBeenCalled()
  })
})
