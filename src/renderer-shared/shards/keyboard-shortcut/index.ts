import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type {
  KeyboardShortcutsDebugState,
  ShortcutDetails
} from '@shared/types/shards/keyboard-shortcut'

import { AkariIpcRenderer } from '../ipc'

const MAIN_SHARD_NAMESPACE = 'keyboard-shortcuts-main'

/**
 * 连接到主进程的快捷键服务
 */
@Shard(KeyboardShortcutsRenderer.id)
export class KeyboardShortcutsRenderer implements IAkariShardInitDispose {
  static id = 'keyboard-shortcuts-renderer'

  static DISABLED_KEYS_TARGET_ID = 'akari-disabled-keys'
  static DEBUG_STATEFUL_TEST_TARGET_ID = 'keyboard-shortcuts-main/debug-stateful-test'

  constructor(@Dep(AkariIpcRenderer) private readonly _ipc: AkariIpcRenderer) {}

  onShortcut(fn: (event: ShortcutDetails) => void) {
    return this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'shortcut', fn)
  }

  onLastActiveShortcut(fn: (event: ShortcutDetails) => void) {
    return this._ipc.onEventVue(MAIN_SHARD_NAMESPACE, 'last-active-shortcut', fn)
  }

  getDebugState() {
    return this._ipc.call(
      MAIN_SHARD_NAMESPACE,
      'getDebugState'
    ) as Promise<KeyboardShortcutsDebugState>
  }

  setDebugStatefulShortcut(shortcutId: string | null) {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'setDebugStatefulShortcut', shortcutId) as Promise<{
      type: 'stateful'
      targetId: string
      shortcutId: string
    } | null>
  }

  getRegistration(shortcutId: string): Promise<{
    type: 'last-active' | 'normal' | 'stateful'
    targetId: string
    shortcutId: string
  } | null> {
    return this._ipc.call(MAIN_SHARD_NAMESPACE, 'getRegistration', shortcutId)
  }

  async onInit() {}
}
