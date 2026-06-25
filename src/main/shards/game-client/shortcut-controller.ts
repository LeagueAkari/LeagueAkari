import { type GameClientMainContext, TERMINATE_GAME_CLIENT_SHORTCUT_TARGET_ID } from './context'

export class GameClientShortcutController {
  constructor(private readonly context: GameClientMainContext) {}

  watch() {
    const { settings } = this.context

    if (settings.terminateShortcut) {
      this._registerTerminateShortcut(settings.terminateShortcut, 'initialize')
    }
  }

  applyTerminateShortcutSettingSideEffect(shortcut: string | null) {
    if (shortcut === null) {
      this.context.keyboardShortcuts.unregisterByTargetId(TERMINATE_GAME_CLIENT_SHORTCUT_TARGET_ID)
      return
    }

    try {
      this._registerTerminateShortcut(shortcut, 'setting-change')
    } catch {
      this.context.logger.warn('Failed to register shortcut', shortcut)
      throw new Error('Failed to register shortcut')
    }
  }

  private _registerTerminateShortcut(shortcut: string, stage: 'initialize' | 'setting-change') {
    try {
      this.context.keyboardShortcuts.register(
        TERMINATE_GAME_CLIENT_SHORTCUT_TARGET_ID,
        shortcut,
        'normal',
        () => {
          if (this.context.settings.terminateGameClientWithShortcut) {
            void this.context.gameClient.terminateGameClient()
          }
        }
      )
    } catch {
      if (stage === 'initialize') {
        this.context.logger.warn('Failed to initialize register shortcut', shortcut)
      } else {
        throw new Error('Failed to register shortcut')
      }
    }
  }
}
