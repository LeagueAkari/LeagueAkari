import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { GameQueue } from '@shared/types/league-client/game-queues'
import { watch } from 'vue'

import { SELF_HOSTED_LCU_DATA_RENDERER_NAMESPACE } from './context'
import { useSelfHostedLcuDataStore } from './store'

export function watchQueuesUpdate() {
  const store = useSelfHostedLcuDataStore()

  const leagueClient = useInstance(LeagueClientRenderer)
  const logger = useInstance(LoggerRenderer)

  const leagueClientStore = useLeagueClientStore()

  leagueClient.onLcuEventVue<GameQueue[]>('/lol-game-queues/v1/queues', ({ eventType, data }) => {
    if (eventType === 'Delete') {
      store.gameQueues = {}
    }

    store.gameQueues = data.reduce((prev, cur) => {
      prev[cur.id] = cur
      return prev
    }, {})
  })

  const reloadQueues = async () => {
    try {
      const { data } = await leagueClient.api.gameQueues.getQueues()
      store.gameQueues = data.reduce((prev, cur) => {
        prev[cur.id] = cur
        return prev
      }, {})
    } catch (error) {
      logger.error(SELF_HOSTED_LCU_DATA_RENDERER_NAMESPACE, 'Failed to reload queues', error)
    }
  }

  watch(
    () => leagueClientStore.isConnected,
    (isConnected) => {
      if (isConnected) {
        reloadQueues()
      } else {
        store.gameQueues = {}
      }
    },
    { immediate: true }
  )
}
