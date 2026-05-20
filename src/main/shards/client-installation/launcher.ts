import cp from 'node:child_process'
import util from 'node:util'

import type { ClientInstallationMainContext } from './context'
import { shouldAllowWindowsOnlyLaunch } from './platform'

const execFileAsync = util.promisify(cp.execFile)

export class ClientInstallationLauncher {
  constructor(private readonly _context: ClientInstallationMainContext) {}

  launchTencentTcls() {
    if (!shouldAllowWindowsOnlyLaunch()) {
      this._context.logger.info('Skip TCLS launch on unsupported platform', {
        platform: process.platform
      })
      return
    }

    if (!this._context.state.tclsExecutablePath) {
      return
    }

    return this._spawnDetachedShell(this._context.state.tclsExecutablePath, 'TCLS client')
  }

  launchWeGameLeagueOfLegends() {
    if (!shouldAllowWindowsOnlyLaunch()) {
      this._context.logger.info('Skip WeGame League of Legends launch on unsupported platform', {
        platform: process.platform
      })
      return
    }

    if (!this._context.state.weGameLauncherExecutablePath) {
      return
    }

    return this._spawnDetachedShell(
      this._context.state.weGameLauncherExecutablePath,
      'WeGame (LoL) client'
    )
  }

  launchWeGame() {
    if (!shouldAllowWindowsOnlyLaunch()) {
      this._context.logger.info('Skip WeGame launch on unsupported platform', {
        platform: process.platform
      })
      return
    }

    if (!this._context.state.weGameExecutablePath) {
      return
    }

    return this._spawnDetachedShell(this._context.state.weGameExecutablePath, 'WeGame client')
  }

  async launchDefaultRiotClient() {
    const executablePath = this._context.state.officialRiotClientExecutablePath

    if (!executablePath) {
      return
    }

    const args = ['--launch-product=league_of_legends', '--launch-patchline=live']

    if (process.platform === 'win32') {
      return this._spawnDetachedShell(executablePath, 'Riot client', args)
    }

    if (process.platform === 'darwin' && executablePath.endsWith('.app')) {
      await execFileAsync('open', ['-a', executablePath, '--args', ...args])
      return
    }

    await execFileAsync(executablePath, args)
  }

  private _spawnDetachedShell(executablePath: string, label: string, args: string[] = []) {
    return new Promise<void>((resolve, reject) => {
      const child = cp.spawn(`"${executablePath}"`, args, {
        detached: true,
        stdio: 'ignore',
        shell: true
      })

      let hasError = false
      child.on('error', (error) => {
        hasError = true
        this._context.logger.warn(`Failed to launch ${label}`, executablePath, error)
        reject(error)
      })

      setImmediate(() => {
        if (hasError) {
          return
        }

        child.unref()
        resolve()
      })
    })
  }
}
