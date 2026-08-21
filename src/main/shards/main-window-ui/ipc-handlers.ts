import { dialog } from 'electron'

import { AkariIpcError } from '../ipc'
import type { MainWindowUiMainContext } from './context'

export class MainWindowUiMainIpcHandlers {
  constructor(private readonly _context: MainWindowUiMainContext) {}

  register() {
    this._context.ipc.onCall(
      this._context.namespace,
      'selectBackgroundFile',
      async (_, defaultPath?: string) => {
        const result = await dialog.showOpenDialog(this._getMainWindow(), {
          defaultPath: defaultPath || undefined,
          properties: ['openFile'],
          filters: [
            {
              name: 'Wallpapers',
              extensions: [
                'png',
                'jpg',
                'jpeg',
                'webp',
                'bmp',
                'gif',
                'avif',
                'mp4',
                'webm',
                'mov',
                'm4v',
                'ogv'
              ]
            }
          ]
        })

        if (result.canceled) {
          return null
        }

        return result.filePaths[0] ?? null
      }
    )
  }

  private _getMainWindow() {
    const window = this._context.windowManager.mainWindow.window

    if (!window) {
      throw new AkariIpcError('Main window not found', 'MainWindowNotFound')
    }

    return window
  }
}
