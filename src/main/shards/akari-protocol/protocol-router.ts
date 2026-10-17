import { session } from 'electron'
import { TransformStream } from 'node:stream/web'

import { AKARI_PROXY_PROTOCOL, type AkariProtocolDomainHandler } from './context'
import { AkariProtocolProxyRequestCancellation } from './proxy-request-cancellation'

export class AkariProtocolRouter {
  private readonly _domainRegistry = new Map<string, AkariProtocolDomainHandler>()
  private readonly _partitionRegistry = new Set<string>()
  private readonly _proxyRequestCancellation = new AkariProtocolProxyRequestCancellation()

  registerPartition(partition: string) {
    if (this._partitionRegistry.has(partition)) {
      throw new Error(`Partition ${partition} is already registered`)
    }

    this._partitionRegistry.add(partition)
    this._registerPartitionAkariProtocol(partition)
  }

  unregisterPartition(partition: string) {
    if (!this._partitionRegistry.has(partition)) {
      throw new Error(`Partition ${partition} is not registered`)
    }

    this._partitionRegistry.delete(partition)
    this._unhandlePartitionAkariProtocol(partition)
  }

  registerDomain(domain: string, handler: AkariProtocolDomainHandler) {
    if (this._domainRegistry.has(domain)) {
      throw new Error(`Domain ${domain} is already registered`)
    }

    this._domainRegistry.set(domain, handler)
  }

  unregisterDomain(domain: string) {
    if (!this._domainRegistry.has(domain)) {
      throw new Error(`Domain ${domain} is not registered`)
    }

    this._domainRegistry.delete(domain)
  }

  cancelProxyRequest(requestId: string) {
    return this._proxyRequestCancellation.cancel(requestId)
  }

  private _unhandlePartitionAkariProtocol(partition: string) {
    session.fromPartition(partition).protocol.unhandle(AKARI_PROXY_PROTOCOL)
  }

  private _registerPartitionAkariProtocol(partition: string) {
    session.fromPartition(partition).protocol.handle(AKARI_PROXY_PROTOCOL, async (req) => {
      const path1 = req.url.slice(`${AKARI_PROXY_PROTOCOL}://`.length)
      const index = path1.indexOf('/')
      const domain = path1.slice(0, index).trim()
      const uri = path1.slice(index + 1).trim()

      const handler = this._domainRegistry.get(domain)
      if (handler) {
        return this._handleRequest(handler, uri, req)
      }

      return new Response(`No handler for ${req.url}`, {
        statusText: 'Not Found',
        headers: { 'Content-Type': 'text/plain' },
        status: 404
      })
    })
  }

  private async _handleRequest(handler: AkariProtocolDomainHandler, uri: string, request: Request) {
    const registration = this._proxyRequestCancellation.register(request)
    const controller = new AbortController()
    const signals = [request.signal, controller.signal]
    if (registration) {
      signals.push(registration.signal)
    }

    const signal = AbortSignal.any(signals)
    const cleanup = () => {
      if (registration) {
        this._proxyRequestCancellation.dispose(registration)
      }
    }

    try {
      signal.throwIfAborted()

      const response = await handler(uri, request, {
        requestId: registration?.requestId,
        signal
      })

      if (!response.body) {
        cleanup()
        return response
      }

      const stream = new TransformStream({
        // Abort before pipeTo waits for the source's asynchronous cancellation.
        cancel: (reason) => controller.abort(reason)
      })
      const proxiedResponse = new Response(stream.readable, response)

      // Keep cancellation alive for the body, not just the headers. The pipe preserves
      // backpressure and cancels its source when the downstream reader stops.
      void response.body.pipeTo(stream.writable, { signal }).then(cleanup, (error) => {
        controller.abort(error)
        cleanup()
      })

      return proxiedResponse
    } catch (error) {
      controller.abort(error)
      cleanup()
      throw error
    }
  }
}
