import type { GameClientMainContext, SettingsFileMode } from './context'
import type { GameClientMain } from './index'

export class GameClientIpcHandlers {
  constructor(
    private readonly context: GameClientMainContext,
    private readonly gameClient: GameClientMain
  ) {}

  register() {
    const { ipc, namespace } = this.context

    ipc.onCall(namespace, 'terminateGameClient', () => {
      return this.gameClient.terminateGameClient()
    })

    ipc.onCall(
      namespace,
      'setSettingsFileReadonlyOrWritable',
      async (_, mode: SettingsFileMode) => {
        await this.gameClient.setSettingsFileReadonlyOrWritable(mode)
      }
    )

    ipc.onCall(namespace, 'getSettingsFileReadonlyOrWritable', async () => {
      return this.gameClient.getSettingsFileReadonlyOrWritable()
    })
  }
}
