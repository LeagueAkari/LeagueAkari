import { MigrationContext, hasMigration, markMigration, moveSetting } from './context'

export const MIGRATION_FROM_126 = 'akari-migration-from-1.2.6_patch2'

// NOTE: drop support before League Akari 1.1.x
export async function migrateFrom126({ manager, log }: MigrationContext) {
  if (await hasMigration(manager, MIGRATION_FROM_126)) {
    return
  }

  log.info('Start migrating settings', MIGRATION_FROM_126)

  await moveSetting(manager, 'auxiliary-window/opacity', 'window-manager-main/auxWindowOpacity')
  await moveSetting(manager, 'auxiliary-window/enabled', 'window-manager-main/auxWindowEnabled')
  await moveSetting(manager, 'respawn-timer/enabled', 'respawn-timer-main/enabled')
  await moveSetting(manager, 'auto-reply/text', 'auto-reply-main/text')
  await moveSetting(manager, 'auto-reply/enabled', 'auto-reply-main/enabled')
  await moveSetting(manager, 'auto-reply/enableOnAway', 'auto-reply-main/enableOnAway')
  await moveSetting(
    manager,
    'auxiliary-window/functionality',
    'window-manager-main/auxWindowFunctionality'
  )
  await moveSetting(
    manager,
    'auto-gameflow/autoHonorEnabled',
    'auto-gameflow-main/autoHonorEnabled'
  )
  await moveSetting(
    manager,
    'auto-gameflow/playAgainEnabled',
    'auto-gameflow-main/playAgainEnabled'
  )
  await moveSetting(
    manager,
    'auto-gameflow/autoAcceptEnabled',
    'auto-gameflow-main/autoAcceptEnabled'
  )
  await moveSetting(
    manager,
    'auto-gameflow/autoAcceptDelaySeconds',
    'auto-gameflow-main/autoAcceptDelaySeconds'
  )
  await moveSetting(
    manager,
    'auto-gameflow/autoMatchmakingEnabled',
    'auto-gameflow-main/autoMatchmakingEnabled'
  )
  await moveSetting(
    manager,
    'auto-gameflow/autoMatchmakingDelaySeconds',
    'auto-gameflow-main/autoMatchmakingDelaySeconds'
  )
  await moveSetting(
    manager,
    'auto-gameflow/autoMatchmakingMinimumMembers',
    'auto-gameflow-main/autoMatchmakingMinimumMembers'
  )
  await moveSetting(
    manager,
    'auto-gameflow/autoMatchmakingWaitForInvitees',
    'auto-gameflow-main/autoMatchmakingWaitForInvitees'
  )
  await moveSetting(
    manager,
    'auto-gameflow/autoMatchmakingRematchStrategy',
    'auto-gameflow-main/autoMatchmakingRematchStrategy'
  )
  await moveSetting(
    manager,
    'auto-gameflow/autoMatchmakingRematchFixedDuration',
    'auto-gameflow-main/autoMatchmakingRematchFixedDuration'
  )
  await moveSetting(
    manager,
    'app/showFreeSoftwareDeclaration',
    'app-common-main/showFreeSoftwareDeclaration'
  )
  await moveSetting(manager, 'app/useWmic', 'league-client-ux-main/useWmic')
  await moveSetting(manager, 'app/isInKyokoMode', 'app-common-main/isInKyokoMode')
  await moveSetting(manager, 'auto-update/autoCheckUpdates', 'self-update-main/autoCheckUpdates')
  await moveSetting(manager, 'auto-update/downloadSource', 'self-update-main/downloadSource')
  await moveSetting(manager, 'auxiliary-window/isPinned', 'window-manager-main/auxWindowPinned')
  await moveSetting(
    manager,
    'auxiliary-window/showSkinSelector',
    'window-manager-main/auxWindowShowSkinSelector'
  )
  await moveSetting(manager, 'lcu-connection/autoConnect', 'league-client-main/autoConnect')
  await moveSetting(manager, 'auto-select/normalModeEnabled', 'auto-select-main/normalModeEnabled')
  await moveSetting(manager, 'auto-select/expectedChampions', 'auto-select-main/expectedChampions')
  await moveSetting(
    manager,
    'auto-select/selectTeammateIntendedChampion',
    'auto-select-main/selectTeammateIntendedChampion'
  )
  await moveSetting(manager, 'auto-select/showIntent', 'auto-select-main/showIntent')
  await moveSetting(manager, 'auto-select/benchModeEnabled', 'auto-select-main/benchModeEnabled')
  await moveSetting(
    manager,
    'auto-select/benchExpectedChampions',
    'auto-select-main/benchExpectedChampions'
  )
  await moveSetting(manager, 'auto-select/grabDelaySeconds', 'auto-select-main/grabDelaySeconds')
  await moveSetting(manager, 'auto-select/banEnabled', 'auto-select-main/banEnabled')
  await moveSetting(manager, 'auto-select/bannedChampions', 'auto-select-main/bannedChampions')
  await moveSetting(
    manager,
    'auto-select/banTeammateIntendedChampion',
    'auto-select-main/banTeammateIntendedChampion'
  )
  await moveSetting(
    manager,
    'core-functionality/fetchAfterGame',
    'player-tabs-renderer/refreshTabsAfterGameEnds'
  )
  await moveSetting(
    manager,
    'core-functionality/playerAnalysisFetchConcurrency',
    'ongoing-game-main/concurrency'
  )
  await moveSetting(
    manager,
    'core-functionality/ongoingAnalysisEnabled',
    'ongoing-game-main/enabled'
  )
  await moveSetting(
    manager,
    'core-functionality/matchHistoryLoadCount',
    'ongoing-game-main/matchHistoryLoadCount'
  )
  await moveSetting(
    manager,
    'core-functionality/preMadeTeamThreshold',
    'ongoing-game-main/premadeTeamThreshold'
  )
  await moveSetting(
    manager,
    'auto-update/lastReadAnnouncementSha',
    'self-update-main/lastReadAnnouncementSha'
  )
  await moveSetting(
    manager,
    'auto-select/benchSelectFirstAvailableChampion',
    'auto-select-main/benchSelectFirstAvailableChampion'
  )
  await moveSetting(
    manager,
    'core-functionality/useSgpApi',
    'ongoing-game-main/matchHistoryUseSgpApi'
  )
  await moveSetting(
    manager,
    'auto-gameflow/autoAcceptInvitationEnabled',
    'auto-gameflow-main/autoHandleInvitationsEnabled'
  )
  await moveSetting(
    manager,
    'auto-gameflow/invitationHandlingStrategies',
    'auto-gameflow-main/invitationHandlingStrategies'
  )
  await moveSetting(
    manager,
    'auto-gameflow/autoReconnectEnabled',
    'auto-gameflow-main/autoReconnectEnabled'
  )

  await markMigration(manager, MIGRATION_FROM_126)
  log.info(`Migration completed, to ${MIGRATION_FROM_126}`)
}
