import { type GameClientMainContext, TERMINATE_GAME_CLIENT_SHORTCUT_TARGET_ID } from './context'

export class GameClientShortcutController {
  constructor(private readonly context: GameClientMainContext) {}

  watch() {
    const { settings } = this.context

    if (settings.terminateShortcut) {
      this._registerTerminateShortcut(settings.terminateShortcut, 'initialize')
    }

    this.context.settingService.onChange('terminateShortcut', async (value, { setter }) => {
      if (value === null) {
        this.context.keyboardShortcuts.unregisterByTargetId(
          TERMINATE_GAME_CLIENT_SHORTCUT_TARGET_ID
        )
      } else {
        try {
          this._registerTerminateShortcut(value, 'setting-change')
        } catch {
          this.context.logger.warn('Failed to register shortcut', value)
          await setter(null)
        }
      }

      await setter()
    })
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
