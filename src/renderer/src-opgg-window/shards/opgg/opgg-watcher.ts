import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { watch } from 'vue'

import type { OpggRendererContext } from './context'

export class OpggWatcher {
  constructor(private readonly context: OpggRendererContext) {}

  start() {
    this._restoreItemSet()
    this._registerHttpProxy()
  }

  private _restoreItemSet() {
    const leagueClientStore = useLeagueClientStore()

    watch(
      () => leagueClientStore.gameflow.phase === 'EndOfGame',
      (isEndOfGame) => {
        if (isEndOfGame) {
          this.context.leagueClient.writeItemSetsToDisk(null)
        }
      }
    )
  }

  private _registerHttpProxy() {
    const appCommonStore = useAppCommonStore()

    watch(
      () => appCommonStore.settings.httpProxy,
      (httpProxy) => {
        if (httpProxy.strategy === 'force') {
          this.context.httpClient.defaults.proxy = {
            host: httpProxy.host,
            port: httpProxy.port
          }
        } else if (httpProxy.strategy === 'disable') {
          this.context.httpClient.defaults.proxy = false
        }
      },
      { immediate: true }
    )
  }
}
