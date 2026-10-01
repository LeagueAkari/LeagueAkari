import { NATIVE_SUPPORT, adjustLeagueClientWindowSize } from '@main/native'
import { UxCommandLine } from '@shared/shards/league-client-ux'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import axios from 'axios'
import fs from 'node:fs'
import https from 'node:https'
import path from 'node:path'

import {
  LEAGUE_CLIENT_ITEM_SET_PREFIX,
  LEAGUE_CLIENT_REQUEST_TIMEOUT_MS,
  type LeagueClientMainContext
} from './context'

export class LeagueClientOperationsExecutor {
  constructor(private readonly _context: LeagueClientMainContext) {}

  async writeItemSetsToDisk(itemSets: any[] | null, clearPrevious = true) {
    try {
      const { data: installDir } = await this._context.leagueClient.http.get(
        '/data-store/v1/install-dir'
      )

      let targetPath: string
      if (this._context.state.auth?.region === 'TENCENT') {
        targetPath = path.join(installDir, '..', 'Game', 'Config', 'Global', 'Recommended')
      } else {
        targetPath = path.join(installDir, 'Config', 'Global', 'Recommended')
      }

      if (fs.existsSync(targetPath)) {
        if (!fs.statSync(targetPath).isDirectory()) {
          throw new Error(`The path ${targetPath} is not a directory`)
        }
      } else {
        fs.mkdirSync(targetPath, { recursive: true })
      }

      // 清空之前的文件, 这些文件以 `akari1` 开头
      if (clearPrevious) {
        const files = fs.readdirSync(targetPath)
        const akariFiles = files.filter((file) => file.startsWith(LEAGUE_CLIENT_ITEM_SET_PREFIX))

        for (const file of akariFiles) {
          fs.unlinkSync(path.join(targetPath, file))
        }
      }

      if (!itemSets) {
        return
      }

      for (const itemSet of itemSets) {
        const fileName = `${itemSet.uid}.json`
        const filePath = path.join(targetPath, fileName)

        this._context.logger.info(`Write item set to disk: ${filePath}`)

        fs.writeFileSync(filePath, JSON.stringify(itemSet), { encoding: 'utf-8' })
      }
    } catch (error) {
      this._context.logger.error(`Failed to write item set to local file`, error)
      throw error
    }
  }

  /**
   * 在连接之前, 先尝试获取一些召唤师信息
   */
  async peekClient(auth: UxCommandLine) {
    const c = axios.create({
      baseURL: `https://127.0.0.1:${auth.port}`,
      headers: {
        Authorization: `Basic ${Buffer.from(`riot:${auth.authToken}`).toString('base64')}`
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      }),
      httpAgent: new https.Agent(),
      timeout: LEAGUE_CLIENT_REQUEST_TIMEOUT_MS,
      proxy: false
    })

    try {
      const { data: summoner } = await c.get<SummonerInfo>('/lol-summoner/v1/current-summoner')
      const { data: profileIcon, headers } = await c.get(
        `/lol-game-data/assets/v1/profile-icons/${summoner.profileIconId}.jpg`,
        { responseType: 'arraybuffer' }
      )

      const contentType = headers['content-type'] || 'image/jpeg'

      return {
        summoner,
        profileIcon: `data:${contentType};base64,${Buffer.from(profileIcon).toString('base64')}`
      }
    } catch (error) {
      this._context.logger.warn(`Failed to peek client`, auth.pid, error)
      return null
    }
  }

  /**
   * https://github.com/LeagueTavern/fix-lcu-window
   * 不知道现在是否需要
   */
  async fixWindowMethodA(config?: { baseHeight: number; baseWidth: number }) {
    if (!NATIVE_SUPPORT.adjustLeagueClientWindowSize.available) {
      return
    }

    const { data: zoom } =
      await this._context.leagueClient.http.get<number>('/riotclient/zoom-scale')

    adjustLeagueClientWindowSize(zoom, config)
  }
}
