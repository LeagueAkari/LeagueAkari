import type { AutoGameflowActionController } from './action-controller'
import type { AutoGameflowMainContext } from './context'
import type { AutoGameflowMatchmakingController } from './matchmaking-controller'

export class AutoGameflowIpcHandlers {
  constructor(
    private readonly _context: AutoGameflowMainContext,
    private readonly _actionController: AutoGameflowActionController,
    private readonly _matchmaking: AutoGameflowMatchmakingController
  ) {}

  register() {
    const { ipc, namespace, state } = this._context

    ipc.onCall(namespace, 'cancelAutoAccept', () => {
      this._actionController.cancelAutoAccept('normal')
    })

    ipc.onCall(namespace, 'cancelAutoMatchmaking', () => {
      this._matchmaking.cancelAutoMatchmaking('normal')
    })

    ipc.onCall(namespace, 'setFriendsToBeInvited', (_, puuids: string[]) => {
      state.setFriendsToBeInvited(puuids)
    })
  }
}
