import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'

import {
  LEAGUE_CLIENT_PEEK_RENDERER_NAMESPACE,
  type LeagueClientPeekRendererContext
} from './context'
import { setupLeagueClientPeekTaskController } from './peek-task-controller'

@Shard(LeagueClientPeekRenderer.id)
export class LeagueClientPeekRenderer implements IAkariShardInitDispose {
  static id = LEAGUE_CLIENT_PEEK_RENDERER_NAMESPACE

  private readonly _context: LeagueClientPeekRendererContext

  constructor(
    @Dep(LeagueClientRenderer) private readonly _leagueClient: LeagueClientRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer
  ) {
    this._context = {
      namespace: LeagueClientPeekRenderer.id,
      leagueClient: this._leagueClient
    }
  }

  async onInit() {
    this._setupInAppScope.addSetupFn(() => {
      setupLeagueClientPeekTaskController(this._context)
    })
  }

  async onDispose() {}
}
