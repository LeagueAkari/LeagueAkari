import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import type { KeyboardShortcutsDebugState, ShortcutDetails } from '@shared/shards/keyboard-shortcut'

import { AkariIpcRenderer } from '../ipc'
import {
  KEYBOARD_SHORTCUTS_MAIN_NAMESPACE,
  KEYBOARD_SHORTCUTS_RENDERER_NAMESPACE,
  type KeyboardShortcutsRendererContext
} from './context'
import { KeyboardShortcutEventService } from './shortcut-event-service'

/**
 * 连接到主进程的快捷键服务
 */
@Shard(KeyboardShortcutsRenderer.id)
export class KeyboardShortcutsRenderer implements IAkariShardInitDispose {
  static id = KEYBOARD_SHORTCUTS_RENDERER_NAMESPACE

  static DISABLED_KEYS_TARGET_ID = 'akari-disabled-keys'
  static DEBUG_STATEFUL_TEST_TARGET_ID = 'keyboard-shortcuts-main/debug-stateful-test'

  private readonly _context: KeyboardShortcutsRendererContext
  private readonly _eventService: KeyboardShortcutEventService

  constructor(@Dep(AkariIpcRenderer) ipc: AkariIpcRenderer) {
    this._context = { ipc }
    this._eventService = new KeyboardShortcutEventService(this._context)
  }

  onShortcut(fn: (event: ShortcutDetails) => void) {
    return this._eventService.onShortcut(fn)
  }

  onLastActiveShortcut(fn: (event: ShortcutDetails) => void) {
    return this._eventService.onLastActiveShortcut(fn)
  }

  getDebugState() {
    return this._context.ipc.call(
      KEYBOARD_SHORTCUTS_MAIN_NAMESPACE,
      'getDebugState'
    ) as Promise<KeyboardShortcutsDebugState>
  }

  setDebugStatefulShortcut(shortcutId: string | null) {
    return this._context.ipc.call(
      KEYBOARD_SHORTCUTS_MAIN_NAMESPACE,
      'setDebugStatefulShortcut',
      shortcutId
    ) as Promise<{
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
    return this._context.ipc.call(KEYBOARD_SHORTCUTS_MAIN_NAMESPACE, 'getRegistration', shortcutId)
  }

  async onInit() {}
}
