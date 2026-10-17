import type { useExtraAssetsStore } from '../../extra-assets/store'
import type { LeagueClientRenderer } from '../../league-client'
import type { useLeagueClientStore } from '../../league-client/store'
import type { ChampionDataRendererContext } from '../context'
import type { useChampionDataStore } from '../store'

export interface OpggRendererContext extends ChampionDataRendererContext {
  state: ReturnType<typeof useChampionDataStore>['opgg']
  settings: ReturnType<typeof useChampionDataStore>['settings']
  leagueClient: ReturnType<typeof useLeagueClientStore>
  extraAssets: ReturnType<typeof useExtraAssetsStore>
  client: Pick<LeagueClientRenderer, 'api' | 'writeItemSetsToDisk'>
}

export interface OpggApplySelection {
  pageId: number
  kind: 'runes' | 'spells' | 'items'
  recommendationId: string
}
