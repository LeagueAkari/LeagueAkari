import { IN_GAME_SEND_MAIN_NAMESPACE, type InGameSendMainContext } from './context'

/**
 * 暴露给渲染进程的 IPC 调用，主要用于反向写入预设玩家选定状态。
 *
 * 读取走 propSync（ratingPuuids / junglePuuids / premadeIndices 直接在
 * renderer 的 store 上同步），渲染端不需要 IPC 读。
 */
export class InGameSendIpcHandlers {
  constructor(private readonly _context: InGameSendMainContext) {}

  register() {
    const { ipc, state } = this._context

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'setRatingPuuids',
      (_, puuids: string[]) => {
        state.setRatingPuuids(puuids)
      }
    )

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'setJunglePuuids',
      (_, puuids: string[]) => {
        state.setJunglePuuids(puuids)
      }
    )

    ipc.onCall(
      IN_GAME_SEND_MAIN_NAMESPACE,
      'setPremadeIndices',
      (_, indices: number[]) => {
        state.setPremadeIndices(indices)
      }
    )

    ipc.onCall(IN_GAME_SEND_MAIN_NAMESPACE, 'clearPresetSelections', () => {
      state.clearPresetSelections()
    })
  }
}