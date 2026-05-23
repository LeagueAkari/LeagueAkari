import type { RendererDebugMainContext } from './context'

export class RendererDebugIpcHandlers {
  constructor(private readonly context: RendererDebugMainContext) {}

  register() {
    const { ipc, namespace, state } = this.context

    ipc.onCall(namespace, 'setSendAllNativeLcuEvents', (_, enabled: boolean) => {
      state.setSendAllNativeLcuEvents(enabled)
    })

    ipc.onCall(namespace, 'setLogAllLcuEvents', (_, enabled: boolean) => {
      state.setLogAllLcuEvents(enabled)
    })
  }
}
