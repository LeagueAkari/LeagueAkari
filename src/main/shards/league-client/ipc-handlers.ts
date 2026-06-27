import type { UxCommandLine } from '@shared/shards/league-client-ux'
import type { AxiosRequestConfig } from 'axios'

import type { LeagueClientMainContext } from './context'

export class LeagueClientIpcHandlers {
  constructor(private readonly context: LeagueClientMainContext) {}

  register() {
    const { ipc, leagueClient, namespace } = this.context

    ipc.onCall(namespace, 'http-request', async (_, config: AxiosRequestConfig) => {
      return leagueClient.requestForRenderer(config)
    })

    ipc.onCall(namespace, 'connect', async (_, auth: UxCommandLine & { force?: boolean }) => {
      return leagueClient.connect(auth)
    })

    ipc.onCall(namespace, 'disconnect', async () => {
      return leagueClient.disconnect()
    })

    ipc.onCall(
      namespace,
      'writeItemSetsToDisk',
      async (_, itemSets: any[] | null, clearPrevious: boolean) => {
        await leagueClient.writeItemSetsToDisk(itemSets, clearPrevious)
      }
    )

    ipc.onCall(namespace, 'fixWindowMethodA', async (_, config) => {
      await leagueClient.fixWindowMethodA(config)
    })

    ipc.onCall(namespace, 'subscribeLcuEndpoint', async (_, uri: string) => {
      return leagueClient.subscribeLcuEndpoint(uri)
    })

    ipc.onCall(namespace, 'unsubscribeLcuEndpoint', async (_, subId: string) => {
      return leagueClient.unsubscribeLcuEndpoint(subId)
    })

    ipc.onCall(namespace, 'peekClient', async (_, auth: UxCommandLine) => {
      return leagueClient.peekClient(auth)
    })
  }
}
