import { Equal } from 'typeorm'

import { Setting } from '../../storage/entities/Settings'
import { MigrationContext, hasMigration, markMigration, moveSetting } from './context'

export const MIGRATION_FROM_140 = 'akari-migration-from-1.4.0_patch1'

export async function migrateFrom140({ manager, logger }: MigrationContext) {
  if (await hasMigration(manager, MIGRATION_FROM_140)) {
    return
  }

  logger.info('Start migrating settings', MIGRATION_FROM_140)

  // Migrate preferredLolSource
  try {
    const ongoingSgpSetting = await manager.findOneBy(Setting, {
      key: Equal('ongoing-game-main/matchHistoryUseSgpApi')
    })

    const tabsFrontendSetting = await manager.findOneBy(Setting, {
      key: Equal('match-history-tabs-renderer/frontendSettings')
    })

    let ongoingSgp = true
    if (ongoingSgpSetting) {
      ongoingSgp = ongoingSgpSetting.value
    }

    let tabsSgp = true
    if (
      tabsFrontendSetting &&
      tabsFrontendSetting.value &&
      typeof tabsFrontendSetting.value.matchHistoryUseSgpApi === 'boolean'
    ) {
      tabsSgp = tabsFrontendSetting.value.matchHistoryUseSgpApi
    }

    const preferredLolSource = ongoingSgp || tabsSgp ? 'sgp' : 'lcu'

    await manager.save(Setting.create('app-common-main/preferredLolSource', preferredLolSource))

    if (ongoingSgpSetting) {
      await manager.remove(ongoingSgpSetting)
    }
  } catch (error) {
    logger.error('Failed to migrate preferredLolSource', error)
  }

  await moveSetting(
    manager,
    'ongoing-game-renderer/autoRouteWhenGameStarts',
    'ongoing-game-main/autoRouteWhenGameStarts'
  )
  await moveSetting(
    manager,
    'ongoing-game-renderer/frontend/showChampionUsage',
    'ongoing-game-main/showChampionUsage'
  )
  await moveSetting(
    manager,
    'ongoing-game-renderer/frontend/showMatchHistoryItemBorder',
    'ongoing-game-main/showMatchHistoryItemBorder'
  )
  await moveSetting(
    manager,
    'ongoing-game-renderer/orderPlayerBy',
    'ongoing-game-main/orderPlayerBy'
  )
  await moveSetting(
    manager,
    'ongoing-game-renderer/frontend/playerCard',
    'ongoing-game-main/playerCardTags'
  )
  await moveSetting(
    manager,
    'ongoing-game-main/gameTimelineLoadCount',
    'ongoing-game-main/gameDetailsLoadCount'
  )

  await moveSetting(manager, 'league-client-ux-main/useWmic', 'league-client-ux-main/useWmi')

  await moveSetting(
    manager,
    'window-manager-main/main-window/bounds',
    'window-manager-main/main-window/normalBounds'
  )
  await moveSetting(
    manager,
    'window-manager-main/opgg-window/bounds',
    'window-manager-main/opgg-window/normalBounds'
  )
  await moveSetting(
    manager,
    'window-manager-main/aux-window/bounds',
    'window-manager-main/aux-window/normalBounds'
  )

  await moveSetting(
    manager,
    'window-manager-main/ongoing-game-window/bounds',
    'window-manager-main/ongoing-game-window/normalBounds'
  )

  await moveSetting(
    manager,
    'window-manager-main/cd-timer-window/bounds',
    'window-manager-main/cd-timer-window/normalBounds'
  )

  // Migrate match-history-tabs-renderer to player-tabs-renderer
  await moveSetting(
    manager,
    'match-history-tabs-renderer/frontendSettings',
    'player-tabs-renderer/frontendSettings'
  )
  await moveSetting(
    manager,
    'match-history-tabs-renderer/searchHistory',
    'player-tabs-renderer/searchHistory'
  )

  await markMigration(manager, MIGRATION_FROM_140)
}
