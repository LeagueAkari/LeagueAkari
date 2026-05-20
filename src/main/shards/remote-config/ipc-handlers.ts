import type { RemoteConfigMainContext } from './context'
import type { RemoteConfigDiagnostics } from './diagnostics'

export class RemoteConfigIpcHandlers {
  constructor(
    private readonly _context: RemoteConfigMainContext,
    private readonly _diagnostics: RemoteConfigDiagnostics
  ) {}

  register() {
    const { ipc, namespace } = this._context

    ipc.onCall(namespace, 'testRepoLatency', () => {
      return this._diagnostics.testRepoLatency()
    })
  }
}
