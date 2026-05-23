import ofs from 'node:original-fs'
import path from 'node:path'

import type { GameClientMainContext, SettingsFileMode } from './context'

export class GameClientSettingsFileController {
  constructor(private readonly context: GameClientMainContext) {}

  async setMode(mode: SettingsFileMode = 'readonly') {
    const settingsPath = path.join(await this._getConfigPathByLcuApi(), 'PersistedSettings.json')
    this.context.logger.info(`Set file ${settingsPath} to ${mode}`)

    if (mode === 'readonly') {
      await ofs.promises.chmod(settingsPath, 0o444)
    } else {
      await ofs.promises.chmod(settingsPath, 0o644)
    }
  }

  async getMode() {
    const settingsPath = path.join(await this._getConfigPathByLcuApi(), 'PersistedSettings.json')
    const stats = await ofs.promises.stat(settingsPath)
    return stats.mode & 0o222 ? 'writable' : 'readonly'
  }

  private async _getConfigPathByLcuApi() {
    const { leagueClient } = this.context

    if (!leagueClient.state.auth) {
      throw new Error('LC Not connected')
    }

    const { data: gameInstallRoot } = await leagueClient.http.get<string>(
      '/data-store/v1/install-dir'
    )

    if (leagueClient.state.auth.region === 'TENCENT') {
      return path.resolve(gameInstallRoot, '..', 'Game', 'Config')
    } else {
      return path.resolve(gameInstallRoot, 'Config')
    }
  }
}
