import cp from 'node:child_process'
import fs from 'node:fs'

import type { ClientInstallationMainContext } from './context'
import { shouldAllowDefaultRiotClientLaunch, shouldAllowWindowsOnlyLaunch } from './platform'

export interface MacClientLaunchCommand {
  args: string[]
  executablePath: string
}

export function buildMacClientLaunchCommand(
  launchPath: string,
  args: readonly string[]
): MacClientLaunchCommand {
  if (launchPath.toLowerCase().endsWith('.app')) {
    return {
      executablePath: 'open',
      args: ['-a', launchPath, '--args', ...args]
    }
  }

  return { executablePath: launchPath, args: [...args] }
}

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
    if (!shouldAllowDefaultRiotClientLaunch()) {
      this._context.logger.info('Skip Riot Client launch on unsupported platform', {
        platform: process.platform
      })
      return
    }

    const executablePath = this._context.state.officialRiotClientExecutablePath

    if (!executablePath) {
      return
    }

    const args = ['--launch-product=league_of_legends', '--launch-patchline=live']

    if (process.platform === 'win32') {
      return this._spawnDetachedShell(executablePath, 'Riot client', args)
    }

    await fs.promises.access(executablePath)
    const command = buildMacClientLaunchCommand(executablePath, args)

    return this._spawnDetached(command.executablePath, command.args, 'Riot client')
  }

  private _spawnDetached(executablePath: string, args: string[], label: string) {
    return new Promise<void>((resolve, reject) => {
      const child = cp.spawn(executablePath, args, {
        detached: true,
        stdio: 'ignore',
        shell: false
      })

      child.once('error', (error) => {
        this._context.logger.warn(`Failed to launch ${label}`, executablePath, error)
        reject(error)
      })
      child.once('spawn', () => {
        child.unref()
        resolve()
      })
    })
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
