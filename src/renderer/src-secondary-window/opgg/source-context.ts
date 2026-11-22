import { useExtraAssetsStore } from '@renderer-shared/shards/extra-assets/store'
import type { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import type { ChampionDataRendererContext } from '@secondary-window/shards/champion-data/context'
import type { LoadoutExecutor } from '@secondary-window/shards/champion-data/loadout-executor'
import { OpggChampionDataController } from '@secondary-window/shards/champion-data/opgg/data-controller'
import { OpggChampionDataLoader } from '@secondary-window/shards/champion-data/opgg/data-loader'
import { useChampionDataStore } from '@secondary-window/shards/champion-data/store'
import type { OpggHttpApiAxiosHelper } from '@shared/http-api-axios-helper/opgg'
import { createOpggSnapshot } from '@shared/shards/champion-data'
import { shallowReactive } from 'vue'

export type OpggSourceState = ReturnType<typeof createOpggSourceState>

export function createOpggSourceState() {
  return shallowReactive({ snapshot: createOpggSnapshot() })
}

export function createOpggSource(
  context: ChampionDataRendererContext,
  api: OpggHttpApiAxiosHelper,
  commands: LoadoutExecutor,
  client: LeagueClientRenderer
) {
  const store = useChampionDataStore()
  const state = createOpggSourceState()

  const controller = new OpggChampionDataController(
    {
      ...context,
      state,
      settings: store.settings,
      leagueClient: useLeagueClientStore(),
      extraAssets: useExtraAssetsStore(),
      client,

      get canRequest() {
        return store.sourceStates.opgg.canRequest
      }
    },
    new OpggChampionDataLoader(api),
    commands
  )

  controller.setup()

  return { state, controller }
}
