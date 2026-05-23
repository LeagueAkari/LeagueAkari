import type { MobxUtilsMainContext } from './context'

export class MobxUtilsIpcHandlers {
  constructor(private readonly context: MobxUtilsMainContext) {}

  register() {
    const { ipc, mobxUtils, namespace } = this.context

    ipc.onCall(
      namespace,
      'subscribeAndGetInitialState',
      (event, stateNamespace: string, stateId: string) => {
        return mobxUtils.subscribeAndGetInitialState(event.sender, stateNamespace, stateId)
      }
    )
  }
}
