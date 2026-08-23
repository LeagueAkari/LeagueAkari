import type {
  AkariNavigationPath,
  AkariNavigationStep
} from '@renderer-shared/shards/akari-navigation'

import {
  APP_SETTINGS_NAVIGATION_STEP_KEY,
  type AppSettingsNavigationPayload,
  MISC_SETTINGS_NAVIGATION_STEP_KEY,
  type MiscSettingsNavigationPayload,
  SETTINGS_MODAL_NAVIGATION_STEP_KEY,
  type SettingsTabName
} from '@main-window/components/settings-modal/navigation'
import {
  STORAGE_SETTINGS_NAVIGATION_STEP_KEY,
  type StorageSettingsTabName
} from '@main-window/components/settings-modal/storage-settings/navigation'
import {
  MAIN_WINDOW_NAVIGATION_STEP_KEY,
  type MainWindowNavigationPayload,
  createMainPageNavigationStepKey
} from '@main-window/navigation-steps'
import {
  AUTO_SELECT_NAVIGATION_STEP_KEY,
  type AutoSelectNavigationPayload
} from '@main-window/views/automation/auto-select-navigation'

import { createSettingsNavigationTargetStepKey } from './useSettingsNavigationTarget'

export const SETTINGS_TAB_LABEL_KEYS = {
  basic: 'settings.app.title',
  'player-tabs': 'settings.matchHistory.title',
  'ongoing-game': 'settings.ongoingGame.title',
  'multi-window': 'settings.multiWindow.title',
  storage: 'settings.storage.title',
  misc: 'settings.misc.title',
  debug: 'settings.debug.title',
  about: 'settings.about.title'
} as const satisfies Readonly<Record<SettingsTabName, string>>

export const STORAGE_SETTINGS_TAB_LABEL_KEYS = {
  'tagged-players': 'settings.storage.tabs.tagged-players',
  settings: 'settings.storage.tabs.settings'
} as const satisfies Readonly<Record<StorageSettingsTabName, string>>

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

export interface SettingsNavigationTargetDefinition {
  id: string
  route: SettingsNavigationRoute
  labelKey: string
  descriptionKey?: string
  keywordKeys?: readonly string[]
  parentId?: string
  fallbackId?: string
  prepareStep?: Readonly<AkariNavigationStep>
  terminalId?: string
  searchable?: boolean
}

const targetDefinitions = [
  {
    id: 'app.basic',
    route: { tab: 'basic' },
    labelKey: 'settings.app.basic.title',
    searchable: false
  },
  {
    id: 'app.basic.close-action',
    route: { tab: 'basic' },
    parentId: 'app.basic',
    labelKey: 'settings.app.basic.mainWindowCloseAction.label',
    descriptionKey: 'settings.app.basic.mainWindowCloseAction.description'
  },
  {
    id: 'app.basic.locale',
    route: { tab: 'basic' },
    parentId: 'app.basic',
    labelKey: 'settings.app.basic.locale.label',
    descriptionKey: 'settings.app.basic.locale.description'
  },
  {
    id: 'app.basic.preferred-lol-source',
    route: { tab: 'basic' },
    parentId: 'app.basic',
    labelKey: 'settings.app.basic.preferredLolSource.label',
    descriptionKey: 'settings.app.basic.preferredLolSource.description'
  },
  {
    id: 'app.basic.theme',
    route: { tab: 'basic' },
    parentId: 'app.basic',
    labelKey: 'settings.app.basic.theme.label',
    descriptionKey: 'settings.app.basic.theme.description'
  },
  {
    id: 'app.self-update',
    route: { tab: 'basic' },
    labelKey: 'settings.app.selfUpdate.title',
    searchable: false
  },
  {
    id: 'app.self-update.auto-check',
    route: { tab: 'basic' },
    parentId: 'app.self-update',
    labelKey: 'settings.app.selfUpdate.autoCheckUpdates.label',
    descriptionKey: 'settings.app.selfUpdate.autoCheckUpdates.description'
  },
  {
    id: 'app.self-update.auto-download',
    route: { tab: 'basic' },
    parentId: 'app.self-update',
    labelKey: 'settings.app.selfUpdate.autoDownloadUpdates.label',
    descriptionKey: 'settings.app.selfUpdate.autoDownloadUpdates.description'
  },
  {
    id: 'app.self-update.check',
    route: { tab: 'basic' },
    parentId: 'app.self-update',
    labelKey: 'settings.app.selfUpdate.checkUpdates'
  },
  {
    id: 'app.main-window-ui',
    route: { tab: 'basic' },
    labelKey: 'settings.app.mainWindowUi.title',
    searchable: false
  },
  {
    id: 'app.main-window-ui.background',
    route: { tab: 'basic' },
    parentId: 'app.main-window-ui',
    labelKey: 'settings.app.mainWindowUi.background.label',
    descriptionKey: 'settings.app.mainWindowUi.background.description'
  },
  {
    id: 'app.main-window-ui.custom-background',
    route: { tab: 'basic' },
    parentId: 'app.main-window-ui',
    fallbackId: 'app.main-window-ui.background',
    labelKey: 'settings.app.mainWindowUi.customBackground.label',
    descriptionKey: 'settings.app.mainWindowUi.customBackground.description',
    searchable: false
  },
  {
    id: 'app.lcu-connection',
    route: { tab: 'basic' },
    labelKey: 'settings.app.lcConnection.title',
    searchable: false
  },
  {
    id: 'app.lcu-connection.auto-connect',
    route: { tab: 'basic' },
    parentId: 'app.lcu-connection',
    labelKey: 'settings.app.lcConnection.autoConnect.label',
    descriptionKey: 'settings.app.lcConnection.autoConnect.description'
  },
  {
    id: 'app.lcu-connection.use-wmi',
    route: { tab: 'basic' },
    parentId: 'app.lcu-connection',
    fallbackId: 'app.lcu-connection.auto-connect',
    prepareStep: {
      key: APP_SETTINGS_NAVIGATION_STEP_KEY,
      payload: 'windows-only' satisfies AppSettingsNavigationPayload
    },
    labelKey: 'settings.app.lcConnection.useWmi.label',
    descriptionKey: 'settings.app.lcConnection.useWmi.description'
  },
  {
    id: 'app.lcu-connection.rebuild-wmi',
    route: { tab: 'basic' },
    parentId: 'app.lcu-connection',
    fallbackId: 'app.lcu-connection.auto-connect',
    prepareStep: {
      key: APP_SETTINGS_NAVIGATION_STEP_KEY,
      payload: 'windows-only' satisfies AppSettingsNavigationPayload
    },
    labelKey: 'settings.app.lcConnection.rebuildWmi.label',
    descriptionKey: 'settings.app.lcConnection.rebuildWmi.description'
  },
  {
    id: 'app.misc',
    route: { tab: 'basic' },
    labelKey: 'settings.app.misc.title',
    searchable: false
  },
  {
    id: 'app.misc.log-level',
    route: { tab: 'basic' },
    parentId: 'app.misc',
    labelKey: 'settings.app.misc.logLevel.label',
    descriptionKey: 'settings.app.misc.logLevel.description'
  },
  {
    id: 'app.misc.http-proxy.strategy',
    route: { tab: 'basic' },
    parentId: 'app.misc',
    labelKey: 'settings.app.misc.httpProxy.strategy.label',
    descriptionKey: 'settings.app.misc.httpProxy.strategy.description'
  },
  {
    id: 'app.misc.http-proxy.host',
    route: { tab: 'basic' },
    parentId: 'app.misc',
    fallbackId: 'app.misc.http-proxy.strategy',
    prepareStep: {
      key: APP_SETTINGS_NAVIGATION_STEP_KEY,
      payload: 'forced-http-proxy' satisfies AppSettingsNavigationPayload
    },
    labelKey: 'settings.app.misc.httpProxy.host.label',
    descriptionKey: 'settings.app.misc.httpProxy.host.description'
  },
  {
    id: 'app.misc.http-proxy.port',
    route: { tab: 'basic' },
    parentId: 'app.misc',
    fallbackId: 'app.misc.http-proxy.strategy',
    prepareStep: {
      key: APP_SETTINGS_NAVIGATION_STEP_KEY,
      payload: 'forced-http-proxy' satisfies AppSettingsNavigationPayload
    },
    labelKey: 'settings.app.misc.httpProxy.port.label',
    descriptionKey: 'settings.app.misc.httpProxy.port.description'
  },
  {
    id: 'app.misc.disable-hardware-acceleration',
    route: { tab: 'basic' },
    parentId: 'app.misc',
    labelKey: 'settings.app.misc.disableHardwareAcceleration.label',
    descriptionKey: 'settings.app.misc.disableHardwareAcceleration.description'
  },
  {
    id: 'app.misc.uninstall',
    route: { tab: 'basic' },
    parentId: 'app.misc',
    labelKey: 'settings.app.misc.uninstallApp.label',
    descriptionKey: 'settings.app.misc.uninstallApp.description'
  },
  {
    id: 'match-history',
    route: { tab: 'player-tabs' },
    labelKey: 'settings.matchHistory.title',
    searchable: false
  },
  {
    id: 'match-history.refresh-after-game',
    route: { tab: 'player-tabs' },
    parentId: 'match-history',
    labelKey: 'settings.matchHistory.refreshTabsAfterGameEnds.label',
    descriptionKey: 'settings.matchHistory.refreshTabsAfterGameEnds.description'
  },
  {
    id: 'match-history.load-count',
    route: { tab: 'player-tabs' },
    parentId: 'match-history',
    labelKey: 'settings.matchHistory.loadCount.label',
    descriptionKey: 'settings.matchHistory.loadCount.description'
  },
  {
    id: 'ongoing-game.common',
    route: { tab: 'ongoing-game' },
    labelKey: 'settings.ongoingGame.titleCommon',
    searchable: false
  },
  {
    id: 'ongoing-game.enabled',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.enabled.label',
    descriptionKey: 'settings.ongoingGame.enabled.description'
  },
  {
    id: 'ongoing-game.auto-route',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.autoRouteWhenGameStarts.label',
    descriptionKey: 'settings.ongoingGame.autoRouteWhenGameStarts.description'
  },
  {
    id: 'ongoing-game.match-history-load-count',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.matchHistoryLoadCount.label',
    descriptionKey: 'settings.ongoingGame.matchHistoryLoadCount.description'
  },
  {
    id: 'ongoing-game.concurrency',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.concurrency.label',
    descriptionKey: 'settings.ongoingGame.concurrency.description'
  },
  {
    id: 'ongoing-game.game-details-load-count',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.gameDetailsLoadCount.label'
  },
  {
    id: 'ongoing-game.queue-filter',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.matchHistoryTagPreference.label',
    descriptionKey: 'settings.ongoingGame.matchHistoryTagPreference.description'
  },
  {
    id: 'ongoing-game.query-in-lobby',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.queryInLobbyPhase.label',
    descriptionKey: 'settings.ongoingGame.queryInLobbyPhase.description'
  },
  {
    id: 'ongoing-game.premade-threshold',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.common',
    labelKey: 'settings.ongoingGame.premadeTeamInferMatchCountThreshold.label',
    descriptionKey: 'settings.ongoingGame.premadeTeamInferMatchCountThreshold.description'
  },
  {
    id: 'ongoing-game.player-card',
    route: { tab: 'ongoing-game' },
    labelKey: 'settings.ongoingGame.titlePlayerCard',
    searchable: false
  },
  {
    id: 'ongoing-game.player-card.champion-usage',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.player-card',
    labelKey: 'settings.ongoingGame.showChampionUsage.label',
    descriptionKey: 'settings.ongoingGame.showChampionUsage.description'
  },
  {
    id: 'ongoing-game.player-card.match-border',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.player-card',
    labelKey: 'settings.ongoingGame.showMatchHistoryItemBorder.label',
    descriptionKey: 'settings.ongoingGame.showMatchHistoryItemBorder.description'
  },
  {
    id: 'ongoing-game.player-card.jungle-pathing',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.player-card',
    labelKey: 'settings.ongoingGame.showJunglePathing.label',
    descriptionKey: 'settings.ongoingGame.showJunglePathing.description'
  },
  {
    id: 'ongoing-game.player-card.tags',
    route: { tab: 'ongoing-game' },
    parentId: 'ongoing-game.player-card',
    labelKey: 'settings.ongoingGame.playerCardTags.label',
    descriptionKey: 'settings.ongoingGame.playerCardTags.description'
  },
  {
    id: 'multi-window.aux',
    route: { tab: 'multi-window' },
    labelKey: 'settings.multiWindow.auxWindow.title',
    searchable: false
  },
  {
    id: 'multi-window.aux.enabled',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.aux',
    labelKey: 'settings.multiWindow.auxWindow.enabled.label',
    descriptionKey: 'settings.multiWindow.auxWindow.enabled.description'
  },
  {
    id: 'multi-window.aux.auto-show',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.aux',
    labelKey: 'settings.multiWindow.auxWindow.autoShow.label',
    descriptionKey: 'settings.multiWindow.auxWindow.autoShow.description'
  },
  {
    id: 'multi-window.aux.opacity',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.aux',
    labelKey: 'settings.multiWindow.auxWindow.opacity.label',
    descriptionKey: 'settings.multiWindow.auxWindow.opacity.description'
  },
  {
    id: 'multi-window.aux.reset-position',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.aux',
    labelKey: 'settings.multiWindow.auxWindow.resetWindowPosition.label',
    descriptionKey: 'settings.multiWindow.auxWindow.resetWindowPosition.description'
  },
  {
    id: 'multi-window.opgg',
    route: { tab: 'multi-window' },
    labelKey: 'settings.multiWindow.opggWindow.title',
    searchable: false
  },
  {
    id: 'multi-window.opgg.enabled',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.opgg',
    labelKey: 'settings.multiWindow.opggWindow.enabled.label',
    descriptionKey: 'settings.multiWindow.opggWindow.enabled.description'
  },
  {
    id: 'multi-window.opgg.auto-show',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.opgg',
    labelKey: 'settings.multiWindow.opggWindow.autoShow.label',
    descriptionKey: 'settings.multiWindow.opggWindow.autoShow.description'
  },
  {
    id: 'multi-window.opgg.shortcut',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.opgg',
    labelKey: 'settings.multiWindow.opggWindow.showShortcut.label',
    descriptionKey: 'settings.multiWindow.opggWindow.showShortcut.description'
  },
  {
    id: 'multi-window.opgg.opacity',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.opgg',
    labelKey: 'settings.multiWindow.opggWindow.opacity.label',
    descriptionKey: 'settings.multiWindow.opggWindow.opacity.description'
  },
  {
    id: 'multi-window.opgg.skin-selector',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.opgg',
    labelKey: 'settings.multiWindow.opggWindow.showSkinSelector.label',
    descriptionKey: 'settings.multiWindow.opggWindow.showSkinSelector.description'
  },
  {
    id: 'multi-window.opgg.reset-position',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.opgg',
    labelKey: 'settings.multiWindow.opggWindow.resetWindowPosition.label',
    descriptionKey: 'settings.multiWindow.opggWindow.resetWindowPosition.description'
  },
  {
    id: 'multi-window.ongoing-game',
    route: { tab: 'multi-window' },
    labelKey: 'settings.multiWindow.ongoingGameWindow.title',
    searchable: false
  },
  {
    id: 'multi-window.ongoing-game.enabled',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.ongoing-game',
    labelKey: 'settings.multiWindow.ongoingGameWindow.enabled.label',
    descriptionKey: 'settings.multiWindow.ongoingGameWindow.enabled.description'
  },
  {
    id: 'multi-window.ongoing-game.shortcut',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.ongoing-game',
    labelKey: 'settings.multiWindow.ongoingGameWindow.showShortcut.label',
    descriptionKey: 'settings.multiWindow.ongoingGameWindow.showShortcut.description'
  },
  {
    id: 'multi-window.cd-timer',
    route: { tab: 'multi-window' },
    labelKey: 'settings.multiWindow.cdTimerWindow.title',
    searchable: false
  },
  {
    id: 'multi-window.cd-timer.enabled',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.cd-timer',
    labelKey: 'settings.multiWindow.cdTimerWindow.enabled.label',
    descriptionKey: 'settings.multiWindow.cdTimerWindow.enabled.description'
  },
  {
    id: 'multi-window.cd-timer.shortcut',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.cd-timer',
    labelKey: 'settings.multiWindow.cdTimerWindow.showShortcut.label',
    descriptionKey: 'settings.multiWindow.cdTimerWindow.showShortcut.description'
  },
  {
    id: 'multi-window.cd-timer.reset-position',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.cd-timer',
    labelKey: 'settings.multiWindow.cdTimerWindow.resetWindowPosition.label',
    descriptionKey: 'settings.multiWindow.cdTimerWindow.resetWindowPosition.description'
  },
  {
    id: 'multi-window.cd-timer.type',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.cd-timer',
    labelKey: 'settings.multiWindow.cdTimerWindow.timerType.label',
    descriptionKey: 'settings.multiWindow.cdTimerWindow.timerType.description'
  },
  {
    id: 'multi-window.cd-timer.reverse-adjustment',
    route: { tab: 'multi-window' },
    parentId: 'multi-window.cd-timer',
    labelKey: 'settings.multiWindow.cdTimerWindow.reverseAdjustmentDirection.label',
    descriptionKey: 'settings.multiWindow.cdTimerWindow.reverseAdjustmentDirection.description'
  },
  {
    id: 'misc.respawn-timer',
    route: { tab: 'misc' },
    labelKey: 'settings.misc.respawnTimer.title',
    searchable: false
  },
  {
    id: 'misc.respawn-timer.enabled',
    route: { tab: 'misc' },
    parentId: 'misc.respawn-timer',
    labelKey: 'settings.misc.respawnTimer.enabled.label',
    descriptionKey: 'settings.misc.respawnTimer.enabled.description'
  },
  {
    id: 'misc.streamer-mode',
    route: { tab: 'misc' },
    labelKey: 'settings.misc.streamerMode.title',
    searchable: false
  },
  {
    id: 'misc.streamer-mode.enabled',
    route: { tab: 'misc' },
    parentId: 'misc.streamer-mode',
    labelKey: 'settings.misc.streamerMode.streamerMode.label',
    descriptionKey: 'settings.misc.streamerMode.streamerMode.description'
  },
  {
    id: 'misc.streamer-mode.akari-name',
    route: { tab: 'misc' },
    parentId: 'misc.streamer-mode',
    fallbackId: 'misc.streamer-mode.enabled',
    prepareStep: {
      key: MISC_SETTINGS_NAVIGATION_STEP_KEY,
      payload: 'streamer-mode-enabled' satisfies MiscSettingsNavigationPayload
    },
    labelKey: 'settings.misc.streamerMode.useAkariStyledName.label',
    descriptionKey: 'settings.misc.streamerMode.useAkariStyledName.description'
  },
  {
    id: 'misc.streamer-mode.content-protection',
    route: { tab: 'misc' },
    parentId: 'misc.streamer-mode',
    labelKey: 'settings.misc.streamerMode.contentProtection.label',
    descriptionKey: 'settings.misc.streamerMode.contentProtection.description'
  },
  {
    id: 'storage.tagged-players',
    route: { tab: 'storage', subTab: 'tagged-players' },
    labelKey: 'settings.storage.tabs.tagged-players'
  },
  {
    id: 'storage.saved-settings',
    route: { tab: 'storage', subTab: 'settings' },
    labelKey: 'settings.savedSettings.title',
    searchable: false
  },
  {
    id: 'storage.saved-settings.export',
    route: { tab: 'storage', subTab: 'settings' },
    parentId: 'storage.saved-settings',
    labelKey: 'settings.savedSettings.export.label',
    descriptionKey: 'settings.savedSettings.export.description'
  },
  {
    id: 'storage.saved-settings.import',
    route: { tab: 'storage', subTab: 'settings' },
    parentId: 'storage.saved-settings',
    labelKey: 'settings.savedSettings.import.label',
    descriptionKey: 'settings.savedSettings.import.description'
  },
  {
    id: 'automation.gameflow.ready-check',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.readyCheck',
    searchable: false
  },
  {
    id: 'automation.gameflow.ready-check.enabled',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.ready-check',
    labelKey: 'automation.gameflow.autoAcceptEnabled.label',
    descriptionKey: 'automation.gameflow.autoAcceptEnabled.description'
  },
  {
    id: 'automation.gameflow.ready-check.delay',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.ready-check',
    labelKey: 'automation.gameflow.autoAcceptDelaySeconds.label',
    descriptionKey: 'automation.gameflow.autoAcceptDelaySeconds.description'
  },
  {
    id: 'automation.gameflow.auto-honor',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.autoHonor',
    searchable: false
  },
  {
    id: 'automation.gameflow.auto-honor.enabled',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-honor',
    labelKey: 'automation.gameflow.autoHonorEnabled.label',
    descriptionKey: 'automation.gameflow.autoHonorEnabled.description'
  },
  {
    id: 'automation.gameflow.play-again',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.playAgain',
    searchable: false
  },
  {
    id: 'automation.gameflow.play-again.enabled',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.play-again',
    labelKey: 'automation.gameflow.playAgainEnabled.label',
    descriptionKey: 'automation.gameflow.playAgainEnabled.description.full'
  },
  {
    id: 'automation.gameflow.auto-matchmaking',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.autoMatchmaking',
    searchable: false
  },
  {
    id: 'automation.gameflow.auto-matchmaking.enabled',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-matchmaking',
    labelKey: 'automation.gameflow.autoMatchmakingEnabled.label',
    descriptionKey: 'automation.gameflow.autoMatchmakingEnabled.description'
  },
  {
    id: 'automation.gameflow.auto-matchmaking.minimum-members',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-matchmaking',
    labelKey: 'automation.gameflow.autoMatchmakingMinimumMembers.label',
    descriptionKey: 'automation.gameflow.autoMatchmakingMinimumMembers.description'
  },
  {
    id: 'automation.gameflow.auto-matchmaking.delay',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-matchmaking',
    labelKey: 'automation.gameflow.autoMatchmakingDelaySeconds.label',
    descriptionKey: 'automation.gameflow.autoMatchmakingDelaySeconds.description'
  },
  {
    id: 'automation.gameflow.auto-matchmaking.wait-for-invitees',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-matchmaking',
    labelKey: 'automation.gameflow.autoMatchmakingWaitForInvitees.label',
    descriptionKey: 'automation.gameflow.autoMatchmakingWaitForInvitees.description'
  },
  {
    id: 'automation.gameflow.auto-matchmaking.rematch-strategy',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-matchmaking',
    labelKey: 'automation.gameflow.autoMatchmakingRematchStrategy.label',
    descriptionKey: 'automation.gameflow.autoMatchmakingRematchStrategy.description'
  },
  {
    id: 'automation.gameflow.auto-matchmaking.rematch-fixed-duration',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-matchmaking',
    labelKey: 'automation.gameflow.autoMatchmakingRematchFixedDuration.label',
    descriptionKey:
      'automation.gameflow.autoMatchmakingRematchFixedDuration.description.fixed-duration'
  },
  {
    id: 'automation.gameflow.auto-reconnect',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.autoReconnect',
    searchable: false
  },
  {
    id: 'automation.gameflow.auto-reconnect.enabled',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.auto-reconnect',
    labelKey: 'automation.gameflow.autoReconnectEnabled.label',
    descriptionKey: 'automation.gameflow.autoReconnectEnabled.description'
  },
  {
    id: 'automation.gameflow.leader',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.leader',
    searchable: false
  },
  {
    id: 'automation.gameflow.leader.enabled',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.leader',
    labelKey: 'automation.gameflow.autoSkipLeaderEnabled.label',
    descriptionKey: 'automation.gameflow.autoSkipLeaderEnabled.description'
  },
  {
    id: 'automation.gameflow.invitations',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.invitations',
    searchable: false
  },
  {
    id: 'automation.gameflow.invitations.enabled',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.invitations',
    labelKey: 'automation.gameflow.autoHandleInvitationsEnabled.label',
    descriptionKey: 'automation.gameflow.autoHandleInvitationsEnabled.description'
  },
  {
    id: 'automation.gameflow.invitations.reject-when-away',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.invitations',
    labelKey: 'automation.gameflow.rejectInvitationWhenAway.label',
    descriptionKey: 'automation.gameflow.rejectInvitationWhenAway.description'
  },
  {
    id: 'automation.gameflow.invitations.strategies',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.invitations',
    labelKey: 'automation.gameflow.invitationHandlingStrategies.label',
    descriptionKey: 'automation.gameflow.invitationHandlingStrategies.description'
  },
  {
    id: 'automation.gameflow.aram-team-side',
    route: { name: 'automation', section: 'auto-gameflow' },
    labelKey: 'automation.gameflow.sections.aramTeamSide',
    searchable: false
  },
  {
    id: 'automation.gameflow.aram-team-side.enabled',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.aram-team-side',
    labelKey: 'automation.gameflow.autoSendARAMTeamSideEnabled.label',
    descriptionKey: 'automation.gameflow.autoSendARAMTeamSideEnabled.description'
  },
  {
    id: 'automation.gameflow.aram-team-side.visible-to-team',
    route: { name: 'automation', section: 'auto-gameflow' },
    parentId: 'automation.gameflow.aram-team-side',
    terminalId: 'automation.gameflow.aram-team-side.enabled',
    labelKey: 'automation.gameflow.autoSendARAMTeamSideVisibleToTeam.label',
    descriptionKey: 'automation.gameflow.autoSendARAMTeamSideVisibleToTeam.description'
  },
  {
    id: 'automation.champ-select',
    route: { name: 'automation', section: 'auto-select' },
    labelKey: 'automation.champSelect.title',
    searchable: false
  },
  {
    id: 'automation.champ-select.pick',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select',
    terminalId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.title',
    searchable: false
  },
  {
    id: 'automation.champ-select.pick.enabled',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.enabled.label',
    descriptionKey: 'automation.champSelect.pick.enabled.description'
  },
  {
    id: 'automation.champ-select.pick.expected-champions',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.expectedChampions.label',
    descriptionKey: 'automation.champSelect.pick.expectedChampions.description'
  },
  {
    id: 'automation.champ-select.pick.show-intent',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.showIntent.label',
    descriptionKey: 'automation.champSelect.pick.showIntent.description'
  },
  {
    id: 'automation.champ-select.pick.ignore-intent',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.ignoreIntent.label',
    descriptionKey: 'automation.champSelect.pick.ignoreIntent.description'
  },
  {
    id: 'automation.champ-select.pick.strategy',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.strategy.label',
    descriptionKey: 'automation.champSelect.pick.strategy.description'
  },
  {
    id: 'automation.champ-select.pick.delay',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.delaySeconds.label',
    descriptionKey: 'automation.champSelect.pick.delaySeconds.description'
  },
  {
    id: 'automation.champ-select.pick.bench-swap-delay',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.benchSwapAccumulatedDelaySeconds.label',
    descriptionKey: 'automation.champSelect.pick.benchSwapAccumulatedDelaySeconds.description'
  },
  {
    id: 'automation.champ-select.pick.bench-first',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.benchSelectFirstAvailableChampion.label',
    descriptionKey: 'automation.champSelect.pick.benchSelectFirstAvailableChampion.description'
  },
  {
    id: 'automation.champ-select.pick.bench-handle-trade',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.pick',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.pick.benchHandleTradeEnabled.label',
    descriptionKey: 'automation.champSelect.pick.benchHandleTradeEnabled.description'
  },
  {
    id: 'automation.champ-select.ban',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select',
    terminalId: 'automation.champ-select',
    labelKey: 'automation.champSelect.ban.title',
    searchable: false
  },
  {
    id: 'automation.champ-select.ban.enabled',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.ban',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.ban.enabled.label',
    descriptionKey: 'automation.champSelect.ban.enabled.description'
  },
  {
    id: 'automation.champ-select.ban.expected-champions',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.ban',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.ban.expectedChampions.label',
    descriptionKey: 'automation.champSelect.ban.expectedChampions.description'
  },
  {
    id: 'automation.champ-select.ban.strategy',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.ban',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.ban.strategy.label',
    descriptionKey: 'automation.champSelect.ban.strategy.description'
  },
  {
    id: 'automation.champ-select.ban.delay',
    route: { name: 'automation', section: 'auto-select' },
    parentId: 'automation.champ-select.ban',
    fallbackId: 'automation.champ-select',
    labelKey: 'automation.champSelect.ban.delaySeconds.label',
    descriptionKey: 'automation.champSelect.ban.delaySeconds.description'
  },
  {
    id: 'automation.champ-config',
    route: { name: 'automation', section: 'auto-champ-config' },
    labelKey: 'automation.champConfig.title',
    searchable: false
  },
  {
    id: 'automation.champ-config.enabled',
    route: { name: 'automation', section: 'auto-champ-config' },
    parentId: 'automation.champ-config',
    labelKey: 'automation.champConfig.enabled.label',
    descriptionKey: 'automation.champConfig.enabled.description'
  },
  {
    id: 'automation.champ-config.configure',
    route: { name: 'automation', section: 'auto-champ-config' },
    parentId: 'automation.champ-config',
    labelKey: 'automation.champConfig.configure.label'
  },
  {
    id: 'automation.misc.auto-reply',
    route: { name: 'automation', section: 'misc' },
    labelKey: 'automation.misc.autoReply.title',
    searchable: false
  },
  {
    id: 'automation.misc.auto-reply.enabled',
    route: { name: 'automation', section: 'misc' },
    parentId: 'automation.misc.auto-reply',
    labelKey: 'automation.misc.autoReply.enabled.label'
  },
  {
    id: 'automation.misc.auto-reply.enable-on-away',
    route: { name: 'automation', section: 'misc' },
    parentId: 'automation.misc.auto-reply',
    terminalId: 'automation.misc.auto-reply.enabled',
    labelKey: 'automation.misc.autoReply.enableOnAway.label',
    descriptionKey: 'automation.misc.autoReply.enableOnAway.description'
  },
  {
    id: 'automation.misc.auto-reply.text',
    route: { name: 'automation', section: 'misc' },
    parentId: 'automation.misc.auto-reply',
    labelKey: 'automation.misc.autoReply.text.label',
    descriptionKey: 'automation.misc.autoReply.text.description'
  },
  {
    id: 'automation.misc.auto-invitation',
    route: { name: 'automation', section: 'misc' },
    labelKey: 'automation.misc.autoInvitation.title',
    descriptionKey: 'automation.misc.autoInvitation.description'
  },
  {
    id: 'toolkit.client.game-client',
    route: { name: 'toolkit', section: 'client' },
    labelKey: 'toolkit.client.gameClient.title',
    searchable: false
  },
  {
    id: 'toolkit.client.game-client.terminate-shortcut-enabled',
    route: { name: 'toolkit', section: 'client' },
    parentId: 'toolkit.client.game-client',
    labelKey: 'toolkit.client.gameClient.terminateGameClientWithShortcut.label',
    descriptionKey: 'toolkit.client.gameClient.terminateGameClientWithShortcut.description'
  },
  {
    id: 'toolkit.client.game-client.terminate-shortcut',
    route: { name: 'toolkit', section: 'client' },
    parentId: 'toolkit.client.game-client',
    labelKey: 'toolkit.client.gameClient.terminateShortcut.label',
    descriptionKey: 'toolkit.client.gameClient.terminateShortcut.description'
  },
  {
    id: 'toolkit.client.game-client.settings-file-mode',
    route: { name: 'toolkit', section: 'client' },
    parentId: 'toolkit.client.game-client',
    labelKey: 'toolkit.client.gameClient.settingsFileMode.label',
    descriptionKey: 'toolkit.client.gameClient.settingsFileMode.description'
  },
  {
    id: 'toolkit.client.league-client-ux',
    route: { name: 'toolkit', section: 'client' },
    labelKey: 'toolkit.client.leagueClientUx.title',
    searchable: false
  },
  {
    id: 'toolkit.client.league-client-ux.adjust-window-size',
    route: { name: 'toolkit', section: 'client' },
    parentId: 'toolkit.client.league-client-ux',
    labelKey: 'toolkit.client.leagueClientUx.fixWindowMethodAOptions.label',
    descriptionKey: 'toolkit.client.leagueClientUx.fixWindowMethodAOptions.description'
  },
  {
    id: 'toolkit.in-game-send.presets',
    route: { name: 'toolkit', section: 'in-game-send' },
    labelKey: 'toolkit.inGameSend.presets.title',
    keywordKeys: [
      'toolkit.inGameSend.presets.rating.label',
      'toolkit.inGameSend.presets.jungle.label',
      'toolkit.inGameSend.presets.premade.label',
      'toolkit.inGameSend.presets.fixedText.label',
      'toolkit.inGameSend.presets.customTemplate.label',
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
    route: { name: 'toolkit', section: 'in-game-send' },
    labelKey: 'toolkit.inGameSend.settings.title',
    searchable: false
  },
  {
    id: 'toolkit.in-game-send.settings.cancel-shortcut',
    route: { name: 'toolkit', section: 'in-game-send' },
    parentId: 'toolkit.in-game-send.settings',
    labelKey: 'toolkit.inGameSend.settings.cancelShortcut.label',
    descriptionKey: 'toolkit.inGameSend.settings.cancelShortcut.description'
  },
  {
    id: 'toolkit.in-game-send.settings.send-interval',
    route: { name: 'toolkit', section: 'in-game-send' },
    parentId: 'toolkit.in-game-send.settings',
    labelKey: 'toolkit.inGameSend.settings.sendInterval.label',
    descriptionKey: 'toolkit.inGameSend.settings.sendInterval.description'
  },
  {
    id: 'toolkit.misc.chat-availability',
    route: { name: 'toolkit', section: 'misc' },
    labelKey: 'toolkit.chatAvailability.title',
    searchable: false
  },
  {
    id: 'toolkit.misc.chat-availability.availability',
    route: { name: 'toolkit', section: 'misc' },
    parentId: 'toolkit.misc.chat-availability',
    labelKey: 'toolkit.chatAvailability.availability.label',
    descriptionKey: 'toolkit.chatAvailability.availability.description'
  },
  {
    id: 'toolkit.misc.chat-availability.lock-offline',
    route: { name: 'toolkit', section: 'misc' },
    parentId: 'toolkit.misc.chat-availability',
    labelKey: 'toolkit.chatAvailability.lockOfflineStatus.label',
    descriptionKey: 'toolkit.chatAvailability.lockOfflineStatus.description'
  },
  {
    id: 'toolkit.misc.chat-status-message',
    route: { name: 'toolkit', section: 'misc' },
    labelKey: 'toolkit.chatStatusMessage.title',
    searchable: false
  },
  {
    id: 'toolkit.misc.chat-status-message.text',
    route: { name: 'toolkit', section: 'misc' },
    parentId: 'toolkit.misc.chat-status-message',
    labelKey: 'toolkit.chatStatusMessage.text.label',
    descriptionKey: 'toolkit.chatStatusMessage.text.description'
  },
  {
    id: 'toolkit.misc.chat-status-message.reset-on-login',
    route: { name: 'toolkit', section: 'misc' },
    parentId: 'toolkit.misc.chat-status-message',
    terminalId: 'toolkit.misc.chat-status-message.text',
    labelKey: 'toolkit.chatStatusMessage.resetOnLogin.label',
    descriptionKey: 'toolkit.chatStatusMessage.resetOnLogin.description'
  },
  {
    id: 'toolkit.misc.fake-ranked',
    route: { name: 'toolkit', section: 'misc' },
    labelKey: 'toolkit.fakeRanked.title',
    searchable: false
  },
  {
    id: 'toolkit.misc.fake-ranked.status',
    route: { name: 'toolkit', section: 'misc' },
    parentId: 'toolkit.misc.fake-ranked',
    labelKey: 'toolkit.fakeRanked.set.label',
    descriptionKey: 'toolkit.fakeRanked.set.description'
  },
  {
    id: 'toolkit.misc.fake-ranked.reset-on-login',
    route: { name: 'toolkit', section: 'misc' },
    parentId: 'toolkit.misc.fake-ranked',
    terminalId: 'toolkit.misc.fake-ranked.status',
    labelKey: 'toolkit.fakeRanked.resetOnLogin.label',
    descriptionKey: 'toolkit.fakeRanked.resetOnLogin.description'
  },
  {
    id: 'debug.files',
    route: { tab: 'debug' },
    labelKey: 'settings.debug.files.title',
    searchable: false
  },
  {
    id: 'debug.files.logs',
    route: { tab: 'debug' },
    parentId: 'debug.files',
    labelKey: 'settings.debug.files.logs.label',
    descriptionKey: 'settings.debug.files.logs.description'
  },
  {
    id: 'debug.files.app-data',
    route: { tab: 'debug' },
    parentId: 'debug.files',
    labelKey: 'settings.debug.files.appData.label'
  },
  {
    id: 'debug.test-page',
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
    for (const linkedId of [target.parentId, target.fallbackId, target.terminalId]) {
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

function getAutoSelectPayload(
  targetId: string,
  groupId?: string
): AutoSelectNavigationPayload | undefined {
  if (
    targetId === 'automation.champ-select.pick' ||
    targetId.startsWith('automation.champ-select.pick.')
  ) {
    return groupId ? { tab: 'pick', groupId } : { tab: 'pick' }
  }
  if (
    targetId === 'automation.champ-select.ban' ||
    targetId.startsWith('automation.champ-select.ban.')
  ) {
    return groupId ? { tab: 'ban', groupId } : { tab: 'ban' }
  }

  return undefined
}

export interface SettingsNavigationPathOptions {
  readonly autoSelectGroupId?: string
}

export function createSettingsNavigationPath(
  target: SettingsNavigationTargetDefinition,
  options: SettingsNavigationPathOptions = {}
): AkariNavigationPath {
  const path: AkariNavigationStep[] = []

  if ('tab' in target.route) {
    path.push(
      {
        key: MAIN_WINDOW_NAVIGATION_STEP_KEY,
        payload: {
          surface: 'settings-modal'
        } satisfies MainWindowNavigationPayload
      },
      { key: SETTINGS_MODAL_NAVIGATION_STEP_KEY, payload: target.route.tab }
    )

    if (target.route.tab === 'storage') {
      path.push({
        key: STORAGE_SETTINGS_NAVIGATION_STEP_KEY,
        payload: target.route.subTab
      })
    }
  } else {
    path.push(
      {
        key: MAIN_WINDOW_NAVIGATION_STEP_KEY,
        payload: {
          surface: 'route',
          route: target.route
        } satisfies MainWindowNavigationPayload
      },
      {
        key: createMainPageNavigationStepKey(target.route.name),
        payload: target.route.section
      }
    )

    if (target.route.name === 'automation' && target.route.section === 'auto-select') {
      const autoSelectPayload = target.terminalId
        ? undefined
        : getAutoSelectPayload(target.id, options.autoSelectGroupId)
      if (autoSelectPayload) {
        path.push({ key: AUTO_SELECT_NAVIGATION_STEP_KEY, payload: autoSelectPayload })
      }
    }
  }

  if (target.prepareStep) {
    path.push(target.prepareStep)
  }

  path.push({ key: createSettingsNavigationTargetStepKey(target.terminalId ?? target.id) })
  return path
}
