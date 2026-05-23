import type { KeyboardShortcutsMainContext } from './context'
import type { KeyboardShortcutsMain } from './index'

export class KeyboardShortcutsIpcHandlers {
  constructor(
    private readonly context: KeyboardShortcutsMainContext,
    private readonly keyboardShortcuts: KeyboardShortcutsMain
  ) {}

  register() {
    const { ipc, namespace } = this.context

    ipc.onCall(namespace, 'getRegistration', (_, shortcutId: string) => {
      const registration = this.keyboardShortcuts.getRegistration(shortcutId)
      if (!registration) return null
      const { cb, ...rest } = registration
      return rest
    })

    ipc.onCall(namespace, 'getDebugState', () => {
      return this.keyboardShortcuts.getDebugState()
    })

    ipc.onCall(namespace, 'setDebugStatefulShortcut', (_, shortcutId: string | null) => {
      return this.keyboardShortcuts.setDebugStatefulShortcut(shortcutId)
    })

    ipc.onCall(namespace, 'getRegistrationByTargetId', (_, targetId: string) => {
      const registration = this.keyboardShortcuts.getRegistrationByTargetId(targetId)
      if (!registration) return null
      const { cb, ...rest } = registration
      return rest
    })

    ipc.onCall(namespace, '_getInternalVars', () => {
      return this.keyboardShortcuts._getInternalVars()
    })
  }
}
