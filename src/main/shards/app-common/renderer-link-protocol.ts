import { is } from '@electron-toolkit/utils'
import { app } from 'electron'

import type { AppCommonMainContext } from './context'

export class RendererLinkProtocol {
  constructor(private readonly context: AppCommonMainContext) {}

  register() {
    const { ipc, namespace, protocol } = this.context

    protocol.registerDomain('renderer-link', (_uri: string, req: Request) => {
      ipc.sendEvent(namespace, 'renderer-link', req.url)

      const u = new URL(req.url)

      if (u.pathname === '/evaluate') {
        const target = u.searchParams.get('target')
        const code = u.searchParams.get('code')

        if (target && code) {
          this.evaluate(target, code)
        }
      }

      return new Response(null, { status: 204 })
    })
  }

  /**
   * execute code in certain renderer window
   * very dangerous, should be used only in some extreme cases. e.g opt-in bugfixes
   * @param target certain renderer window
   * @param code pure js code
   * @returns
   */
  evaluate(target: string, code: string) {
    if (target === 'main') {
      this._evaluateMainProcess(code)
      return
    }

    const windowManager = this.context.shared.manager.getInstance('window-manager-main')

    if (!windowManager) {
      return
    }

    switch (target) {
      case 'main-window':
        windowManager.mainWindow.window?.webContents.executeJavaScript(code)
        break

      case 'aux-window':
        windowManager.auxWindow.window?.webContents.executeJavaScript(code)
        break

      case 'cd-timer-window':
        windowManager.cdTimerWindow.window?.webContents.executeJavaScript(code)
        break

      case 'ongoing-game-window':
        windowManager.ongoingGameWindow.window?.webContents.executeJavaScript(code)
        break

      case 'opgg-window':
        windowManager.opggWindow.window?.webContents.executeJavaScript(code)
        break
    }
  }

  private _evaluateMainProcess(code: string) {
    const { logger, shared } = this.context

    if (!is.dev) {
      logger.warn('Blocked main-process evaluate outside dev mode')
      return
    }

    logger.warn('Evaluating code in main process')

    try {
      const fn = new Function(
        'app',
        'manager',
        'shared',
        'logger',
        'process',
        `"use strict";\nreturn (async () => {\n${code}\n})()`
      )
      const result = fn(app, shared.manager, shared, logger, process)

      if (result instanceof Promise) {
        void result.catch((error) => {
          logger.error('Main-process evaluate failed', error)
        })
      }
    } catch (error) {
      logger.error('Main-process evaluate failed', error)
    }
  }
}
