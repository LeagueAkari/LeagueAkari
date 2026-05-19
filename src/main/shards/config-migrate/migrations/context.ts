import { EntityManager, Equal } from 'typeorm'

import { AkariLogger } from '../../logger-factory'
import { Setting } from '../../storage/entities/Settings'

export interface MigrationContext {
  manager: EntityManager
  log: AkariLogger
}

export async function hasMigration(manager: EntityManager, key: string) {
  return Boolean(await manager.findOneBy(Setting, { key: Equal(key) }))
}

export async function markMigration(manager: EntityManager, key: string) {
  await manager.save(Setting.create(key, key))
}

export async function moveSetting(manager: EntityManager, from: string, to: string, remove = true) {
  const s = await manager.findOneBy(Setting, { key: Equal(from) })

  if (!s) {
    return
  }

  await manager.save(Setting.create(to, s.value))

  if (remove) {
    await manager.remove(s)
  }
}
