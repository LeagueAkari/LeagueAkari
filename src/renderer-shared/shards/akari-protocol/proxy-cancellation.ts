import { AKARI_PROXY_REQUEST_ID_HEADER } from '@shared/akari-protocol/proxy-request-cancellation'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

export interface AkariProtocolProxyCancellationOptions {
  cancelProxyRequest: (requestId: string) => Promise<unknown> | unknown
}

interface CancellationMetadata {
  cleanup: () => void
}

const cancellationMetadata = new WeakMap<InternalAxiosRequestConfig, CancellationMetadata>()

function createRequestId() {
  // electron 环境下，三端可用，为了测试环境，用 globalThis 而非 window
  return (
    globalThis.crypto?.randomUUID?.() ??
    `akari-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
}

function isAkariProtocolRequest(config: InternalAxiosRequestConfig) {
  const url = config.url ?? ''
  const baseURL = config.baseURL ?? ''

  return url.startsWith('akari://') || baseURL.startsWith('akari://')
}

function cleanupCancellationMetadata(config?: InternalAxiosRequestConfig) {
  if (!config) {
    return
  }

  const metadata = cancellationMetadata.get(config)
  if (!metadata) {
    return
  }

  metadata.cleanup()
  cancellationMetadata.delete(config)
}

export function installAkariProtocolProxyCancellation(
  httpClient: AxiosInstance,
  options: AkariProtocolProxyCancellationOptions
) {
  httpClient.interceptors.request.use((config) => {
    if (!config.signal || !isAkariProtocolRequest(config)) {
      return config
    }

    const signal = config.signal as AbortSignal
    const requestId = createRequestId()
    config.headers.set(AKARI_PROXY_REQUEST_ID_HEADER, requestId)

    const onAbort = () => {
      void options.cancelProxyRequest(requestId)
    }

    signal.addEventListener('abort', onAbort, { once: true })
    cancellationMetadata.set(config, {
      cleanup: () => signal.removeEventListener('abort', onAbort)
    })

    return config
  })

  httpClient.interceptors.response.use(
    (response) => {
      cleanupCancellationMetadata(response.config)
      return response
    },
    (error) => {
      cleanupCancellationMetadata(error?.config)
      return Promise.reject(error)
    }
  )
}
