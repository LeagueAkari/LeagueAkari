import dayjs from 'dayjs'
import { existsSync, renameSync } from 'node:fs'
import { join } from 'node:path'
import type { DataSource, QueryRunner } from 'typeorm'

import { LEAGUE_AKARI_DB_CURRENT_VERSION, type StorageMainContext } from './context'
import { v10_LA1_2_0initializationUpgrade } from './upgrades/version-10'
import { v15_LA1_2_2Upgrade } from './upgrades/version-15'

export class StorageDatabaseLifecycle {
  private readonly _upgrades = {
    10: v10_LA1_2_0initializationUpgrade,
    15: v15_LA1_2_2Upgrade
  }

  private _rebuildOnUpgradeFailedAttempted = false

  constructor(private readonly context: StorageMainContext) {}

  async initialize(dataSource: DataSource) {
    await this._initializeDatabase(dataSource)
    const dbPath = dataSource.options.database as string
    if (!dbPath) {
      return
    }

    this.context.logger.info(`Current database file located at ${dbPath}`)

    const { needToRecreateDatabase, needToPerformUpgrade, currentVersion } =
      await this._checkDatabaseVersion(dataSource)

    this.context.logger.info(`Current version ${currentVersion}`)

    let cv = currentVersion

    if (!needToPerformUpgrade && !needToRecreateDatabase) {
      this.context.logger.info(`Current version database does not need to be migrated`)
    }

    if (needToRecreateDatabase) {
      this.context.logger.warn(`Invalid database format, need to recreate database`)
      await this._recreateDatabase(dataSource, dbPath)
      cv = 0
    }

    if (needToPerformUpgrade) {
      this.context.logger.info(`Database needs to be upgraded from ${cv} version`)

      try {
        await this._runMigrationsInTransaction(dataSource, cv)
      } catch (error) {
        // Retry once by recreating the database to avoid infinite loops
        if (!this._rebuildOnUpgradeFailedAttempted) {
          this.context.logger.error(
            'Database upgrade failed, will recreate database once and retry',
            error
          )
          this._rebuildOnUpgradeFailedAttempted = true

          await this._recreateDatabase(dataSource, dbPath)

          // After recreation, run migrations from empty (version 0)
          await this._runMigrationsInTransaction(dataSource, 0)
        } else {
          throw error
        }
      }
    }
  }

  /**
   * 处理 League Akari 的数据库的升级
   */
  private async _performUpgrades(r: QueryRunner, currentVersion: number) {
    const pendingUpgrades = Object.entries(this._upgrades)
      .filter(([v]) => Number(v) > currentVersion)
      .toSorted(([v1], [v2]) => Number(v1) - Number(v2))

    this.context.logger.info(
      `Number of database upgrades to be performed: ${pendingUpgrades.length}`
    )

    for (const [v, fn] of pendingUpgrades) {
      this.context.logger.info(`Executing => version ${v} migration`)
      await fn(r)
    }

    this.context.logger.info(`All database migrations completed`)
  }

  private async _initializeDatabase(dataSource: DataSource) {
    await dataSource.initialize()
  }

  private async _recreateDatabase(dataSource: DataSource, dbPath: string) {
    await dataSource.destroy()

    if (existsSync(dbPath)) {
      const backupPath = join(dbPath, `../${dayjs().format('YYYYMMDDHHmmssSSS')}_bk.db`)

      renameSync(dbPath, backupPath)
      this.context.logger.info(`Original database cannot be used, backed up to ${backupPath}`)
    }

    await dataSource.initialize()
  }

  private async _checkDatabaseVersion(dataSource: DataSource): Promise<{
    needToRecreateDatabase: boolean
    needToPerformUpgrade: boolean
    currentVersion: number
  }> {
    const queryRunner = dataSource.createQueryRunner()
    let needToRecreateDatabase = false
    let needToPerformUpgrade = false
    let currentVersion = 0

    try {
      const metadataTable = await queryRunner.getTable('Metadata')
      if (metadataTable) {
        const versionResult = await queryRunner.manager.query(
          "SELECT value FROM Metadata WHERE key = 'version'"
        )
        if (versionResult.length) {
          currentVersion = parseInt(versionResult[0].value, 10)
          if (currentVersion > LEAGUE_AKARI_DB_CURRENT_VERSION) {
            // Higher version DB detected: use as-is, do not migrate/recreate, and set warning flag
            this.context.logger.warn(
              `Database version (${currentVersion}) is higher than supported (${LEAGUE_AKARI_DB_CURRENT_VERSION}). Using higher version database as-is.`
            )
            this.context.state.setUsingHigherVersionDb(true)
            needToRecreateDatabase = false
            needToPerformUpgrade = false
          } else if (currentVersion < LEAGUE_AKARI_DB_CURRENT_VERSION) {
            // low version, need to upgrade
            needToPerformUpgrade = true
          }
        } else {
          // no version field, malformed db
          needToRecreateDatabase = true
          needToPerformUpgrade = true
        }
      } else {
        // just created, need to build the db
        needToPerformUpgrade = true
      }
    } finally {
      await queryRunner.release()
    }

    return { needToRecreateDatabase, needToPerformUpgrade, currentVersion }
  }

  private async _runMigrationsInTransaction(dataSource: DataSource, fromVersion: number) {
    const queryRunner = dataSource.createQueryRunner()
    await queryRunner.startTransaction()

    try {
      await this._performUpgrades(queryRunner, fromVersion)
      await queryRunner.commitTransaction()
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }
}
