import type { useExtraAssetsStore } from '@renderer-shared/shards/extra-assets/store'
import type { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import type { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'

import type { ChampionDataRendererContext } from '../context'
import type { LoadoutKind, useChampionDataStore } from '../store'

export interface OpggRendererContext extends ChampionDataRendererContext {
  state: ReturnType<typeof useChampionDataStore>['opgg']
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
