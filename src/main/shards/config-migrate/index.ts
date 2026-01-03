import { IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { EntityManager, Equal } from 'typeorm'

import { AkariLogger, LoggerFactoryMain } from '../logger-factory'
import { StorageMain } from '../storage'
import { Setting } from '../storage/entities/Settings'

/**
 * 将旧的设置项重新设置, 并设置数据
 */
@Shard(ConfigMigrateMain.id, 2992)
export class ConfigMigrateMain implements IAkariShardInitDispose {
  static id = 'config-migrate-main'

  /**
   * 设置较高优先级, 以优先加载
   */

  static MIGRATION_FROM_126 = 'akari-migration-from-1.2.6_patch2'
  static MIGRATION_FROM_134 = 'akari-migration-from-1.3.4_patch1'
  static MIGRATION_FROM_135 = 'akari-migration-from-1.3.5_patch1'
  static MIGRATION_FROM_140 = 'akari-migration-from-1.4.0_patch1'
  static MIGRATION_FROM_141 = 'akari-migration-from-1.4.1_patch1'

  private readonly _log: AkariLogger

  constructor(
    private readonly _st: StorageMain,
    readonly _loggerFactory: LoggerFactoryMain
  ) {
    this._log = _loggerFactory.create(ConfigMigrateMain.id)
  }

  private async _do(manager: EntityManager, from: string, to: string, remove = true) {
    const s = await manager.findOneBy(Setting, { key: Equal(from) })

    if (!s) {
      return
    }

    await manager.save(Setting.create(to, s.value))

    if (remove) {
      await manager.remove(s)
    }
  }

  // NOTE: drop support before League Akari 1.1.x
  private async _migrateFrom126(manager: EntityManager) {
    const hasMigratedSymbol = await manager.findOneBy(Setting, {
      key: Equal(ConfigMigrateMain.MIGRATION_FROM_126)
    })

    if (hasMigratedSymbol) {
      return
    }

    this._log.info('Start migrating settings', ConfigMigrateMain.MIGRATION_FROM_126)

    await this._do(manager, 'auxiliary-window/opacity', 'window-manager-main/auxWindowOpacity')
    await this._do(manager, 'auxiliary-window/enabled', 'window-manager-main/auxWindowEnabled')
    await this._do(manager, 'respawn-timer/enabled', 'respawn-timer-main/enabled')
    await this._do(manager, 'auto-reply/text', 'auto-reply-main/text')
    await this._do(manager, 'auto-reply/enabled', 'auto-reply-main/enabled')
    await this._do(manager, 'auto-reply/enableOnAway', 'auto-reply-main/enableOnAway')
    await this._do(
      manager,
      'auxiliary-window/functionality',
      'window-manager-main/auxWindowFunctionality'
    )
    await this._do(manager, 'auto-gameflow/autoHonorEnabled', 'auto-gameflow-main/autoHonorEnabled')
    await this._do(manager, 'auto-gameflow/playAgainEnabled', 'auto-gameflow-main/playAgainEnabled')
    await this._do(
      manager,
      'auto-gameflow/autoAcceptEnabled',
      'auto-gameflow-main/autoAcceptEnabled'
    )
    await this._do(
      manager,
      'auto-gameflow/autoAcceptDelaySeconds',
      'auto-gameflow-main/autoAcceptDelaySeconds'
    )
    await this._do(
      manager,
      'auto-gameflow/autoMatchmakingEnabled',
      'auto-gameflow-main/autoMatchmakingEnabled'
    )
    await this._do(
      manager,
      'auto-gameflow/autoMatchmakingDelaySeconds',
      'auto-gameflow-main/autoMatchmakingDelaySeconds'
    )
    await this._do(
      manager,
      'auto-gameflow/autoMatchmakingMinimumMembers',
      'auto-gameflow-main/autoMatchmakingMinimumMembers'
    )
    await this._do(
      manager,
      'auto-gameflow/autoMatchmakingWaitForInvitees',
      'auto-gameflow-main/autoMatchmakingWaitForInvitees'
    )
    await this._do(
      manager,
      'auto-gameflow/autoMatchmakingRematchStrategy',
      'auto-gameflow-main/autoMatchmakingRematchStrategy'
    )
    await this._do(
      manager,
      'auto-gameflow/autoMatchmakingRematchFixedDuration',
      'auto-gameflow-main/autoMatchmakingRematchFixedDuration'
    )
    await this._do(
      manager,
      'app/showFreeSoftwareDeclaration',
      'app-common-main/showFreeSoftwareDeclaration'
    )
    await this._do(manager, 'app/useWmic', 'league-client-ux-main/useWmic')
    await this._do(manager, 'app/isInKyokoMode', 'app-common-main/isInKyokoMode')
    await this._do(manager, 'auto-update/autoCheckUpdates', 'self-update-main/autoCheckUpdates')
    await this._do(manager, 'auto-update/downloadSource', 'self-update-main/downloadSource')
    await this._do(manager, 'auxiliary-window/isPinned', 'window-manager-main/auxWindowPinned')
    await this._do(
      manager,
      'auxiliary-window/showSkinSelector',
      'window-manager-main/auxWindowShowSkinSelector'
    )
    await this._do(manager, 'lcu-connection/autoConnect', 'league-client-main/autoConnect')
    await this._do(manager, 'auto-select/normalModeEnabled', 'auto-select-main/normalModeEnabled')
    await this._do(manager, 'auto-select/expectedChampions', 'auto-select-main/expectedChampions')
    await this._do(
      manager,
      'auto-select/selectTeammateIntendedChampion',
      'auto-select-main/selectTeammateIntendedChampion'
    )
    await this._do(manager, 'auto-select/showIntent', 'auto-select-main/showIntent')
    await this._do(manager, 'auto-select/benchModeEnabled', 'auto-select-main/benchModeEnabled')
    await this._do(
      manager,
      'auto-select/benchExpectedChampions',
      'auto-select-main/benchExpectedChampions'
    )
    await this._do(manager, 'auto-select/grabDelaySeconds', 'auto-select-main/grabDelaySeconds')
    await this._do(manager, 'auto-select/banEnabled', 'auto-select-main/banEnabled')
    await this._do(manager, 'auto-select/bannedChampions', 'auto-select-main/bannedChampions')
    await this._do(
      manager,
      'auto-select/banTeammateIntendedChampion',
      'auto-select-main/banTeammateIntendedChampion'
    )
    await this._do(
      manager,
      'core-functionality/fetchAfterGame',
      'player-tabs-renderer/refreshTabsAfterGameEnds'
    )
    await this._do(
      manager,
      'core-functionality/playerAnalysisFetchConcurrency',
      'ongoing-game-main/concurrency'
    )
    await this._do(
      manager,
      'core-functionality/ongoingAnalysisEnabled',
      'ongoing-game-main/enabled'
    )
    await this._do(
      manager,
      'core-functionality/matchHistoryLoadCount',
      'ongoing-game-main/matchHistoryLoadCount'
    )
    await this._do(
      manager,
      'core-functionality/preMadeTeamThreshold',
      'ongoing-game-main/premadeTeamThreshold'
    )
    await this._do(
      manager,
      'auto-update/lastReadAnnouncementSha',
      'self-update-main/lastReadAnnouncementSha'
    )
    await this._do(
      manager,
      'auto-select/benchSelectFirstAvailableChampion',
      'auto-select-main/benchSelectFirstAvailableChampion'
    )
    await this._do(
      manager,
      'core-functionality/useSgpApi',
      'ongoing-game-main/matchHistoryUseSgpApi'
    )
    await this._do(
      manager,
      'auto-gameflow/autoAcceptInvitationEnabled',
      'auto-gameflow-main/autoHandleInvitationsEnabled'
    )
    await this._do(
      manager,
      'auto-gameflow/invitationHandlingStrategies',
      'auto-gameflow-main/invitationHandlingStrategies'
    )
    await this._do(
      manager,
      'auto-gameflow/autoReconnectEnabled',
      'auto-gameflow-main/autoReconnectEnabled'
    )

    await manager.save(
      Setting.create(ConfigMigrateMain.MIGRATION_FROM_126, ConfigMigrateMain.MIGRATION_FROM_126)
    )

    this._log.info(`Migration completed, to ${ConfigMigrateMain.MIGRATION_FROM_126}`)
  }

  private async _migrateFrom134(manager: EntityManager) {
    const hasMigratedSymbol = await manager.findOneBy(Setting, {
      key: Equal(ConfigMigrateMain.MIGRATION_FROM_134)
    })

    if (hasMigratedSymbol) {
      return
    }

    this._log.info('Start migrating settings', ConfigMigrateMain.MIGRATION_FROM_134)

    await manager.save(Setting, Setting.create('app-common-main/showFreeSoftwareDeclaration', true))

    await this._do(
      manager,
      'window-manager-main/auxWindowPinned',
      'window-manager-main/aux-window/pinned'
    )
    await this._do(
      manager,
      'window-manager-main/auxWindowOpacity',
      'window-manager-main/aux-window/opacity'
    )
    await this._do(
      manager,
      'window-manager-main/auxWindowEnabled',
      'window-manager-main/aux-window/enabled'
    )
    await this._do(
      manager,
      'window-manager-main/auxWindowAutoShow',
      'window-manager-main/aux-window/autoShow'
    )
    await this._do(
      manager,
      'window-manager-main/auxWindowShowSkinSelector',
      'window-manager-main/aux-window/showSkinSelector'
    )

    await this._do(
      manager,
      'window-manager-main/mainWindowSize',
      'window-manager-main/main-window/size'
    )

    const httpProxySetting = await manager.findOneBy(Setting, {
      key: Equal('app-common-main/httpProxy')
    })

    if (httpProxySetting) {
      await manager.save(
        Setting.create('app-common-main/httpProxy', {
          strategy: httpProxySetting.value.enabled ? 'force' : 'auto',
          port: httpProxySetting.value.port,
          host: httpProxySetting.value.host
        })
      )
    }

    const boundsRecord = await manager.findOneBy(Setting, {
      key: Equal('window-manager-main/auxWindowFunctionalityBounds')
    })

    if (boundsRecord) {
      const indicator = boundsRecord.value.indicator
      const opgg = boundsRecord.value.opgg

      if (indicator) {
        await manager.save(Setting.create('window-manager-main/aux-window/bounds', indicator))
      }

      if (opgg) {
        await manager.save(Setting.create('window-manager-main/opgg-window/bounds', opgg))
      }
    }

    await manager.save(
      Setting.create(ConfigMigrateMain.MIGRATION_FROM_134, ConfigMigrateMain.MIGRATION_FROM_134)
    )

    this._log.info(`Migration completed, to ${ConfigMigrateMain.MIGRATION_FROM_134}`)
  }

  private async _migrateFrom135(manager: EntityManager) {
    const hasMigratedSymbol = await manager.findOneBy(Setting, {
      key: Equal(ConfigMigrateMain.MIGRATION_FROM_135)
    })

    if (hasMigratedSymbol) {
      return
    }

    this._log.info('Start migrating settings', ConfigMigrateMain.MIGRATION_FROM_135)

    await manager.save(Setting.create('app-common-main/showFreeSoftwareDeclaration', true))

    await this._do(manager, 'app-common-renderer/streamerMode', 'app-common-main/streamerMode')
    await this._do(
      manager,
      'app-common-renderer/streamerModeUseAkariStyledName',
      'app-common-main/streamerModeUseAkariStyledName'
    )

    await manager.save(
      Setting.create(ConfigMigrateMain.MIGRATION_FROM_135, ConfigMigrateMain.MIGRATION_FROM_135)
    )

    const oldPlaintextSend = await manager.findOneBy(Setting, {
      key: Equal('in-game-send-main/customSend')
    })

    if (oldPlaintextSend) {
      try {
        const old = oldPlaintextSend.value
        const current = await manager.findOneBy(Setting, {
          key: Equal('in-game-send-main/sendableItems')
        })

        const newArr = current ? current.value : []

        await manager.save(
          Setting.create('in-game-send-main/sendableItems', [
            ...newArr,
            ...old.map((item: any) => ({
              id: item.id,
              name: item.name,
              content: {
                type: 'plaintext',
                content: item.message
              }
            }))
          ])
        )
      } catch (error) {
        this._log.error('Failed to migrate former sendable items', error)
      }
    }

    await this._do(manager, 'self-update-main/downloadSource', 'remote-config-main/preferredSource')
  }

  private async _migrateFrom137(manager: EntityManager) {
    const hasMigratedSymbol = await manager.findOneBy(Setting, {
      key: Equal(ConfigMigrateMain.MIGRATION_FROM_140)
    })

    if (hasMigratedSymbol) {
      return
    }

    this._log.info('Start migrating settings', ConfigMigrateMain.MIGRATION_FROM_140)

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
      this._log.error('Failed to migrate preferredLolSource', error)
    }

    await this._do(
      manager,
      'ongoing-game-renderer/autoRouteWhenGameStarts',
      'ongoing-game-main/autoRouteWhenGameStarts'
    )
    await this._do(
      manager,
      'ongoing-game-renderer/frontend/showChampionUsage',
      'ongoing-game-main/showChampionUsage'
    )
    await this._do(
      manager,
      'ongoing-game-renderer/frontend/showMatchHistoryItemBorder',
      'ongoing-game-main/showMatchHistoryItemBorder'
    )
    await this._do(
      manager,
      'ongoing-game-renderer/orderPlayerBy',
      'ongoing-game-main/orderPlayerBy'
    )
    await this._do(
      manager,
      'ongoing-game-renderer/frontend/playerCard',
      'ongoing-game-main/playerCardTags'
    )
    await this._do(
      manager,
      'ongoing-game-main/gameTimelineLoadCount',
      'ongoing-game-main/gameDetailsLoadCount'
    )

    await this._do(manager, 'league-client-ux-main/useWmic', 'league-client-ux-main/useWmi')

    await this._do(
      manager,
      'window-manager-main/main-window/bounds',
      'window-manager-main/main-window/normalBounds'
    )
    await this._do(
      manager,
      'window-manager-main/opgg-window/bounds',
      'window-manager-main/opgg-window/normalBounds'
    )
    await this._do(
      manager,
      'window-manager-main/aux-window/bounds',
      'window-manager-main/aux-window/normalBounds'
    )

    await this._do(
      manager,
      'window-manager-main/ongoing-game-window/bounds',
      'window-manager-main/ongoing-game-window/normalBounds'
    )

    await this._do(
      manager,
      'window-manager-main/cd-timer-window/bounds',
      'window-manager-main/cd-timer-window/normalBounds'
    )

    // Migrate match-history-tabs-renderer to player-tabs-renderer
    await this._do(
      manager,
      'match-history-tabs-renderer/frontendSettings',
      'player-tabs-renderer/frontendSettings'
    )
    await this._do(
      manager,
      'match-history-tabs-renderer/searchHistory',
      'player-tabs-renderer/searchHistory'
    )

    await manager.save(
      Setting.create(ConfigMigrateMain.MIGRATION_FROM_140, ConfigMigrateMain.MIGRATION_FROM_140)
    )
  }

  private async _migrateFrom140(manager: EntityManager) {
    const hasMigratedSymbol = await manager.findOneBy(Setting, {
      key: Equal(ConfigMigrateMain.MIGRATION_FROM_141)
    })

    if (hasMigratedSymbol) {
      return
    }

    this._log.info('Start migrating settings', ConfigMigrateMain.MIGRATION_FROM_141)

    // Migrate normalBounds to trackedBounds
    await this._do(
      manager,
      'window-manager-main/main-window/normalBounds',
      'window-manager-main/main-window/trackedBounds'
    )
    await this._do(
      manager,
      'window-manager-main/opgg-window/normalBounds',
      'window-manager-main/opgg-window/trackedBounds'
    )
    await this._do(
      manager,
      'window-manager-main/aux-window/normalBounds',
      'window-manager-main/aux-window/trackedBounds'
    )
    await this._do(
      manager,
      'window-manager-main/ongoing-game-window/normalBounds',
      'window-manager-main/ongoing-game-window/trackedBounds'
    )
    await this._do(
      manager,
      'window-manager-main/cd-timer-window/normalBounds',
      'window-manager-main/cd-timer-window/trackedBounds'
    )

    await manager.save(
      Setting.create(ConfigMigrateMain.MIGRATION_FROM_141, ConfigMigrateMain.MIGRATION_FROM_141)
    )

    this._log.info(`Migration completed, to ${ConfigMigrateMain.MIGRATION_FROM_141}`)
  }

  async onInit() {
    try {
      await this._st.dataSource.transaction(async (manager) => {
        await this._migrateFrom126(manager)
        await this._migrateFrom134(manager)
        await this._migrateFrom135(manager)
        await this._migrateFrom137(manager)
        await this._migrateFrom140(manager)
      })
    } catch (error) {
      this._log.error('Failed to migrate settings', error)
    }
  }
}
