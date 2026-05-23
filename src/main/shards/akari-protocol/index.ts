import { Shard } from '@shared/akari-shard'
import { protocol } from 'electron'
import { Readable } from 'node:stream'

import {
  AKARI_PROTOCOL_MAIN_NAMESPACE,
  AKARI_PROXY_PROTOCOL,
  type AkariProtocolDomainHandler
} from './context'
import { createLocalFileDomainHandler } from './local-file-domain'
import { AkariProtocolRouter } from './protocol-router'

/**
 * 实现 `akari://` 协议, 用户特殊资源的代理
 * akari://local/* 代理到本地文件系统
 * akari://league-client/* 代理到 LeagueClient 的 HTTP 服务
 * akari://riot-client/* 代理到 RiotClient 的 HTTP 服务
 */
@Shard(AkariProtocolMain.id)
export class AkariProtocolMain {
  static id = AKARI_PROTOCOL_MAIN_NAMESPACE

  static AKARI_PROXY_PROTOCOL = AKARI_PROXY_PROTOCOL

  private readonly _router = new AkariProtocolRouter()

  onInit() {
    this.registerDomain('local', createLocalFileDomainHandler())
  }

  static convertWebStreamToNodeStream(readableStream: ReadableStream): Readable {
    const reader = readableStream.getReader()

    const nodeStream = Readable.from({
      async *[Symbol.asyncIterator]() {
        while (true) {
          try {
            const { done, value } = await reader.read()
            if (done) break
            yield value
          } catch {
            break
          }
        }
      }
    })

    return nodeStream
  }

  static convertNodeStreamToWebStream(nodeStream: Readable): ReadableStream {
    return new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk))
        nodeStream.on('end', () => controller.close())
        nodeStream.on('error', (err) => controller.error(err))
      },
      cancel(reason) {
        nodeStream.destroy(reason)
      }
    })
  }

  registerPartition(partition: string) {
    this._router.registerPartition(partition)
  }

  unregisterPartition(partition: string) {
    this._router.unregisterPartition(partition)
  }

  registerDomain(domain: string, handler: AkariProtocolDomainHandler) {
    this._router.registerDomain(domain, handler)
  }

  unregisterDomain(domain: string) {
    this._router.unregisterDomain(domain)
  }

  static shouldNotHaveBody(code: number) {
    return (code >= 100 && code < 200) || code === 204 || code === 205 || code === 304
  }

  static register() {
    protocol.registerSchemesAsPrivileged([
      {
        scheme: AkariProtocolMain.AKARI_PROXY_PROTOCOL,
        privileges: {
          standard: true,
          secure: true,
          supportFetchAPI: true,
          corsEnabled: true,
          stream: true,
          bypassCSP: true
        }
      }
    ])
  }
}
