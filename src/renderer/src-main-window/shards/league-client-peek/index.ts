import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { useIntervalFn } from '@vueuse/core'
import { computed, watch } from 'vue'

import { useLeagueClientPeekStore } from './store'

@Shard(LeagueClientPeekRenderer.id)
export class LeagueClientPeekRenderer implements IAkariShardInitDispose {
  static id = 'league-client-peek-renderer'

  constructor(
    @Dep(LeagueClientRenderer) private readonly _leagueClient: LeagueClientRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer
  ) {}

  async onInit() {
    this._setupInAppScope.addSetupFn(() => {
      this._setupPeekTasks()
    })
  }

  async onDispose() {}

  private _setupPeekTasks() {
    const leagueClientStore = useLeagueClientStore()
    const leagueClientUxStore = useLeagueClientUxStore()
    const leagueClientPeekStore = useLeagueClientPeekStore()

    const otherClients = computed(() => {
      return leagueClientUxStore.launchedClients.filter(
        (c) => c.pid !== leagueClientStore.auth?.pid
      )
    })

    const updateConnectableClientExtraInfo = async () => {
      const info = leagueClientPeekStore.connectableClientExtraInfo

      for (const pid of Object.keys(info)) {
        if (!otherClients.value.find((cmd) => cmd?.pid.toString() === pid)) {
          delete info[pid]
        }
      }

      await Promise.all(
        otherClients.value.map(async (cmd) => {
          const prev = info[cmd.pid]
          const data = await this._leagueClient.peekClient(cmd)

          if (prev) {
            if (!data) {
              delete info[cmd.pid]
              return
            }

            if (Date.now() - prev.lastUpdate > 2 * 60 * 1000) {
              info[cmd.pid] = { ...data, lastUpdate: Date.now() }
            }
          } else {
            if (data) {
              info[cmd.pid] = { ...data, lastUpdate: Date.now() }
            }
          }
        })
      )
    }

    const { resume } = useIntervalFn(updateConnectableClientExtraInfo, 10 * 1000, {
      immediate: false,
      immediateCallback: true
    })

    watch(
      () => otherClients.value,
      () => {
        resume()
      },
      { immediate: true }
    )
  }
}
