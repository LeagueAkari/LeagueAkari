import type { LeagueClientRenderer } from '@renderer-shared/shards/league-client'

export const LEAGUE_CLIENT_PEEK_RENDERER_NAMESPACE = 'league-client-peek-renderer'

export interface LeagueClientPeekRendererContext {
  namespace: string
  leagueClient: LeagueClientRenderer
}
