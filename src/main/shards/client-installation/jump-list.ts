import { i18next } from '@main/i18n'
import { DEEP_LINK_PROTOCOL } from '@main/utils/deep-link'
import { JumpListItem, app } from 'electron'
import { comparer } from 'mobx'

import { CLIENT_INSTALLATION_MAIN_NAMESPACE, type ClientInstallationMainContext } from './context'
import type { ClientInstallationLauncher } from './launcher'
import { shouldRegisterJumpList } from './platform'

export class ClientInstallationJumpList {
  private _startupLaunch = false

  constructor(
    private readonly _context: ClientInstallationMainContext,
    private readonly _launcher: ClientInstallationLauncher
  ) {}

  register() {
    if (!shouldRegisterJumpList()) {
      this._context.logger.info('Skip client installation Jump List on unsupported platform', {
        platform: process.platform
      })
      return
    }

    this._context.mobxUtils.reaction(
      () => [
        this._context.appCommon.settings.locale,
        this._context.state.tclsExecutablePath,
        this._context.state.weGameLauncherExecutablePath,
        this._context.state.officialRiotClientExecutablePath
      ],
      () => {
        this._buildJumpList()

        if (this._context.shared.global.startupDeepLink && !this._startupLaunch) {
          this._handleDeepLink(this._context.shared.global.startupDeepLink, false)
        }
      },
      { fireImmediately: true, equals: comparer.shallow, delay: 500 }
    )

    this._context.shared.global.events.on('second-instance-deep-link', (url) => {
      this._handleDeepLink(url, true)
    })
  }

  private _buildJumpList() {
    if (!shouldRegisterJumpList()) {
      return
    }

    if (typeof (app as any).setJumpList !== 'function') {
      return
    }

    const jumpListItems: JumpListItem[] = []
    const t = i18next.getFixedT(null, 'main', 'client-installation-main.jumpList')

    if (this._context.state.tclsExecutablePath) {
      jumpListItems.push({
        type: 'task',
        title: t('launchTcls.title'),
        program: 'explorer.exe',
        args: `${DEEP_LINK_PROTOCOL}://shards/${CLIENT_INSTALLATION_MAIN_NAMESPACE}/launch-tcls-client`,
        iconPath: process.execPath,
        iconIndex: 0,
        description: t('launchTcls.description')
      })
    }

    if (this._context.state.weGameLauncherExecutablePath) {
      jumpListItems.push({
        type: 'task',
        title: t('launchWeGame.title'),
        program: 'explorer.exe',
        args: `${DEEP_LINK_PROTOCOL}://shards/${CLIENT_INSTALLATION_MAIN_NAMESPACE}/launch-we-game-lol`,
        iconPath: process.execPath,
        iconIndex: 0,
        description: t('launchWeGame.description')
      })
    }

    if (this._context.state.officialRiotClientExecutablePath) {
      jumpListItems.push({
        type: 'task',
        title: t('launchRiot.title'),
        program: 'explorer.exe',
        args: `"${DEEP_LINK_PROTOCOL}://shards/${CLIENT_INSTALLATION_MAIN_NAMESPACE}/launch-riot-client-lol"`,
        iconPath: process.execPath,
        iconIndex: 0,
        description: t('launchRiot.description')
      })
    }

    if (jumpListItems.length) {
      app.setJumpList([
        {
          type: 'tasks',
          items: jumpListItems
        }
      ])
    } else {
      app.setJumpList(null)
    }
  }

  private _handleDeepLink(url: string, triggedBySecondInstance = false) {
    const parsed = new URL(url, `${DEEP_LINK_PROTOCOL}://shards`)

    switch (parsed.pathname) {
      case `/${CLIENT_INSTALLATION_MAIN_NAMESPACE}/launch-tcls-client`:
        if (!this._context.state.tclsExecutablePath) {
          return
        }

        this._launcher.launchTencentTcls()
        break
      case `/${CLIENT_INSTALLATION_MAIN_NAMESPACE}/launch-riot-client-lol`:
        if (!this._context.state.officialRiotClientExecutablePath) {
          return
        }

        this._launcher.launchDefaultRiotClient()
        break
      case `/${CLIENT_INSTALLATION_MAIN_NAMESPACE}/launch-we-game-lol`:
        if (!this._context.state.weGameLauncherExecutablePath) {
          return
        }

        this._launcher.launchWeGameLeagueOfLegends()
        break
      default:
        this._context.logger.warn('Unknown deep link', parsed.pathname)
        return
    }

    if (!triggedBySecondInstance) {
      this._startupLaunch = true
    }
  }
}
