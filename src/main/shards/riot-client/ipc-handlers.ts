import type { AxiosRequestConfig } from 'axios'

import type { RiotClientMainContext } from './context'

export class RiotClientIpcHandlers {
  constructor(private readonly context: RiotClientMainContext) {}

  register() {
    const { ipc, namespace, riotClient } = this.context

    ipc.onCall(namespace, 'http-request', async (_, config: AxiosRequestConfig) => {
      return riotClient.requestForRenderer(config)
    })
  }
}
