import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { watch } from 'vue'

import type { OpggRendererContext } from './context'

export class OpggWatcher {
  constructor(private readonly context: OpggRendererContext) {}

  start() {
    this._restoreItemSet()
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
}
