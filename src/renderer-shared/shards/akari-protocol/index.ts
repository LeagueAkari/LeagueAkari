import { AKARI_PROTOCOL_MAIN_NAMESPACE } from '@shared/akari-protocol/namespace'
import { Dep, Shard } from '@shared/akari-shard'
import type { AxiosInstance } from 'axios'

import { AkariIpcRenderer } from '../ipc'
import { installAkariProtocolProxyCancellation } from './proxy-cancellation'

export const AKARI_PROTOCOL_RENDERER_NAMESPACE = 'akari-protocol-renderer'

@Shard(AkariProtocolRenderer.id)
export class AkariProtocolRenderer {
  static id = AKARI_PROTOCOL_RENDERER_NAMESPACE

  constructor(@Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer) {}

  installProxyRequestCancellation(httpClient: AxiosInstance) {
    installAkariProtocolProxyCancellation(httpClient, {
      cancelProxyRequest: (requestId) => this.cancelProxyRequest(requestId)
    })
  }

  cancelProxyRequest(requestId: string) {
    return this._ipc.call<boolean>(AKARI_PROTOCOL_MAIN_NAMESPACE, 'cancelProxyRequest', requestId)
  }
}
