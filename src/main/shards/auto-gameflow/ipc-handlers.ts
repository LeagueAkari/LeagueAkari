import type { AutoGameflowActions } from './actions'
import type { AutoGameflowMainContext } from './context'
import type { AutoGameflowMatchmakingController } from './matchmaking-controller'

export class AutoGameflowIpcHandlers {
  constructor(
    private readonly _context: AutoGameflowMainContext,
    private readonly _actions: AutoGameflowActions,
    private readonly _matchmaking: AutoGameflowMatchmakingController
  ) {}

  register() {
    const { ipc, namespace, state } = this._context

    ipc.onCall(namespace, 'cancelAutoAccept', () => {
      this._actions.cancelAutoAccept('normal')
    })

    ipc.onCall(namespace, 'cancelAutoMatchmaking', () => {
      this._matchmaking.cancelAutoMatchmaking('normal')
    })

    ipc.onCall(namespace, 'setFriendsToBeInvited', (_, puuids: string[]) => {
      state.setFriendsToBeInvited(puuids)
    })
  }
}
