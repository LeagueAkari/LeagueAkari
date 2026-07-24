import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { watch } from 'vue'

import { SELF_HOSTED_LCU_DATA_RENDERER_NAMESPACE } from './context'
import { useSelfHostedLcuDataStore } from './store'

export function watchRecommendedChampionPositionsUpdate() {
  const store = useSelfHostedLcuDataStore()

  const leagueClient = useInstance(LeagueClientRenderer)
  const logger = useInstance(LoggerRenderer)

  const leagueClientStore = useLeagueClientStore()

  let requestGeneration = 0

  watch(
    () => leagueClientStore.isConnected,
    async (isConnected, _, onCleanup) => {
      const generation = ++requestGeneration

      if (!isConnected) {
        store.recommendedChampionPositions = null
        return
      }

      const abortController = new AbortController()
      onCleanup(() => abortController.abort())

      try {
        const { data } = await leagueClient.api.perks.getRecommendedChampionPositions({
          signal: abortController.signal
        })

        if (
          !abortController.signal.aborted &&
          generation === requestGeneration &&
          leagueClientStore.isConnected
        ) {
          store.recommendedChampionPositions = data
        }
      } catch (error) {
        if (abortController.signal.aborted || generation !== requestGeneration) {
          return
        }

        logger.error(
          SELF_HOSTED_LCU_DATA_RENDERER_NAMESPACE,
          'Failed to reload recommended champion positions',
          error
        )
      }
    },
    { immediate: true }
  )
}
