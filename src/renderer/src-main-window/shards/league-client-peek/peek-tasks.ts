import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useIntervalFn } from '@vueuse/core'
import { computed, watch } from 'vue'

import type { LeagueClientPeekRendererContext } from './context'
import { useLeagueClientPeekStore } from './store'

export function setupLeagueClientPeekTasks(context: LeagueClientPeekRendererContext) {
  const leagueClientStore = useLeagueClientStore()
  const leagueClientUxStore = useLeagueClientUxStore()
  const leagueClientPeekStore = useLeagueClientPeekStore()

  const otherClients = computed(() => {
    return leagueClientUxStore.launchedClients.filter((c) => c.pid !== leagueClientStore.auth?.pid)
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
        const data = await context.leagueClient.peekClient(cmd)

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
