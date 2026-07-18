import type { IncomingMessage } from 'node:http'
import WebSocket from 'ws'

/**
 * `ws` delegates ownership of an unexpected HTTP response to applications that subscribe to the
 * event. Consume and destroy it before aborting the still-CONNECTING socket so retries cannot leak
 * response sockets.
 */
export function disposeUnexpectedWebSocketResponse(
  webSocket: Pick<WebSocket, 'readyState' | 'terminate'>,
  response: Pick<IncomingMessage, 'destroy' | 'resume'>
) {
  response.resume()
  response.destroy()

  if (webSocket.readyState === WebSocket.CONNECTING) {
    webSocket.terminate()
  }
}
