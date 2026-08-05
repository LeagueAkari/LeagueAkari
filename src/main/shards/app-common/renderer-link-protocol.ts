import { is } from '@electron-toolkit/utils'
import { type WebContents, app } from 'electron'

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
        this._evaluateRendererProcess(target, windowManager.mainWindow.window?.webContents, code)
        break

      case 'aux-window':
        this._evaluateRendererProcess(target, windowManager.auxWindow.window?.webContents, code)
        break

      case 'cd-timer-window':
        this._evaluateRendererProcess(target, windowManager.cdTimerWindow.window?.webContents, code)
        break

      case 'ongoing-game-window':
        this._evaluateRendererProcess(
          target,
          windowManager.ongoingGameWindow.window?.webContents,
          code
        )
        break

      case 'opgg-window':
        this._evaluateRendererProcess(target, windowManager.opggWindow.window?.webContents, code)
        break
    }
  }

  private _evaluateRendererProcess(
    target: string,
    webContents: WebContents | undefined,
    code: string
  ) {
    if (!webContents) {
      return
    }

    // Electron clones the script completion value back to the main process.
    const codeWithIgnoredResult = `${code}\n;void 0`

    void webContents.executeJavaScript(codeWithIgnoredResult).catch((error) => {
      this.context.logger.warn('Renderer-link evaluation failed', target, error)
    })
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
