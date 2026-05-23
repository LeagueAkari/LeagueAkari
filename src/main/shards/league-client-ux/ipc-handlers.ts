import type { LeagueClientUxMainContext } from './context'
import type { LeagueClientUxMain } from './index'

export class LeagueClientUxIpcHandlers {
  constructor(
    private readonly context: LeagueClientUxMainContext,
    private readonly leagueClientUx: LeagueClientUxMain
  ) {}

  register() {
    const { ipc, namespace } = this.context

    ipc.onCall(namespace, 'update', () => this.leagueClientUx.update())
    ipc.onCall(namespace, 'rebuildWmi', () => this.leagueClientUx.rebuildWmi())
  }
}
