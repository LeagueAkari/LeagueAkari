import fs from 'node:fs'
import { IsNull, Not } from 'typeorm'

import { AkariIpcError } from '../ipc'
import { StorageMain } from '../storage'
import { SavedPlayer } from '../storage/entities/SavedPlayers'
import type { SavedPlayerMainContext } from './context'

export class TaggedPlayersFileService {
  constructor(private readonly context: SavedPlayerMainContext) {}

  async writeToJsonFile(path: string) {
    const all = await this.context.storage.dataSource.manager.find(SavedPlayer, {
      where: {
        tag: Not(IsNull())
      }
    })

    const jsonContent = {
      databaseVersion: StorageMain.LEAGUE_AKARI_DB_CURRENT_VERSION,
      type: 'league-akari-tagged-players',
      data: all.map((record) => ({
        puuid: record.puuid,
        selfPuuid: record.selfPuuid,
        region: record.region,
        rsoPlatformId: record.rsoPlatformId,
        tag: record.tag
      }))
    }

    await fs.promises.writeFile(path, JSON.stringify(jsonContent), 'utf-8')

    return path
  }

  async readFromJsonFile(path: string) {
    await fs.promises.access(path, fs.constants.F_OK)

    const content = JSON.parse(await fs.promises.readFile(path, 'utf-8'))

    if (content.type !== 'league-akari-tagged-players') {
      throw new AkariIpcError(
        `The file is not a valid tagged players file`,
        'InvalidTaggedPlayersFile'
      )
    }

    if (content.databaseVersion > StorageMain.LEAGUE_AKARI_DB_CURRENT_VERSION) {
      throw new AkariIpcError(
        `The file is from a newer version of the application, please update the application first`,
        'InvalidDatabaseVersion'
      )
    }

    if (
      !Array.isArray(content.data) ||
      !content.data.every((v: any) => {
        return (
          typeof v === 'object' &&
          typeof v.puuid === 'string' &&
          typeof v.selfPuuid === 'string' &&
          typeof v.region === 'string' &&
          typeof v.rsoPlatformId === 'string' &&
          typeof v.tag === 'string'
        )
      })
    ) {
      throw new AkariIpcError(
        `The file is not a valid tagged players file`,
        'InvalidTaggedPlayersData'
      )
    }

    const BATCH_SIZE = 500
    const now = new Date()
    const rows = content.data.map((record: any) => {
      return {
        puuid: record.puuid,
        selfPuuid: record.selfPuuid,
        region: record.region,
        rsoPlatformId: record.rsoPlatformId,
        tag: record.tag,
        updateAt: now
      }
    })

    await this.context.storage.dataSource.manager.transaction(async (tx) => {
      for (let start = 0; start < rows.length; start += BATCH_SIZE) {
        const slice = rows.slice(start, start + BATCH_SIZE)
        await tx.save(SavedPlayer, slice)
      }
    })

    return path
  }
}
