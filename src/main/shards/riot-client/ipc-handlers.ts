import type { AxiosRequestConfig } from 'axios'

import { assertLocalClientRequestUrl } from '../../utils/local-client-url'
import type { RiotClientMainContext } from './context'

export class RiotClientIpcHandlers {
  constructor(private readonly context: RiotClientMainContext) {}

  register() {
    const { ipc, namespace, riotClient } = this.context

    ipc.onCall(namespace, 'http-request', async (_, config: AxiosRequestConfig) => {
      assertLocalClientRequestUrl(config.url)
      return riotClient.requestForRenderer(config)
    })
  }
}
