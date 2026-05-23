import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import type { OpggAramBalanceItem } from '@shared/types/opgg'
import { useIntervalFn } from '@vueuse/core'
import { watch } from 'vue'

import { OPGG_RENDERER_NAMESPACE, type OpggRendererContext } from './context'
import { useOpggStore } from './store'

export class OpggWatchers {
  constructor(private readonly context: OpggRendererContext) {}

  start() {
    this._restoreItemSet()
    this._watchAramBalance()
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

  private _watchAramBalance() {
    this.context.setupInAppScope.addSetupFn(() => {
      const store = useOpggStore()

      useIntervalFn(
        async () => {
          try {
            const { data } = await this.context.api.getAramBalance()

            store.aramBalance = data.data.reduce(
              (acc, item) => {
                acc[item.champion_id] = item
                return acc
              },
              {} as Record<number, OpggAramBalanceItem>
            )

            this.context.logger.info(
              OPGG_RENDERER_NAMESPACE,
              'Updated ARAM balance',
              `${data.data.length} items`
            )
          } catch {}
        },
        30 * 60 * 1000,
        { immediateCallback: true, immediate: true }
      )
    })
  }
}
