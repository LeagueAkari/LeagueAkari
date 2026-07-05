export const AKARI_PROXY_REQUEST_ID_HEADER = 'x-akari-proxy-request-id'

export interface AkariProtocolProxyRequestRegistration {
  requestId: string
  signal: AbortSignal
}

export class AkariProtocolProxyRequestCancellation {
  private readonly _controllers = new Map<string, AbortController>()

  register(request: Request): AkariProtocolProxyRequestRegistration | null {
    const requestId = request.headers.get(AKARI_PROXY_REQUEST_ID_HEADER)
    if (!requestId) {
      return null
    }

    const controller = new AbortController()
    this._controllers.set(requestId, controller)

    return {
      requestId,
      signal: controller.signal
    }
  }

  cancel(requestId: string) {
    const controller = this._controllers.get(requestId)
    if (!controller) {
      return false
    }

    controller.abort()
    this._controllers.delete(requestId)
    return true
  }

  dispose(registration: AkariProtocolProxyRequestRegistration) {
    this._controllers.delete(registration.requestId)
  }
}
