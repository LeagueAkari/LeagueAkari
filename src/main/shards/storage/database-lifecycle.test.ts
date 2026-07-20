import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { DataSource, QueryRunner } from 'typeorm'
import { describe, expect, it, vi } from 'vitest'

import type { StorageMainContext } from './context'
import { StorageDatabaseLifecycle, isDatabaseCorruptionError } from './database-lifecycle'
import { StorageState } from './state'

describe('StorageDatabaseLifecycle', () => {
  describe('isDatabaseCorruptionError', () => {
    it.each([
      { code: 'SQLITE_CORRUPT', message: 'database disk image is malformed' },
      { code: 'SQLITE_CORRUPT_INDEX' },
      { code: 'SQLITE_NOTADB' },
      new Error('database disk image is malformed'),
      new Error('file is not a database'),
      new Error('query failed', {
        cause: { driverError: { code: 'SQLITE_CORRUPT', message: 'corrupt database' } }
      })
    ])('recognizes SQLite database corruption: %o', (error) => {
      expect(isDatabaseCorruptionError(error)).toBe(true)
    })

    it.each([
      new Error('migration failed'),
      { code: 'SQLITE_BUSY', message: 'database is locked' },
      { code: 'SQLITE_READONLY', message: 'attempt to write a readonly database' },
      null
    ])('does not treat unrelated failures as corruption: %o', (error) => {
      expect(isDatabaseCorruptionError(error)).toBe(false)
    })
  })

  it('backs up a corrupt database and rebuilds it from version zero', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'league-akari-storage-'))
    const dbPath = join(tempDir, 'LeagueAkari.db')
    const databaseFiles = ['', '-wal', '-shm', '-journal']

    try {
      for (const suffix of databaseFiles) {
        writeFileSync(`${dbPath}${suffix}`, `corrupt${suffix}`)
      }

      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      } as unknown as StorageMainContext['logger']
      const context: StorageMainContext = {
        namespace: 'storage-main',
        logger,
        mobxUtils: {} as StorageMainContext['mobxUtils'],
        state: new StorageState()
      }

      let dataSource: DataSource
      let initialized = false
      let initializeCount = 0
      const queryRunner = {
        get dataSource() {
          return dataSource
        },
        startTransaction: vi.fn(async () => {}),
        commitTransaction: vi.fn(async () => {}),
        rollbackTransaction: vi.fn(async () => {}),
        release: vi.fn(async () => {}),
        createTable: vi.fn(async () => {}),
        createIndex: vi.fn(async () => {}),
        getTable: vi.fn(async () => null),
        query: vi.fn(async () => [])
      } as unknown as QueryRunner

      dataSource = {
        options: { database: dbPath },
        get isInitialized() {
          return initialized
        },
        initialize: vi.fn(async () => {
          initializeCount++
          if (initializeCount === 1) {
            throw Object.assign(new Error('database disk image is malformed'), {
              code: 'SQLITE_CORRUPT'
            })
          }

          initialized = true
          writeFileSync(dbPath, 'fresh')
          return dataSource
        }),
        destroy: vi.fn(async () => {
          initialized = false
        }),
        createQueryRunner: vi.fn(() => queryRunner),
        getMetadata: vi.fn(() => ({ tablePath: 'EncounteredGames' }))
      } as unknown as DataSource

      await new StorageDatabaseLifecycle(context).initialize(dataSource)

      expect(dataSource.initialize).toHaveBeenCalledTimes(2)
      expect(queryRunner.commitTransaction).toHaveBeenCalledOnce()
      expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalledOnce()
      expect(readFileSync(dbPath, 'utf8')).toBe('fresh')

      const backupName = readdirSync(tempDir).find((name) => /^\d+_bk\.db$/.test(name))
      expect(backupName).toBeDefined()

      const backupPath = join(tempDir, backupName!)
      for (const suffix of databaseFiles) {
        expect(readFileSync(`${backupPath}${suffix}`, 'utf8')).toBe(`corrupt${suffix}`)
      }
    } finally {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })
})
