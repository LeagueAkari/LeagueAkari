import type {
  AkariNavigationPath,
  AkariNavigationStep
} from '@renderer-shared/composables/useAkariNavigation'
import { SETTINGS_NAVIGATION_TARGET_SCOPE } from '@renderer-shared/composables/useSettingsNavigationTarget'

export const MAIN_WINDOW_NAVIGATION_SCOPE = 'main-window'
export const SETTINGS_MODAL_NAVIGATION_SCOPE = 'settings-modal'
export const STORAGE_SETTINGS_NAVIGATION_SCOPE = 'settings-modal.storage'
export const AUTO_SELECT_NAVIGATION_SCOPE = 'automation.auto-select'

export const SETTINGS_TAB_LABEL_KEYS = {
  basic: 'settings.app.title',
  'player-tabs': 'settings.matchHistory.title',
  'ongoing-game': 'settings.ongoingGame.title',
  'multi-window': 'settings.multiWindow.title',
  storage: 'settings.storage.title',
  misc: 'settings.misc.title',
  debug: 'settings.debug.title',
  about: 'settings.about.title'
} as const

export type SettingsTabName = keyof typeof SETTINGS_TAB_LABEL_KEYS

export const STORAGE_SETTINGS_TAB_LABEL_KEYS = {
  'tagged-players': 'settings.storage.tabs.tagged-players',
  settings: 'settings.storage.tabs.settings'
} as const

export type StorageSettingsTabName = keyof typeof STORAGE_SETTINGS_TAB_LABEL_KEYS

export type SettingsModalNavigationRoute =
  | {
      tab: Exclude<SettingsTabName, 'storage'>
      subTab?: never
    }
  | {
      tab: 'storage'
      subTab: StorageSettingsTabName
    }

export const MAIN_WINDOW_PAGE_LABEL_KEYS = {
  automation: 'automation.home.title',
  toolkit: 'toolkit.home.title'
} as const

export const MAIN_WINDOW_SECTION_LABEL_KEYS: Readonly<Record<string, string>> = {
  'automation.auto-gameflow': 'automation.home.autoGameflow',
  'automation.auto-select': 'automation.home.autoSelect',
  'automation.auto-champ-config': 'automation.home.autoChampConfig',
  'automation.misc': 'automation.home.autoMisc',
  'toolkit.client': 'toolkit.home.client',
  'toolkit.in-game-send': 'toolkit.home.in-game-send',
  'toolkit.misc': 'toolkit.home.misc'
}

export type MainWindowSettingsNavigationRoute =
  | {
      name: 'automation'
      section: 'auto-gameflow' | 'auto-select' | 'auto-champ-config' | 'misc'
    }
  | {
      name: 'toolkit'
      section: 'client' | 'in-game-send' | 'misc'
    }

export type SettingsNavigationRoute =
  SettingsModalNavigationRoute | MainWindowSettingsNavigationRoute

export type MainWindowNavigationDestination =
  | {
      surface: 'settings-modal'
    }
  | {
      surface: 'route'
      route: MainWindowSettingsNavigationRoute
    }

export type AutoSelectNavigationDestination = 'pick' | 'ban'

export interface SettingsNavigationTargetDefinition {
  id: string
  kind: 'row' | 'section'
  route: SettingsNavigationRoute
  labelKey: string
  descriptionKey?: string
  keywordKeys?: readonly string[]
  parentId?: string
  fallbackId?: string
  searchable?: boolean
}

const targetDefinitions = [
  {
    id: 'app.basic',
    kind: 'section',
    route: { tab: 'basic' },
    labelKey: 'settings.app.basic.title',
    searchable: false
  },
  {
    id: 'app.basic.close-action',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.basic',
    labelKey: 'settings.app.basic.mainWindowCloseAction.label',
    descriptionKey: 'settings.app.basic.mainWindowCloseAction.description'
  },
  {
    id: 'app.basic.locale',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.basic',
    labelKey: 'settings.app.basic.locale.label',
    descriptionKey: 'settings.app.basic.locale.description'
  },
  {
    id: 'app.basic.preferred-lol-source',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.basic',
    labelKey: 'settings.app.basic.preferredLolSource.label',
    descriptionKey: 'settings.app.basic.preferredLolSource.description'
  },
  {
    id: 'app.basic.theme',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.basic',
    labelKey: 'settings.app.basic.theme.label',
    descriptionKey: 'settings.app.basic.theme.description'
  },
  {
    id: 'app.self-update',
    kind: 'section',
    route: { tab: 'basic' },
    labelKey: 'settings.app.selfUpdate.title',
    searchable: false
  },
  {
    id: 'app.self-update.auto-check',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.self-update',
    labelKey: 'settings.app.selfUpdate.autoCheckUpdates.label',
    descriptionKey: 'settings.app.selfUpdate.autoCheckUpdates.description'
  },
  {
    id: 'app.self-update.auto-download',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.self-update',
    labelKey: 'settings.app.selfUpdate.autoDownloadUpdates.label',
    descriptionKey: 'settings.app.selfUpdate.autoDownloadUpdates.description'
  },
  {
    id: 'app.self-update.check',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.self-update',
    labelKey: 'settings.app.selfUpdate.checkUpdates'
  },
  {
    id: 'app.main-window-ui',
    kind: 'section',
    route: { tab: 'basic' },
    labelKey: 'settings.app.mainWindowUi.title',
    searchable: false
  },
  {
    id: 'app.main-window-ui.background',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.main-window-ui',
    labelKey: 'settings.app.mainWindowUi.background.label',
    descriptionKey: 'settings.app.mainWindowUi.background.description'
  },
  {
    id: 'app.lcu-connection',
    kind: 'section',
    route: { tab: 'basic' },
    labelKey: 'settings.app.lcConnection.title',
    searchable: false
  },
  {
    id: 'app.lcu-connection.auto-connect',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.lcu-connection',
    labelKey: 'settings.app.lcConnection.autoConnect.label',
    descriptionKey: 'settings.app.lcConnection.autoConnect.description'
  },
  {
    id: 'app.lcu-connection.use-wmi',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.lcu-connection',
    fallbackId: 'app.lcu-connection.auto-connect',
    labelKey: 'settings.app.lcConnection.useWmi.label',
    descriptionKey: 'settings.app.lcConnection.useWmi.description'
  },
  {
    id: 'app.lcu-connection.rebuild-wmi',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.lcu-connection',
    fallbackId: 'app.lcu-connection.auto-connect',
    labelKey: 'settings.app.lcConnection.rebuildWmi.label',
    descriptionKey: 'settings.app.lcConnection.rebuildWmi.description'
  },
  {
    id: 'app.misc',
    kind: 'section',
    route: { tab: 'basic' },
    labelKey: 'settings.app.misc.title',
    searchable: false
  },
  {
    id: 'app.misc.log-level',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.misc',
    labelKey: 'settings.app.misc.logLevel.label',
    descriptionKey: 'settings.app.misc.logLevel.description'
  },
  {
    id: 'app.misc.http-proxy.strategy',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.misc',
    labelKey: 'settings.app.misc.httpProxy.strategy.label',
    descriptionKey: 'settings.app.misc.httpProxy.strategy.description'
  },
  {
    id: 'app.misc.http-proxy.host',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.misc',
    fallbackId: 'app.misc.http-proxy.strategy',
    labelKey: 'settings.app.misc.httpProxy.host.label',
    descriptionKey: 'settings.app.misc.httpProxy.host.description'
  },
  {
    id: 'app.misc.http-proxy.port',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.misc',
    fallbackId: 'app.misc.http-proxy.strategy',
    labelKey: 'settings.app.misc.httpProxy.port.label',
    descriptionKey: 'settings.app.misc.httpProxy.port.description'
  },
  {
    id: 'app.misc.disable-hardware-acceleration',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.misc',
    labelKey: 'settings.app.misc.disableHardwareAcceleration.label',
    descriptionKey: 'settings.app.misc.disableHardwareAcceleration.description'
  },
  {
    id: 'app.misc.uninstall',
    kind: 'row',
    route: { tab: 'basic' },
    parentId: 'app.misc',
    labelKey: 'settings.app.misc.uninstallApp.label',
    descriptionKey: 'settings.app.misc.uninstallApp.description'
  },
  {
    id: 'match-history',
    kind: 'section',
    route: { tab: 'player-tabs' },
    labelKey: 'settings.matchHistory.title',
    searchable: false
  },
  {
    id: 'match-history.refresh-after-game',
    kind: 'row',
    route: { tab: 'player-tabs' },
    parentId: 'match-history',
    labelKey: 'settings.matchHistory.refreshTabsAfterGameEnds.label',
    descriptionKey: 'settings.matchHistory.refreshTabsAfterGameEnds.description'
  },
  {
    id: 'match-history.load-count',
    kind: 'row',
    route: { tab: 'player-tabs' },
    parentId: 'match-history',
    labelKey: 'settings.matchHistory.loadCount.label',
    descriptionKey: 'settings.matchHistory.loadCount.description'
  },
  {
    id: 'ongoing-game.common',
    kind: 'section',
    route: { tab: 'ongoing-game' },
    labelKey: 'settings.ongoingGame.titleCommon',
    searchable: false
  },
  {
    id: 'ongoing-game.enabled',
    kind: 'row',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.enabled.label',
    descriptionKey: 'settings.ongoingGame.enabled.description'
  },
  {
    id: 'ongoing-game.auto-route',
    kind: 'row',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.autoRouteWhenGameStarts.label',
    descriptionKey: 'settings.ongoingGame.autoRouteWhenGameStarts.description'
  },
  {
    id: 'ongoing-game.match-history-load-count',
    kind: 'row',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.matchHistoryLoadCount.label',
    descriptionKey: 'settings.ongoingGame.matchHistoryLoadCount.description'
  },
  {
    id: 'ongoing-game.concurrency',
    kind: 'row',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.concurrency.label',
    descriptionKey: 'settings.ongoingGame.concurrency.description'
  },
  {
    id: 'ongoing-game.game-details-load-count',
    kind: 'row',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.gameDetailsLoadCount.label'
  },
  {
    id: 'ongoing-game.queue-filter',
    kind: 'row',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.matchHistoryTagPreference.label',
    descriptionKey: 'settings.ongoingGame.matchHistoryTagPreference.description'
  },
  {
    id: 'ongoing-game.query-in-lobby',
    kind: 'row',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.queryInLobbyPhase.label',
    descriptionKey: 'settings.ongoingGame.queryInLobbyPhase.description'
  },
  {
    id: 'ongoing-game.premade-threshold',
    kind: 'row',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.premadeTeamInferMatchCountThreshold.label',
    descriptionKey: 'settings.ongoingGame.premadeTeamInferMatchCountThreshold.description'
  },
  {
    id: 'ongoing-game.player-card',
    kind: 'section',
    route: { tab: 'ongoing-game' },
    labelKey: 'settings.ongoingGame.titlePlayerCard',
    searchable: false
  },
  {
    id: 'ongoing-game.player-card.champion-usage',
    kind: 'row',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.player-card',
    labelKey: 'settings.ongoingGame.showChampionUsage.label',
    descriptionKey: 'settings.ongoingGame.showChampionUsage.description'
  },
  {
    id: 'ongoing-game.player-card.match-border',
    kind: 'row',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.player-card',
    labelKey: 'settings.ongoingGame.showMatchHistoryItemBorder.label',
    descriptionKey: 'settings.ongoingGame.showMatchHistoryItemBorder.description'
  },
  {
    id: 'ongoing-game.player-card.jungle-pathing',
    kind: 'row',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.player-card',
    labelKey: 'settings.ongoingGame.showJunglePathing.label',
    descriptionKey: 'settings.ongoingGame.showJunglePathing.description'
  },
  {
    id: 'ongoing-game.player-card.tags',
    kind: 'row',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.player-card',
    labelKey: 'settings.ongoingGame.playerCardTags.label',
    descriptionKey: 'settings.ongoingGame.playerCardTags.description'
  },
  {
    id: 'multi-window.aux',
    kind: 'section',
    route: { tab: 'multi-window' },
    labelKey: 'settings.multiWindow.auxWindow.title',
    searchable: false
  },
  {
    id: 'multi-window.aux.enabled',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.aux',
    labelKey: 'settings.multiWindow.auxWindow.enabled.label',
    descriptionKey: 'settings.multiWindow.auxWindow.enabled.description'
  },
  {
    id: 'multi-window.aux.auto-show',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.aux',
    labelKey: 'settings.multiWindow.auxWindow.autoShow.label',
    descriptionKey: 'settings.multiWindow.auxWindow.autoShow.description'
  },
  {
    id: 'multi-window.aux.opacity',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.aux',
    labelKey: 'settings.multiWindow.auxWindow.opacity.label',
    descriptionKey: 'settings.multiWindow.auxWindow.opacity.description'
  },
  {
    id: 'multi-window.aux.skin-selector',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.aux',
    labelKey: 'settings.multiWindow.auxWindow.showSkinSelector.label',
    descriptionKey: 'settings.multiWindow.auxWindow.showSkinSelector.description'
  },
  {
    id: 'multi-window.aux.reset-position',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.aux',
    labelKey: 'settings.multiWindow.auxWindow.resetWindowPosition.label',
    descriptionKey: 'settings.multiWindow.auxWindow.resetWindowPosition.description'
  },
  {
    id: 'multi-window.opgg',
    kind: 'section',
    route: { tab: 'multi-window' },
    labelKey: 'settings.multiWindow.opggWindow.title',
    searchable: false
  },
  {
    id: 'multi-window.opgg.enabled',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.opgg',
    labelKey: 'settings.multiWindow.opggWindow.enabled.label',
    descriptionKey: 'settings.multiWindow.opggWindow.enabled.description'
  },
  {
    id: 'multi-window.opgg.auto-show',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.opgg',
    labelKey: 'settings.multiWindow.opggWindow.autoShow.label',
    descriptionKey: 'settings.multiWindow.opggWindow.autoShow.description'
  },
  {
    id: 'multi-window.opgg.shortcut',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.opgg',
    labelKey: 'settings.multiWindow.opggWindow.showShortcut.label',
    descriptionKey: 'settings.multiWindow.opggWindow.showShortcut.description'
  },
  {
    id: 'multi-window.opgg.opacity',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.opgg',
    labelKey: 'settings.multiWindow.opggWindow.opacity.label',
    descriptionKey: 'settings.multiWindow.opggWindow.opacity.description'
  },
  {
    id: 'multi-window.opgg.reset-position',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.opgg',
    labelKey: 'settings.multiWindow.opggWindow.resetWindowPosition.label',
    descriptionKey: 'settings.multiWindow.opggWindow.resetWindowPosition.description'
  },
  {
    id: 'multi-window.ongoing-game',
    kind: 'section',
    route: { tab: 'multi-window' },
    labelKey: 'settings.multiWindow.ongoingGameWindow.title',
    searchable: false
  },
  {
    id: 'multi-window.ongoing-game.enabled',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.ongoing-game',
    labelKey: 'settings.multiWindow.ongoingGameWindow.enabled.label',
    descriptionKey: 'settings.multiWindow.ongoingGameWindow.enabled.description'
  },
  {
    id: 'multi-window.ongoing-game.shortcut',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.ongoing-game',
    labelKey: 'settings.multiWindow.ongoingGameWindow.showShortcut.label',
    descriptionKey: 'settings.multiWindow.ongoingGameWindow.showShortcut.description'
  },
  {
    id: 'multi-window.cd-timer',
    kind: 'section',
    route: { tab: 'multi-window' },
    labelKey: 'settings.multiWindow.cdTimerWindow.title',
    searchable: false
  },
  {
    id: 'multi-window.cd-timer.enabled',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.cd-timer',
    labelKey: 'settings.multiWindow.cdTimerWindow.enabled.label',
    descriptionKey: 'settings.multiWindow.cdTimerWindow.enabled.description'
  },
  {
    id: 'multi-window.cd-timer.shortcut',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.cd-timer',
    labelKey: 'settings.multiWindow.cdTimerWindow.showShortcut.label',
    descriptionKey: 'settings.multiWindow.cdTimerWindow.showShortcut.description'
  },
  {
    id: 'multi-window.cd-timer.reset-position',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.cd-timer',
    labelKey: 'settings.multiWindow.cdTimerWindow.resetWindowPosition.label',
    descriptionKey: 'settings.multiWindow.cdTimerWindow.resetWindowPosition.description'
  },
  {
    id: 'multi-window.cd-timer.type',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.cd-timer',
    labelKey: 'settings.multiWindow.cdTimerWindow.timerType.label',
    descriptionKey: 'settings.multiWindow.cdTimerWindow.timerType.description'
  },
  {
    id: 'multi-window.cd-timer.reverse-adjustment',
    kind: 'row',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.cd-timer',
    labelKey: 'settings.multiWindow.cdTimerWindow.reverseAdjustmentDirection.label',
    descriptionKey: 'settings.multiWindow.cdTimerWindow.reverseAdjustmentDirection.description'
  },
  {
    id: 'misc.respawn-timer',
    kind: 'section',
    route: { tab: 'misc' },
    labelKey: 'settings.misc.respawnTimer.title',
    searchable: false
  },
  {
    id: 'misc.respawn-timer.enabled',
    kind: 'row',
    route: { tab: 'misc' },
    parentId: 'misc.respawn-timer',
    labelKey: 'settings.misc.respawnTimer.enabled.label',
    descriptionKey: 'settings.misc.respawnTimer.enabled.description'
  },
  {
    id: 'misc.streamer-mode',
    kind: 'section',
    route: { tab: 'misc' },
    labelKey: 'settings.misc.streamerMode.title',
    searchable: false
  },
  {
    id: 'misc.streamer-mode.enabled',
    kind: 'row',
    route: { tab: 'misc' },
    parentId: 'misc.streamer-mode',
    labelKey: 'settings.misc.streamerMode.streamerMode.label',
    descriptionKey: 'settings.misc.streamerMode.streamerMode.description'
  },
  {
    id: 'misc.streamer-mode.akari-name',
    kind: 'row',
    route: { tab: 'misc' },
    parentId: 'misc.streamer-mode',
    fallbackId: 'misc.streamer-mode.enabled',
    labelKey: 'settings.misc.streamerMode.useAkariStyledName.label',
    descriptionKey: 'settings.misc.streamerMode.useAkariStyledName.description'
  },
  {
    id: 'misc.streamer-mode.content-protection',
    kind: 'row',
    route: { tab: 'misc' },
    parentId: 'misc.streamer-mode',
    labelKey: 'settings.misc.streamerMode.contentProtection.label',
    descriptionKey: 'settings.misc.streamerMode.contentProtection.description'
  },
  {
    id: 'storage.saved-settings',
    kind: 'section',
    route: { tab: 'storage', subTab: 'settings' },
    labelKey: 'settings.savedSettings.title',
    searchable: false
  },
  {
    id: 'storage.saved-settings.export',
    kind: 'row',
    route: { tab: 'storage', subTab: 'settings' },
    parentId: 'storage.saved-settings',
    labelKey: 'settings.savedSettings.export.label',
    descriptionKey: 'settings.savedSettings.export.description'
  },
  {
    id: 'storage.saved-settings.import',
    kind: 'row',
    route: { tab: 'storage', subTab: 'settings' },
    parentId: 'storage.saved-settings',
    labelKey: 'settings.savedSettings.import.label',
    descriptionKey: 'settings.savedSettings.import.description'
  },
  {
    id: 'automation.gameflow.ready-check',
    kind: 'section',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.readyCheck',
    searchable: false
  },
  {
    id: 'automation.gameflow.ready-check.enabled',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.ready-check',
    labelKey: 'automation.gameflow.autoAcceptEnabled.label',
    descriptionKey: 'automation.gameflow.autoAcceptEnabled.description'
  },
  {
    id: 'automation.gameflow.ready-check.delay',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.ready-check',
    labelKey: 'automation.gameflow.autoAcceptDelaySeconds.label',
    descriptionKey: 'automation.gameflow.autoAcceptDelaySeconds.description'
  },
  {
    id: 'automation.gameflow.auto-honor',
    kind: 'section',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.autoHonor',
    searchable: false
  },
  {
    id: 'automation.gameflow.auto-honor.enabled',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-honor',
    labelKey: 'automation.gameflow.autoHonorEnabled.label',
    descriptionKey: 'automation.gameflow.autoHonorEnabled.description'
  },
  {
    id: 'automation.gameflow.play-again',
    kind: 'section',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.playAgain',
    searchable: false
  },
  {
    id: 'automation.gameflow.play-again.enabled',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.play-again',
    labelKey: 'automation.gameflow.playAgainEnabled.label',
    descriptionKey: 'automation.gameflow.playAgainEnabled.description.full'
  },
  {
    id: 'automation.gameflow.auto-matchmaking',
    kind: 'section',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.autoMatchmaking',
    searchable: false
  },
  {
    id: 'automation.gameflow.auto-matchmaking.enabled',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-matchmaking',
    labelKey: 'automation.gameflow.autoMatchmakingEnabled.label',
    descriptionKey: 'automation.gameflow.autoMatchmakingEnabled.description'
  },
  {
    id: 'automation.gameflow.auto-matchmaking.minimum-members',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-matchmaking',
    labelKey: 'automation.gameflow.autoMatchmakingMinimumMembers.label',
    descriptionKey: 'automation.gameflow.autoMatchmakingMinimumMembers.description'
  },
  {
    id: 'automation.gameflow.auto-matchmaking.delay',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-matchmaking',
    labelKey: 'automation.gameflow.autoMatchmakingDelaySeconds.label',
    descriptionKey: 'automation.gameflow.autoMatchmakingDelaySeconds.description'
  },
  {
    id: 'automation.gameflow.auto-matchmaking.wait-for-invitees',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-matchmaking',
    labelKey: 'automation.gameflow.autoMatchmakingWaitForInvitees.label',
    descriptionKey: 'automation.gameflow.autoMatchmakingWaitForInvitees.description'
  },
  {
    id: 'automation.gameflow.auto-matchmaking.rematch-strategy',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-matchmaking',
    labelKey: 'automation.gameflow.autoMatchmakingRematchStrategy.label',
    descriptionKey: 'automation.gameflow.autoMatchmakingRematchStrategy.description'
  },
  {
    id: 'automation.gameflow.auto-matchmaking.rematch-fixed-duration',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-matchmaking',
    labelKey: 'automation.gameflow.autoMatchmakingRematchFixedDuration.label',
    descriptionKey:
      'automation.gameflow.autoMatchmakingRematchFixedDuration.description.fixed-duration'
  },
  {
    id: 'automation.gameflow.auto-reconnect',
    kind: 'section',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.autoReconnect',
    searchable: false
  },
  {
    id: 'automation.gameflow.auto-reconnect.enabled',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-reconnect',
    labelKey: 'automation.gameflow.autoReconnectEnabled.label',
    descriptionKey: 'automation.gameflow.autoReconnectEnabled.description'
  },
  {
    id: 'automation.gameflow.leader',
    kind: 'section',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.leader',
    searchable: false
  },
  {
    id: 'automation.gameflow.leader.enabled',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.leader',
    labelKey: 'automation.gameflow.autoSkipLeaderEnabled.label',
    descriptionKey: 'automation.gameflow.autoSkipLeaderEnabled.description'
  },
  {
    id: 'automation.gameflow.invitations',
    kind: 'section',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.invitations',
    searchable: false
  },
  {
    id: 'automation.gameflow.invitations.enabled',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.invitations',
    labelKey: 'automation.gameflow.autoHandleInvitationsEnabled.label',
    descriptionKey: 'automation.gameflow.autoHandleInvitationsEnabled.description'
  },
  {
    id: 'automation.gameflow.invitations.reject-when-away',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.invitations',
    labelKey: 'automation.gameflow.rejectInvitationWhenAway.label',
    descriptionKey: 'automation.gameflow.rejectInvitationWhenAway.description'
  },
  {
    id: 'automation.gameflow.invitations.strategies',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.invitations',
    labelKey: 'automation.gameflow.invitationHandlingStrategies.label',
    descriptionKey: 'automation.gameflow.invitationHandlingStrategies.description'
  },
  {
    id: 'automation.gameflow.aram-team-side',
    kind: 'section',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.aramTeamSide',
    searchable: false
  },
  {
    id: 'automation.gameflow.aram-team-side.enabled',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.aram-team-side',
    labelKey: 'automation.gameflow.autoSendARAMTeamSideEnabled.label',
    descriptionKey: 'automation.gameflow.autoSendARAMTeamSideEnabled.description'
  },
  {
    id: 'automation.gameflow.aram-team-side.visible-to-team',
    kind: 'row',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.aram-team-side',
    fallbackId: 'automation.gameflow.aram-team-side.enabled',
    labelKey: 'automation.gameflow.autoSendARAMTeamSideVisibleToTeam.label',
    descriptionKey: 'automation.gameflow.autoSendARAMTeamSideVisibleToTeam.description'
  },
  {
    id: 'automation.champ-select',
    kind: 'section',
    route: { name: 'automation', section: 'auto-select' },
    labelKey: 'automation.champSelect.title',
    searchable: false
  },
  {
    id: 'automation.champ-select.pick',
    kind: 'section',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.title',
    searchable: false
  },
  {
    id: 'automation.champ-select.pick.enabled',
    kind: 'row',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.enabled.label',
    descriptionKey: 'automation.champSelect.pick.enabled.description'
  },
  {
    id: 'automation.champ-select.pick.expected-champions',
    kind: 'row',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.expectedChampions.label',
    descriptionKey: 'automation.champSelect.pick.expectedChampions.description'
  },
  {
    id: 'automation.champ-select.pick.show-intent',
    kind: 'row',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.showIntent.label',
    descriptionKey: 'automation.champSelect.pick.showIntent.description'
  },
  {
    id: 'automation.champ-select.pick.ignore-intent',
    kind: 'row',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.ignoreIntent.label',
    descriptionKey: 'automation.champSelect.pick.ignoreIntent.description'
  },
  {
    id: 'automation.champ-select.pick.strategy',
    kind: 'row',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.strategy.label',
    descriptionKey: 'automation.champSelect.pick.strategy.description'
  },
  {
    id: 'automation.champ-select.pick.delay',
    kind: 'row',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.delaySeconds.label',
    descriptionKey: 'automation.champSelect.pick.delaySeconds.description'
  },
  {
    id: 'automation.champ-select.pick.bench-swap-delay',
    kind: 'row',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.benchSwapAccumulatedDelaySeconds.label',
    descriptionKey: 'automation.champSelect.pick.benchSwapAccumulatedDelaySeconds.description'
  },
  {
    id: 'automation.champ-select.pick.bench-first',
    kind: 'row',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.benchSelectFirstAvailableChampion.label',
    descriptionKey: 'automation.champSelect.pick.benchSelectFirstAvailableChampion.description'
  },
  {
    id: 'automation.champ-select.pick.bench-handle-trade',
    kind: 'row',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.benchHandleTradeEnabled.label',
    descriptionKey: 'automation.champSelect.pick.benchHandleTradeEnabled.description'
  },
  {
    id: 'automation.champ-select.ban',
    kind: 'section',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.ban.title',
    searchable: false
  },
  {
    id: 'automation.champ-select.ban.enabled',
    kind: 'row',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.ban',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.ban.enabled.label',
    descriptionKey: 'automation.champSelect.ban.enabled.description'
  },
  {
    id: 'automation.champ-select.ban.expected-champions',
    kind: 'row',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.ban',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.ban.expectedChampions.label',
    descriptionKey: 'automation.champSelect.ban.expectedChampions.description'
  },
  {
    id: 'automation.champ-select.ban.strategy',
    kind: 'row',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.ban',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.ban.strategy.label',
    descriptionKey: 'automation.champSelect.ban.strategy.description'
  },
  {
    id: 'automation.champ-select.ban.delay',
    kind: 'row',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.ban',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.ban.delaySeconds.label',
    descriptionKey: 'automation.champSelect.ban.delaySeconds.description'
  },
  {
    id: 'automation.champ-config',
    kind: 'section',
    route: { name: 'automation', section: 'auto-champ-config' },
    labelKey: 'automation.champConfig.title',
    searchable: false
  },
  {
    id: 'automation.champ-config.enabled',
    kind: 'row',
    route: { name: 'automation', section: 'auto-champ-config' },
    parentId: 'automation.champ-config',
    labelKey: 'automation.champConfig.enabled.label',
    descriptionKey: 'automation.champConfig.enabled.description'
  },
  {
    id: 'automation.champ-config.configure',
    kind: 'row',
    route: { name: 'automation', section: 'auto-champ-config' },
    parentId: 'automation.champ-config',
    labelKey: 'automation.champConfig.configure.label'
  },
  {
    id: 'automation.misc.auto-reply',
    kind: 'section',
    route: { name: 'automation', section: 'misc' },
    labelKey: 'automation.misc.autoReply.title',
    searchable: false
  },
  {
    id: 'automation.misc.auto-reply.enabled',
    kind: 'row',
    route: { name: 'automation', section: 'misc' },
    parentId: 'automation.misc.auto-reply',
    labelKey: 'automation.misc.autoReply.enabled.label'
  },
  {
    id: 'automation.misc.auto-reply.enable-on-away',
    kind: 'row',
    route: { name: 'automation', section: 'misc' },
    parentId: 'automation.misc.auto-reply',
    fallbackId: 'automation.misc.auto-reply.enabled',
    labelKey: 'automation.misc.autoReply.enableOnAway.label',
    descriptionKey: 'automation.misc.autoReply.enableOnAway.description'
  },
  {
    id: 'automation.misc.auto-reply.text',
    kind: 'row',
    route: { name: 'automation', section: 'misc' },
    parentId: 'automation.misc.auto-reply',
    labelKey: 'automation.misc.autoReply.text.label',
    descriptionKey: 'automation.misc.autoReply.text.description'
  },
  {
    id: 'automation.misc.auto-invitation',
    kind: 'section',
    route: { name: 'automation', section: 'misc' },
    labelKey: 'automation.misc.autoInvitation.title',
    descriptionKey: 'automation.misc.autoInvitation.description'
  },
  {
    id: 'toolkit.client.game-client',
    kind: 'section',
    route: { name: 'toolkit', section: 'client' },
    labelKey: 'toolkit.client.gameClient.title',
    searchable: false
  },
  {
    id: 'toolkit.client.game-client.terminate-shortcut-enabled',
    kind: 'row',
    route: { name: 'toolkit', section: 'client' },
    parentId: 'toolkit.client.game-client',
    labelKey: 'toolkit.client.gameClient.terminateGameClientWithShortcut.label',
    descriptionKey: 'toolkit.client.gameClient.terminateGameClientWithShortcut.description'
  },
  {
    id: 'toolkit.client.game-client.terminate-shortcut',
    kind: 'row',
    route: { name: 'toolkit', section: 'client' },
    parentId: 'toolkit.client.game-client',
    labelKey: 'toolkit.client.gameClient.terminateShortcut.label',
    descriptionKey: 'toolkit.client.gameClient.terminateShortcut.description'
  },
  {
    id: 'toolkit.client.game-client.settings-file-mode',
    kind: 'row',
    route: { name: 'toolkit', section: 'client' },
    parentId: 'toolkit.client.game-client',
    labelKey: 'toolkit.client.gameClient.settingsFileMode.label',
    descriptionKey: 'toolkit.client.gameClient.settingsFileMode.description'
  },
  {
    id: 'toolkit.in-game-send.presets',
    kind: 'section',
    route: { name: 'toolkit', section: 'in-game-send' },
    labelKey: 'toolkit.inGameSend.presets.title',
    keywordKeys: [
      'toolkit.inGameSend.presets.rating.label',
      'toolkit.inGameSend.presets.jungle.label',
      'toolkit.inGameSend.presets.premade.label',
      'toolkit.inGameSend.presets.fixedText.label',
      'toolkit.inGameSend.presets.nameDisplayStrategy.title',
      'toolkit.inGameSend.presets.rating.displayOptions.winRate.label',
      'toolkit.inGameSend.presets.rating.displayOptions.kda.label',
      'toolkit.inGameSend.presets.rating.displayOptions.avgSoloKills.label',
      'toolkit.inGameSend.presets.rating.displayOptions.avgVisionScore.label',
      'toolkit.inGameSend.presets.rating.displayOptions.avgChampionDamage.label',
      'toolkit.inGameSend.presets.rating.displayOptions.avgDamageTaken.label',
      'toolkit.inGameSend.presets.rating.displayOptions.avgGold.label',
      'toolkit.inGameSend.presets.rating.displayOptions.avgCsPerMinute.label',
      'toolkit.inGameSend.presets.rating.displayOptions.avgKillParticipation.label',
      'toolkit.inGameSend.presets.rating.displayOptions.avgDamageGoldEfficiency.label',
      'toolkit.inGameSend.presets.rating.displayOptions.mainChampions.label',
      'toolkit.inGameSend.presets.rating.displayOptions.mainPositions.label',
      'toolkit.inGameSend.presets.jungle.displayOptions.activityPreference.label',
      'toolkit.inGameSend.presets.jungle.displayOptions.firstClearDistribution.label',
      'toolkit.inGameSend.presets.jungle.displayOptions.earlyGank.label',
      'toolkit.inGameSend.presets.jungle.displayOptions.dragonControl.label',
      'toolkit.inGameSend.presets.jungle.displayOptions.monsterControl.label',
      'toolkit.inGameSend.presets.fixedText.shortcutLabel'
    ]
  },
  {
    id: 'toolkit.in-game-send.settings',
    kind: 'section',
    route: { name: 'toolkit', section: 'in-game-send' },
    labelKey: 'toolkit.inGameSend.settings.title',
    searchable: false
  },
  {
    id: 'toolkit.in-game-send.settings.cancel-shortcut',
    kind: 'row',
    route: { name: 'toolkit', section: 'in-game-send' },
    parentId: 'toolkit.in-game-send.settings',
    labelKey: 'toolkit.inGameSend.settings.cancelShortcut.label',
    descriptionKey: 'toolkit.inGameSend.settings.cancelShortcut.description'
  },
  {
    id: 'toolkit.in-game-send.settings.send-interval',
    kind: 'row',
    route: { name: 'toolkit', section: 'in-game-send' },
    parentId: 'toolkit.in-game-send.settings',
    labelKey: 'toolkit.inGameSend.settings.sendInterval.label',
    descriptionKey: 'toolkit.inGameSend.settings.sendInterval.description'
  },
  {
    id: 'toolkit.misc.chat-availability',
    kind: 'section',
    route: { name: 'toolkit', section: 'misc' },
    labelKey: 'toolkit.chatAvailability.title',
    searchable: false
  },
  {
    id: 'toolkit.misc.chat-availability.lock-offline',
    kind: 'row',
    route: { name: 'toolkit', section: 'misc' },
    parentId: 'toolkit.misc.chat-availability',
    labelKey: 'toolkit.chatAvailability.lockOfflineStatus.label',
    descriptionKey: 'toolkit.chatAvailability.lockOfflineStatus.description'
  },
  {
    id: 'toolkit.misc.chat-status-message',
    kind: 'section',
    route: { name: 'toolkit', section: 'misc' },
    labelKey: 'toolkit.chatStatusMessage.title',
    searchable: false
  },
  {
    id: 'toolkit.misc.chat-status-message.text',
    kind: 'row',
    route: { name: 'toolkit', section: 'misc' },
    parentId: 'toolkit.misc.chat-status-message',
    labelKey: 'toolkit.chatStatusMessage.text.label',
    descriptionKey: 'toolkit.chatStatusMessage.text.description'
  },
  {
    id: 'toolkit.misc.chat-status-message.reset-on-login',
    kind: 'row',
    route: { name: 'toolkit', section: 'misc' },
    parentId: 'toolkit.misc.chat-status-message',
    fallbackId: 'toolkit.misc.chat-status-message.text',
    labelKey: 'toolkit.chatStatusMessage.resetOnLogin.label',
    descriptionKey: 'toolkit.chatStatusMessage.resetOnLogin.description'
  },
  {
    id: 'toolkit.misc.fake-ranked',
    kind: 'section',
    route: { name: 'toolkit', section: 'misc' },
    labelKey: 'toolkit.fakeRanked.title',
    searchable: false
  },
  {
    id: 'toolkit.misc.fake-ranked.status',
    kind: 'row',
    route: { name: 'toolkit', section: 'misc' },
    parentId: 'toolkit.misc.fake-ranked',
    labelKey: 'toolkit.fakeRanked.set.label',
    descriptionKey: 'toolkit.fakeRanked.set.description'
  },
  {
    id: 'toolkit.misc.fake-ranked.reset-on-login',
    kind: 'row',
    route: { name: 'toolkit', section: 'misc' },
    parentId: 'toolkit.misc.fake-ranked',
    fallbackId: 'toolkit.misc.fake-ranked.status',
    labelKey: 'toolkit.fakeRanked.resetOnLogin.label',
    descriptionKey: 'toolkit.fakeRanked.resetOnLogin.description'
  },
  {
    id: 'debug.files',
    kind: 'section',
    route: { tab: 'debug' },
    labelKey: 'settings.debug.files.title',
    searchable: false
  },
  {
    id: 'debug.files.logs',
    kind: 'row',
    route: { tab: 'debug' },
    parentId: 'debug.files',
    labelKey: 'settings.debug.files.logs.label',
    descriptionKey: 'settings.debug.files.logs.description'
  },
  {
    id: 'debug.files.app-data',
    kind: 'row',
    route: { tab: 'debug' },
    parentId: 'debug.files',
    labelKey: 'settings.debug.files.appData.label'
  },
  {
    id: 'debug.test-page',
    kind: 'row',
    route: { tab: 'debug' },
    labelKey: 'settings.debug.testPage.label',
    descriptionKey: 'settings.debug.testPage.description'
  }
] as const satisfies readonly SettingsNavigationTargetDefinition[]

export type SettingsNavigationTargetId = (typeof targetDefinitions)[number]['id']

export function createSettingsNavigationRegistry(
  definitions: readonly SettingsNavigationTargetDefinition[]
) {
  const registry = new Map<string, SettingsNavigationTargetDefinition>()

  for (const target of definitions) {
    if (registry.has(target.id)) {
      throw new Error(`Duplicate settings navigation target: ${target.id}`)
    }

    registry.set(target.id, target)
  }

  for (const target of definitions) {
    for (const linkedId of [target.parentId, target.fallbackId]) {
      if (linkedId && !registry.has(linkedId)) {
        throw new Error(`Unknown settings navigation target ${linkedId} referenced by ${target.id}`)
      }
    }
  }

  for (const target of definitions) {
    const fallbackPath = new Set<string>()
    let currentTarget: SettingsNavigationTargetDefinition | undefined = target

    while (currentTarget?.fallbackId) {
      if (fallbackPath.has(currentTarget.id)) {
        throw new Error(`Settings navigation fallback cycle detected from ${target.id}`)
      }

      fallbackPath.add(currentTarget.id)
      currentTarget = registry.get(currentTarget.fallbackId)
    }
  }

  return registry as ReadonlyMap<string, SettingsNavigationTargetDefinition>
}

export const settingsNavigationTargets: readonly SettingsNavigationTargetDefinition[] =
  targetDefinitions
export const searchableSettingsNavigationTargets = settingsNavigationTargets.filter(
  (target) => target.searchable !== false
)
export const settingsNavigationRegistry = createSettingsNavigationRegistry(targetDefinitions)

export function getSettingsNavigationTarget(id: string) {
  return settingsNavigationRegistry.get(id)
}

export function isSettingsNavigationTargetId(id: string): id is SettingsNavigationTargetId {
  return settingsNavigationRegistry.has(id)
}

export function isSettingsTabName(value: unknown): value is SettingsTabName {
  return typeof value === 'string' && Object.hasOwn(SETTINGS_TAB_LABEL_KEYS, value)
}

export function isStorageSettingsTabName(value: unknown): value is StorageSettingsTabName {
  return typeof value === 'string' && Object.hasOwn(STORAGE_SETTINGS_TAB_LABEL_KEYS, value)
}

function getAutoSelectDestination(targetId: string): AutoSelectNavigationDestination | undefined {
  if (
    targetId === 'automation.champ-select.pick' ||
    targetId.startsWith('automation.champ-select.pick.')
  ) {
    return 'pick'
  }
  if (
    targetId === 'automation.champ-select.ban' ||
    targetId.startsWith('automation.champ-select.ban.')
  ) {
    return 'ban'
  }

  return undefined
}

function createNavigationStep(
  scope: string,
  destination: unknown,
  waitForRegistration = true
): Readonly<AkariNavigationStep> {
  return Object.freeze({ scope, destination, waitForRegistration })
}

export function createSettingsNavigationPath(
  target: SettingsNavigationTargetDefinition
): AkariNavigationPath {
  const path: Readonly<AkariNavigationStep>[] = []

  if ('tab' in target.route) {
    path.push(
      createNavigationStep(MAIN_WINDOW_NAVIGATION_SCOPE, {
        surface: 'settings-modal'
      } satisfies MainWindowNavigationDestination),
      createNavigationStep(SETTINGS_MODAL_NAVIGATION_SCOPE, target.route.tab)
    )

    if (target.route.tab === 'storage') {
      path.push(createNavigationStep(STORAGE_SETTINGS_NAVIGATION_SCOPE, target.route.subTab))
    }
  } else {
    path.push(
      createNavigationStep(MAIN_WINDOW_NAVIGATION_SCOPE, {
        surface: 'route',
        route: target.route
      } satisfies MainWindowNavigationDestination),
      createNavigationStep(`main-page.${target.route.name}`, target.route.section)
    )

    if (target.route.name === 'automation' && target.route.section === 'auto-select') {
      const autoSelectDestination = getAutoSelectDestination(target.id)
      if (autoSelectDestination) {
        path.push(createNavigationStep(AUTO_SELECT_NAVIGATION_SCOPE, autoSelectDestination))
      }
    }
  }

  path.push(createNavigationStep(SETTINGS_NAVIGATION_TARGET_SCOPE, target.id, false))
  return Object.freeze(path)
}
