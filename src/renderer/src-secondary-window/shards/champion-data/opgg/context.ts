import type { useExtraAssetsStore } from '@renderer-shared/shards/extra-assets/store'
import type { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import type { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import type { OpggSourceState } from '@secondary-window/opgg/source-context'

import type { ChampionDataRendererContext } from '../context'
import type { LoadoutKind, useChampionDataStore } from '../store'

export interface OpggRendererContext extends ChampionDataRendererContext {
  readonly canRequest: boolean
  state: OpggSourceState
  settings: ReturnType<typeof useChampionDataStore>['settings']
  leagueClient: ReturnType<typeof useLeagueClientStore>
  extraAssets: ReturnType<typeof useExtraAssetsStore>
  client: Pick<LeagueClientRenderer, 'writeItemSetsToDisk'> & {
    api: Pick<LeagueClientRenderer['api'], 'chat'>
  }
}

export interface OpggApplySelection {
  pageId: number
  kind: LoadoutKind
  recommendationId: string
}
