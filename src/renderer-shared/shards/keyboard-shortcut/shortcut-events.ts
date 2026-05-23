import type { ShortcutDetails } from '@shared/types/shards/keyboard-shortcut'

import { KEYBOARD_SHORTCUTS_MAIN_NAMESPACE, type KeyboardShortcutsRendererContext } from './context'

export class KeyboardShortcutEvents {
  constructor(private readonly _context: KeyboardShortcutsRendererContext) {}

  onShortcut(fn: (event: ShortcutDetails) => void) {
    return this._context.ipc.onEventVue(KEYBOARD_SHORTCUTS_MAIN_NAMESPACE, 'shortcut', fn)
  }

  onLastActiveShortcut(fn: (event: ShortcutDetails) => void) {
    return this._context.ipc.onEventVue(
      KEYBOARD_SHORTCUTS_MAIN_NAMESPACE,
      'last-active-shortcut',
      fn
    )
  }
}
