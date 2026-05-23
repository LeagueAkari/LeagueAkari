import { session } from 'electron'

import { AKARI_PROXY_PROTOCOL, type AkariProtocolDomainHandler } from './context'

export class AkariProtocolRouter {
  private readonly _domainRegistry = new Map<string, AkariProtocolDomainHandler>()
  private readonly _partitionRegistry = new Set<string>()

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
        return handler(uri, req)
      }

      return new Response(`No handler for ${req.url}`, {
        statusText: 'Not Found',
        headers: { 'Content-Type': 'text/plain' },
        status: 404
      })
    })
  }
}
