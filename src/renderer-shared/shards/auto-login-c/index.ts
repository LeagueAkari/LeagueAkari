import { Dep, Shard } from '@shared/akari-shard'
import { AkariIpcRenderer } from '../ipc'

const MAIN_SHARD_NAMESPACE = 'auto-login-c-main'

@Shard(AutoLoginCRenderer.id)
export class AutoLoginCRenderer {
  static id = 'auto-login-c-renderer'

  constructor(@Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer) {}

  autoLogin(accountId: string): Promise<void> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'autoLogin', accountId)
  }

  getGamePath(): Promise<string> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getGamePath')
  }

  setGamePath(path: string): Promise<void> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setGamePath', path)
  }

  detectGamePath(): Promise<string | null> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'detectGamePath')
  }

  getToolPath(): Promise<string> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getToolPath')
  }

  setToolPath(path: string): Promise<void> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setToolPath', path)
  }

  detectToolPath(): Promise<string | null> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'detectToolPath')
  }

  onStatus(fn: (s: { state: string; message: string; at: number }) => void) {
    return this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'status', fn)
  }
}
