import type { LaunchSpectatorConfig } from '@shared/types/shards/game-client'
import cp from 'node:child_process'
import ofs from 'node:original-fs'
import path from 'node:path'

import { GAME_CLIENT_PROCESS_NAME, type GameClientMainContext } from './context'

export class SpectatorLauncher {
  constructor(private readonly context: GameClientMainContext) {}

  async launch(config: LaunchSpectatorConfig) {
    const {
      gameExecutablePath,
      gameInstallRoot,
      gameId,
      gameMode,
      locale,
      observerEncryptionKey,
      observerServerIp,
      observerServerPort,
      sgpServerId
    } = await this._completeCredential(config)

    const [region, rsoPlatformId] = sgpServerId.split('_')

    const cmds = [
      `spectator ${observerServerIp}:${observerServerPort} ${observerEncryptionKey} ${gameId} ${region}`,
      `-GameBaseDir=${gameInstallRoot}`,
      `-Locale=${locale || 'zh_CN'}`,
      `-GameID=${gameId}`,
      `-Region=${region}`,
      `-UseNewX3D=1`,
      '-PlayerNameMode=ALIAS',
      '-UseNewX3DFramebuffers=1'
    ]

    if (gameMode === 'TFT') {
      cmds.push('-Product=TFT')
    } else {
      cmds.push('-Product=LoL')
    }

    if (rsoPlatformId) {
      cmds.push(`-PlatformId=${rsoPlatformId}`)
    }

    return new Promise<void>((resolve, reject) => {
      const p = cp.spawn(gameExecutablePath, cmds, {
        cwd: gameInstallRoot,
        detached: true
      })

      let hasError = false
      p.on('error', (err) => {
        hasError = true
        reject(err)
      })

      setImmediate(() => {
        if (hasError) {
          return
        }

        p.unref()
        resolve()
      })
    })
  }

  /**
   * 连接情况下, 通过 LCU API 获取安装位置; 未连接时使用本地探测到的安装位置.
   */
  private async _completeCredential(config: LaunchSpectatorConfig) {
    const {
      sgpServerId,
      gameId,
      gameMode,
      locale = 'zh_CN',
      observerEncryptionKey,
      observerServerIp,
      observerServerPort
    } = config

    const { clientInstallation, leagueClient } = this.context

    if (leagueClient.state.connectionState === 'connected') {
      try {
        const { data: location } = await leagueClient.http.get<{
          gameExecutablePath: string
          gameInstallRoot: string
        }>('/lol-patch/v1/products/league_of_legends/install-location')

        return {
          sgpServerId,
          gameId,
          gameMode,
          locale,
          observerEncryptionKey,
          observerServerIp,
          observerServerPort,
          gameInstallRoot: location.gameInstallRoot,
          gameExecutablePath: location.gameExecutablePath
        }
      } catch {
        const err = new Error('Cannot get game installation path')
        err.name = 'CannotGetGameInstallationPath'
        throw err
      }
    } else {
      if (clientInstallation.state.tencentInstallationPath) {
        const gameExecutablePath = path.resolve(
          clientInstallation.state.tencentInstallationPath,
          'Game',
          GAME_CLIENT_PROCESS_NAME
        )

        const gameInstallRoot = path.resolve(
          clientInstallation.state.tencentInstallationPath,
          'Game'
        )

        return {
          sgpServerId,
          gameId,
          gameMode,
          locale,
          observerEncryptionKey,
          observerServerIp,
          observerServerPort,
          gameInstallRoot,
          gameExecutablePath
        }
      } else if (clientInstallation.state.leagueClientExecutablePaths.length) {
        const gameExecutablePath = path.resolve(
          clientInstallation.state.leagueClientExecutablePaths[0],
          '..',
          'Game',
          GAME_CLIENT_PROCESS_NAME
        )

        try {
          await ofs.promises.access(gameExecutablePath)
          const gameInstallRoot = path.resolve(gameExecutablePath, '..')

          return {
            sgpServerId,
            gameId,
            gameMode,
            locale,
            observerEncryptionKey,
            observerServerIp,
            observerServerPort,
            gameInstallRoot,
            gameExecutablePath
          }
        } catch {
          const err = new Error('Cannot get game installation path')
          err.name = 'CannotGetGameInstallationPath'
          throw err
        }
      } else {
        const err = new Error('Cannot get game installation path')
        err.name = 'CannotGetGameInstallationPath'
        throw err
      }
    }
  }
}
