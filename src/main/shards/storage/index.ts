import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { app } from 'electron'
import { join } from 'node:path'
import { DataSource } from 'typeorm'

import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { MobxUtilsMain } from '../mobx-utils'
import {
  LEAGUE_AKARI_DB_CURRENT_VERSION,
  LEAGUE_AKARI_DB_FILENAME,
  STORAGE_MAIN_NAMESPACE,
  type StorageMainContext
} from './context'
import { StorageDatabaseLifecycle } from './database-lifecycle'
import { EncounteredGame } from './entities/EncounteredGame'
import { Metadata } from './entities/Metadata'
import { SavedPlayer } from './entities/SavedPlayers'
import { Setting } from './entities/Settings'
import { StorageState } from './state'

/**
 * 任何持久性存储的逻辑集成
 */
@Shard(StorageMain.id)
export class StorageMain implements IAkariShardInitDispose {
  static id = STORAGE_MAIN_NAMESPACE

  static LEAGUE_AKARI_DB_CURRENT_VERSION = LEAGUE_AKARI_DB_CURRENT_VERSION
  static LEAGUE_AKARI_DB_FILENAME = LEAGUE_AKARI_DB_FILENAME

  private readonly _logger: AkariLogger

  private readonly _dataSource: DataSource
  private readonly _context: StorageMainContext
  private readonly _databaseLifecycle: StorageDatabaseLifecycle

  public readonly state = new StorageState()

  get dataSource() {
    return this._dataSource
  }

  constructor(
    _loggerFactory: LoggerFactoryMain,
    private readonly _mobxUtils: MobxUtilsMain
  ) {
    this._logger = _loggerFactory.create(StorageMain.id)

    this._dataSource = new DataSource({
      type: 'better-sqlite3',
      database: join(app.getPath('userData'), StorageMain.LEAGUE_AKARI_DB_FILENAME),
      synchronize: false,
      entities: [Metadata, SavedPlayer, Setting, EncounteredGame]
    })

    this._context = {
      namespace: StorageMain.id,
      logger: this._logger,
      mobxUtils: this._mobxUtils,
      state: this.state
    }
    this._databaseLifecycle = new StorageDatabaseLifecycle(this._context)
  }

  async onInit() {
    this._mobxUtils.propSync(StorageMain.id, 'state', this.state, ['usingHigherVersionDb'])
    await this._databaseLifecycle.initialize(this._dataSource)
  }

  async onDispose() {
    await this._dataSource.destroy()
  }
}
