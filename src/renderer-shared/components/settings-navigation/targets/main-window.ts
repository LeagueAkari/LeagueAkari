import type { NavigationTargetGroup } from './types'

export interface MainWindowNavigationOptions {
  readonly autoSelectGroupId?: string
}

export const mainWindowTargets = [
  {
    groupKeys: ['settings.app.title', 'settings.app.basic.title'],
    targets: [
      {
        id: 'app.basic',
        labelKey: 'settings.app.basic.title',
        searchable: false
      },
      {
        id: 'app.basic.close-action',
        labelKey: 'settings.app.basic.mainWindowCloseAction.label',
        descriptionKey: 'settings.app.basic.mainWindowCloseAction.description'
      },
      {
        id: 'app.basic.locale',
        labelKey: 'settings.app.basic.locale.label',
        descriptionKey: 'settings.app.basic.locale.description'
      },
      {
        id: 'app.basic.preferred-lol-source',
        labelKey: 'settings.app.basic.preferredLolSource.label',
        descriptionKey: 'settings.app.basic.preferredLolSource.description'
      },
      {
        id: 'app.basic.theme',
        labelKey: 'settings.app.basic.theme.label',
        descriptionKey: 'settings.app.basic.theme.description'
      }
    ]
  },
  {
    groupKeys: ['settings.app.title', 'settings.app.selfUpdate.title'],
    targets: [
      {
        id: 'app.self-update',
        labelKey: 'settings.app.selfUpdate.title',
        searchable: false
      },
      {
        id: 'app.self-update.auto-check',
        labelKey: 'settings.app.selfUpdate.autoCheckUpdates.label',
        descriptionKey: 'settings.app.selfUpdate.autoCheckUpdates.description'
      },
      {
        id: 'app.self-update.auto-download',
        labelKey: 'settings.app.selfUpdate.autoDownloadUpdates.label',
        descriptionKey: 'settings.app.selfUpdate.autoDownloadUpdates.description'
      },
      {
        id: 'app.self-update.check',
        labelKey: 'settings.app.selfUpdate.checkUpdates'
      }
    ]
  },
  {
    groupKeys: ['settings.app.title', 'settings.app.mainWindowUi.title'],
    targets: [
      {
        id: 'app.main-window-ui',
        labelKey: 'settings.app.mainWindowUi.title',
        searchable: false
      },
      {
        id: 'app.main-window-ui.background',
        labelKey: 'settings.app.mainWindowUi.background.label',
        descriptionKey: 'settings.app.mainWindowUi.background.description'
      },
      {
        id: 'app.main-window-ui.custom-background',
        labelKey: 'settings.app.mainWindowUi.customBackground.label',
        descriptionKey: 'settings.app.mainWindowUi.customBackground.description',
        searchable: false
      }
    ]
  },
  {
    groupKeys: ['settings.app.title', 'settings.app.lcConnection.title'],
    targets: [
      {
        id: 'app.lcu-connection',
        labelKey: 'settings.app.lcConnection.title',
        searchable: false
      },
      {
        id: 'app.lcu-connection.auto-connect',
        labelKey: 'settings.app.lcConnection.autoConnect.label',
        descriptionKey: 'settings.app.lcConnection.autoConnect.description'
      },
      {
        id: 'app.lcu-connection.use-wmi',
        labelKey: 'settings.app.lcConnection.useWmi.label',
        descriptionKey: 'settings.app.lcConnection.useWmi.description'
      },
      {
        id: 'app.lcu-connection.rebuild-wmi',
        labelKey: 'settings.app.lcConnection.rebuildWmi.label',
        descriptionKey: 'settings.app.lcConnection.rebuildWmi.description'
      }
    ]
  },
  {
    groupKeys: ['settings.app.title', 'settings.app.httpProxy.title'],
    targets: [
      {
        id: 'app.http-proxy',
        labelKey: 'settings.app.httpProxy.title',
        searchable: false
      },
      {
        id: 'app.misc.http-proxy.strategy',
        labelKey: 'settings.app.httpProxy.strategy.label',
        descriptionKey: 'settings.app.httpProxy.strategy.description'
      },
      {
        id: 'app.misc.http-proxy.host',
        labelKey: 'settings.app.httpProxy.host.label',
        descriptionKey: 'settings.app.httpProxy.host.description'
      },
      {
        id: 'app.misc.http-proxy.port',
        labelKey: 'settings.app.httpProxy.port.label',
        descriptionKey: 'settings.app.httpProxy.port.description'
      }
    ]
  },
  {
    groupKeys: ['settings.app.title', 'settings.app.misc.title'],
    targets: [
      {
        id: 'app.misc',
        labelKey: 'settings.app.misc.title',
        searchable: false
      },
      {
        id: 'app.misc.log-level',
        labelKey: 'settings.app.misc.logLevel.label',
        descriptionKey: 'settings.app.misc.logLevel.description'
      },
      {
        id: 'app.misc.disable-hardware-acceleration',
        labelKey: 'settings.app.misc.disableHardwareAcceleration.label',
        descriptionKey: 'settings.app.misc.disableHardwareAcceleration.description'
      },
      {
        id: 'app.misc.uninstall',
        labelKey: 'settings.app.misc.uninstallApp.label',
        descriptionKey: 'settings.app.misc.uninstallApp.description'
      }
    ]
  },
  {
    groupKeys: ['settings.matchHistory.title', 'settings.matchHistory.title'],
    targets: [
      {
        id: 'match-history',
        labelKey: 'settings.matchHistory.title',
        searchable: false
      },
      {
        id: 'match-history.refresh-after-game',
        labelKey: 'settings.matchHistory.refreshTabsAfterGameEnds.label',
        descriptionKey: 'settings.matchHistory.refreshTabsAfterGameEnds.description'
      },
      {
        id: 'match-history.load-count',
        labelKey: 'settings.matchHistory.loadCount.label',
        descriptionKey: 'settings.matchHistory.loadCount.description'
      }
    ]
  },
  {
    groupKeys: ['settings.ongoingGame.title', 'settings.ongoingGame.titleCommon'],
    targets: [
      {
        id: 'ongoing-game.common',
        labelKey: 'settings.ongoingGame.titleCommon',
        searchable: false
      },
      {
        id: 'ongoing-game.enabled',
        labelKey: 'settings.ongoingGame.enabled.label',
        descriptionKey: 'settings.ongoingGame.enabled.description'
      },
      {
        id: 'ongoing-game.auto-route',
        labelKey: 'settings.ongoingGame.autoRouteWhenGameStarts.label',
        descriptionKey: 'settings.ongoingGame.autoRouteWhenGameStarts.description'
      },
      {
        id: 'ongoing-game.match-history-load-count',
        labelKey: 'settings.ongoingGame.matchHistoryLoadCount.label',
        descriptionKey: 'settings.ongoingGame.matchHistoryLoadCount.description'
      },
      {
        id: 'ongoing-game.concurrency',
        labelKey: 'settings.ongoingGame.concurrency.label',
        descriptionKey: 'settings.ongoingGame.concurrency.description'
      },
      {
        id: 'ongoing-game.game-details-load-count',
        labelKey: 'settings.ongoingGame.gameDetailsLoadCount.label'
      },
      {
        id: 'ongoing-game.queue-filter',
        labelKey: 'settings.ongoingGame.matchHistoryTagPreference.label',
        descriptionKey: 'settings.ongoingGame.matchHistoryTagPreference.description'
      },
      {
        id: 'ongoing-game.query-in-lobby',
        labelKey: 'settings.ongoingGame.queryInLobbyPhase.label',
        descriptionKey: 'settings.ongoingGame.queryInLobbyPhase.description'
      },
      {
        id: 'ongoing-game.premade-threshold',
        labelKey: 'settings.ongoingGame.premadeTeamInferMatchCountThreshold.label',
        descriptionKey: 'settings.ongoingGame.premadeTeamInferMatchCountThreshold.description'
      }
    ]
  },
  {
    groupKeys: ['settings.ongoingGame.title', 'settings.ongoingGame.titlePlayerCard'],
    targets: [
      {
        id: 'ongoing-game.player-card',
        labelKey: 'settings.ongoingGame.titlePlayerCard',
        searchable: false
      },
      {
        id: 'ongoing-game.player-card.champion-usage',
        labelKey: 'settings.ongoingGame.showChampionUsage.label',
        descriptionKey: 'settings.ongoingGame.showChampionUsage.description'
      },
      {
        id: 'ongoing-game.player-card.match-border',
        labelKey: 'settings.ongoingGame.showMatchHistoryItemBorder.label',
        descriptionKey: 'settings.ongoingGame.showMatchHistoryItemBorder.description'
      },
      {
        id: 'ongoing-game.player-card.jungle-pathing',
        labelKey: 'settings.ongoingGame.showJunglePathing.label',
        descriptionKey: 'settings.ongoingGame.showJunglePathing.description'
      },
      {
        id: 'ongoing-game.player-card.tags',
        labelKey: 'settings.ongoingGame.playerCardTags.label',
        descriptionKey: 'settings.ongoingGame.playerCardTags.description'
      }
    ]
  },
  {
    groupKeys: ['settings.multiWindow.title', 'settings.multiWindow.secondaryWindow.title'],
    targets: [
      {
        id: 'multi-window.secondary',
        labelKey: 'settings.multiWindow.secondaryWindow.title',
        searchable: false
      },
      {
        id: 'multi-window.secondary.enabled',
        labelKey: 'settings.multiWindow.secondaryWindow.enabled.label',
        descriptionKey: 'settings.multiWindow.secondaryWindow.enabled.description'
      },
      {
        id: 'multi-window.secondary.auto-show-lobby',
        labelKey: 'settings.multiWindow.secondaryWindow.autoShowInLobby.label',
        descriptionKey: 'settings.multiWindow.secondaryWindow.autoShowInLobby.description'
      },
      {
        id: 'multi-window.secondary.auto-show-champ-select',
        labelKey: 'settings.multiWindow.secondaryWindow.autoShowInChampSelect.label',
        descriptionKey: 'settings.multiWindow.secondaryWindow.autoShowInChampSelect.description'
      },
      {
        id: 'multi-window.secondary.shortcut',
        labelKey: 'settings.multiWindow.secondaryWindow.showShortcut.label',
        descriptionKey: 'settings.multiWindow.secondaryWindow.showShortcut.description'
      },
      {
        id: 'multi-window.secondary.opacity',
        labelKey: 'settings.multiWindow.secondaryWindow.opacity.label',
        descriptionKey: 'settings.multiWindow.secondaryWindow.opacity.description'
      },
      {
        id: 'multi-window.secondary.skin-selector',
        labelKey: 'settings.multiWindow.secondaryWindow.showSkinSelector.label',
        descriptionKey: 'settings.multiWindow.secondaryWindow.showSkinSelector.description'
      },
      {
        id: 'multi-window.secondary.reset-position',
        labelKey: 'settings.multiWindow.secondaryWindow.resetWindowPosition.label',
        descriptionKey: 'settings.multiWindow.secondaryWindow.resetWindowPosition.description'
      }
    ]
  },
  {
    groupKeys: ['settings.multiWindow.title', 'settings.multiWindow.ongoingGameWindow.title'],
    targets: [
      {
        id: 'multi-window.ongoing-game',
        labelKey: 'settings.multiWindow.ongoingGameWindow.title',
        searchable: false
      },
      {
        id: 'multi-window.ongoing-game.enabled',
        labelKey: 'settings.multiWindow.ongoingGameWindow.enabled.label',
        descriptionKey: 'settings.multiWindow.ongoingGameWindow.enabled.description'
      },
      {
        id: 'multi-window.ongoing-game.shortcut',
        labelKey: 'settings.multiWindow.ongoingGameWindow.showShortcut.label',
        descriptionKey: 'settings.multiWindow.ongoingGameWindow.showShortcut.description'
      }
    ]
  },
  {
    groupKeys: ['settings.multiWindow.title', 'settings.multiWindow.cdTimerWindow.title'],
    targets: [
      {
        id: 'multi-window.cd-timer',
        labelKey: 'settings.multiWindow.cdTimerWindow.title',
        searchable: false
      },
      {
        id: 'multi-window.cd-timer.enabled',
        labelKey: 'settings.multiWindow.cdTimerWindow.enabled.label',
        descriptionKey: 'settings.multiWindow.cdTimerWindow.enabled.description'
      },
      {
        id: 'multi-window.cd-timer.shortcut',
        labelKey: 'settings.multiWindow.cdTimerWindow.showShortcut.label',
        descriptionKey: 'settings.multiWindow.cdTimerWindow.showShortcut.description'
      },
      {
        id: 'multi-window.cd-timer.reset-position',
        labelKey: 'settings.multiWindow.cdTimerWindow.resetWindowPosition.label',
        descriptionKey: 'settings.multiWindow.cdTimerWindow.resetWindowPosition.description'
      },
      {
        id: 'multi-window.cd-timer.type',
        labelKey: 'settings.multiWindow.cdTimerWindow.timerType.label',
        descriptionKey: 'settings.multiWindow.cdTimerWindow.timerType.description'
      },
      {
        id: 'multi-window.cd-timer.reverse-adjustment',
        labelKey: 'settings.multiWindow.cdTimerWindow.reverseAdjustmentDirection.label',
        descriptionKey: 'settings.multiWindow.cdTimerWindow.reverseAdjustmentDirection.description'
      }
    ]
  },
  {
    groupKeys: ['settings.misc.title', 'settings.misc.respawnTimer.title'],
    targets: [
      {
        id: 'misc.respawn-timer',
        labelKey: 'settings.misc.respawnTimer.title',
        searchable: false
      },
      {
        id: 'misc.respawn-timer.enabled',
        labelKey: 'settings.misc.respawnTimer.enabled.label',
        descriptionKey: 'settings.misc.respawnTimer.enabled.description'
      }
    ]
  },
  {
    groupKeys: ['settings.misc.title', 'settings.misc.streamerMode.title'],
    targets: [
      {
        id: 'misc.streamer-mode',
        labelKey: 'settings.misc.streamerMode.title',
        searchable: false
      },
      {
        id: 'misc.streamer-mode.enabled',
        labelKey: 'settings.misc.streamerMode.streamerMode.label',
        descriptionKey: 'settings.misc.streamerMode.streamerMode.description'
      },
      {
        id: 'misc.streamer-mode.akari-name',
        labelKey: 'settings.misc.streamerMode.useAkariStyledName.label',
        descriptionKey: 'settings.misc.streamerMode.useAkariStyledName.description'
      },
      {
        id: 'misc.streamer-mode.content-protection',
        labelKey: 'settings.misc.streamerMode.contentProtection.label',
        descriptionKey: 'settings.misc.streamerMode.contentProtection.description'
      }
    ]
  },
  {
    groupKeys: ['settings.storage.title', 'settings.storage.tabs.tagged-players'],
    targets: [
      {
        id: 'storage.tagged-players',
        labelKey: 'settings.storage.tabs.tagged-players'
      }
    ]
  },
  {
    groupKeys: [
      'settings.storage.title',
      'settings.storage.tabs.settings',
      'settings.savedSettings.title'
    ],
    targets: [
      {
        id: 'storage.saved-settings',
        labelKey: 'settings.savedSettings.title',
        searchable: false
      },
      {
        id: 'storage.saved-settings.export',
        labelKey: 'settings.savedSettings.export.label',
        descriptionKey: 'settings.savedSettings.export.description'
      },
      {
        id: 'storage.saved-settings.import',
        labelKey: 'settings.savedSettings.import.label',
        descriptionKey: 'settings.savedSettings.import.description'
      }
    ]
  },
  {
    groupKeys: [
      'automation.home.title',
      'automation.home.autoGameflow',
      'automation.gameflow.sections.readyCheck'
    ],
    targets: [
      {
        id: 'automation.gameflow.ready-check',
        labelKey: 'automation.gameflow.sections.readyCheck',
        searchable: false
      },
      {
        id: 'automation.gameflow.ready-check.enabled',
        labelKey: 'automation.gameflow.autoAcceptEnabled.label',
        descriptionKey: 'automation.gameflow.autoAcceptEnabled.description'
      },
      {
        id: 'automation.gameflow.ready-check.delay',
        labelKey: 'automation.gameflow.autoAcceptDelaySeconds.label',
        descriptionKey: 'automation.gameflow.autoAcceptDelaySeconds.description'
      }
    ]
  },
  {
    groupKeys: [
      'automation.home.title',
      'automation.home.autoGameflow',
      'automation.gameflow.sections.autoHonor'
    ],
    targets: [
      {
        id: 'automation.gameflow.auto-honor',
        labelKey: 'automation.gameflow.sections.autoHonor',
        searchable: false
      },
      {
        id: 'automation.gameflow.auto-honor.enabled',
        labelKey: 'automation.gameflow.autoHonorEnabled.label',
        descriptionKey: 'automation.gameflow.autoHonorEnabled.description'
      }
    ]
  },
  {
    groupKeys: [
      'automation.home.title',
      'automation.home.autoGameflow',
      'automation.gameflow.sections.playAgain'
    ],
    targets: [
      {
        id: 'automation.gameflow.play-again',
        labelKey: 'automation.gameflow.sections.playAgain',
        searchable: false
      },
      {
        id: 'automation.gameflow.play-again.enabled',
        labelKey: 'automation.gameflow.playAgainEnabled.label',
        descriptionKey: 'automation.gameflow.playAgainEnabled.description.full'
      }
    ]
  },
  {
    groupKeys: [
      'automation.home.title',
      'automation.home.autoGameflow',
      'automation.gameflow.sections.autoMatchmaking'
    ],
    targets: [
      {
        id: 'automation.gameflow.auto-matchmaking',
        labelKey: 'automation.gameflow.sections.autoMatchmaking',
        searchable: false
      },
      {
        id: 'automation.gameflow.auto-matchmaking.enabled',
        labelKey: 'automation.gameflow.autoMatchmakingEnabled.label',
        descriptionKey: 'automation.gameflow.autoMatchmakingEnabled.description'
      },
      {
        id: 'automation.gameflow.auto-matchmaking.minimum-members',
        labelKey: 'automation.gameflow.autoMatchmakingMinimumMembers.label',
        descriptionKey: 'automation.gameflow.autoMatchmakingMinimumMembers.description'
      },
      {
        id: 'automation.gameflow.auto-matchmaking.delay',
        labelKey: 'automation.gameflow.autoMatchmakingDelaySeconds.label',
        descriptionKey: 'automation.gameflow.autoMatchmakingDelaySeconds.description'
      },
      {
        id: 'automation.gameflow.auto-matchmaking.wait-for-invitees',
        labelKey: 'automation.gameflow.autoMatchmakingWaitForInvitees.label',
        descriptionKey: 'automation.gameflow.autoMatchmakingWaitForInvitees.description'
      },
      {
        id: 'automation.gameflow.auto-matchmaking.rematch-strategy',
        labelKey: 'automation.gameflow.autoMatchmakingRematchStrategy.label',
        descriptionKey: 'automation.gameflow.autoMatchmakingRematchStrategy.description'
      },
      {
        id: 'automation.gameflow.auto-matchmaking.rematch-fixed-duration',
        labelKey: 'automation.gameflow.autoMatchmakingRematchFixedDuration.label',
        descriptionKey:
          'automation.gameflow.autoMatchmakingRematchFixedDuration.description.fixed-duration'
      }
    ]
  },
  {
    groupKeys: [
      'automation.home.title',
      'automation.home.autoGameflow',
      'automation.gameflow.sections.autoReconnect'
    ],
    targets: [
      {
        id: 'automation.gameflow.auto-reconnect',
        labelKey: 'automation.gameflow.sections.autoReconnect',
        searchable: false
      },
      {
        id: 'automation.gameflow.auto-reconnect.enabled',
        labelKey: 'automation.gameflow.autoReconnectEnabled.label',
        descriptionKey: 'automation.gameflow.autoReconnectEnabled.description'
      }
    ]
  },
  {
    groupKeys: [
      'automation.home.title',
      'automation.home.autoGameflow',
      'automation.gameflow.sections.leader'
    ],
    targets: [
      {
        id: 'automation.gameflow.leader',
        labelKey: 'automation.gameflow.sections.leader',
        searchable: false
      },
      {
        id: 'automation.gameflow.leader.enabled',
        labelKey: 'automation.gameflow.autoSkipLeaderEnabled.label',
        descriptionKey: 'automation.gameflow.autoSkipLeaderEnabled.description'
      }
    ]
  },
  {
    groupKeys: [
      'automation.home.title',
      'automation.home.autoGameflow',
      'automation.gameflow.sections.invitations'
    ],
    targets: [
      {
        id: 'automation.gameflow.invitations',
        labelKey: 'automation.gameflow.sections.invitations',
        searchable: false
      },
      {
        id: 'automation.gameflow.invitations.enabled',
        labelKey: 'automation.gameflow.autoHandleInvitationsEnabled.label',
        descriptionKey: 'automation.gameflow.autoHandleInvitationsEnabled.description'
      },
      {
        id: 'automation.gameflow.invitations.reject-when-away',
        labelKey: 'automation.gameflow.rejectInvitationWhenAway.label',
        descriptionKey: 'automation.gameflow.rejectInvitationWhenAway.description'
      },
      {
        id: 'automation.gameflow.invitations.strategies',
        labelKey: 'automation.gameflow.invitationHandlingStrategies.label',
        descriptionKey: 'automation.gameflow.invitationHandlingStrategies.description'
      }
    ]
  },
  {
    groupKeys: [
      'automation.home.title',
      'automation.home.autoGameflow',
      'automation.gameflow.sections.aramTeamSide'
    ],
    targets: [
      {
        id: 'automation.gameflow.aram-team-side',
        labelKey: 'automation.gameflow.sections.aramTeamSide',
        searchable: false
      },
      {
        id: 'automation.gameflow.aram-team-side.enabled',
        labelKey: 'automation.gameflow.autoSendARAMTeamSideEnabled.label',
        descriptionKey: 'automation.gameflow.autoSendARAMTeamSideEnabled.description'
      },
      {
        id: 'automation.gameflow.aram-team-side.visible-to-team',
        labelKey: 'automation.gameflow.autoSendARAMTeamSideVisibleToTeam.label',
        descriptionKey: 'automation.gameflow.autoSendARAMTeamSideVisibleToTeam.description'
      }
    ]
  },
  {
    groupKeys: [
      'automation.home.title',
      'automation.home.autoSelect',
      'automation.champSelect.title'
    ],
    targets: [
      {
        id: 'automation.champ-select',
        labelKey: 'automation.champSelect.title',
        searchable: false
      },
      {
        id: 'automation.champ-select.pick',
        labelKey: 'automation.champSelect.pick.title',
        searchable: false
      }
    ]
  },
  {
    groupKeys: [
      'automation.home.title',
      'automation.home.autoSelect',
      'automation.champSelect.pick.title'
    ],
    targets: [
      {
        id: 'automation.champ-select.pick.enabled',
        labelKey: 'automation.champSelect.pick.enabled.label',
        descriptionKey: 'automation.champSelect.pick.enabled.description'
      },
      {
        id: 'automation.champ-select.pick.expected-champions',
        labelKey: 'automation.champSelect.pick.expectedChampions.label',
        descriptionKey: 'automation.champSelect.pick.expectedChampions.description'
      },
      {
        id: 'automation.champ-select.pick.show-intent',
        labelKey: 'automation.champSelect.pick.showIntent.label',
        descriptionKey: 'automation.champSelect.pick.showIntent.description'
      },
      {
        id: 'automation.champ-select.pick.ignore-intent',
        labelKey: 'automation.champSelect.pick.ignoreIntent.label',
        descriptionKey: 'automation.champSelect.pick.ignoreIntent.description'
      },
      {
        id: 'automation.champ-select.pick.strategy',
        labelKey: 'automation.champSelect.pick.strategy.label',
        descriptionKey: 'automation.champSelect.pick.strategy.description'
      },
      {
        id: 'automation.champ-select.pick.delay',
        labelKey: 'automation.champSelect.pick.delaySeconds.label',
        descriptionKey: 'automation.champSelect.pick.delaySeconds.description'
      },
      {
        id: 'automation.champ-select.pick.bench-swap-delay',
        labelKey: 'automation.champSelect.pick.benchSwapAccumulatedDelaySeconds.label',
        descriptionKey: 'automation.champSelect.pick.benchSwapAccumulatedDelaySeconds.description'
      },
      {
        id: 'automation.champ-select.pick.bench-first',
        labelKey: 'automation.champSelect.pick.benchSelectFirstAvailableChampion.label',
        descriptionKey: 'automation.champSelect.pick.benchSelectFirstAvailableChampion.description'
      },
      {
        id: 'automation.champ-select.pick.bench-handle-trade',
        labelKey: 'automation.champSelect.pick.benchHandleTradeEnabled.label',
        descriptionKey: 'automation.champSelect.pick.benchHandleTradeEnabled.description'
      }
    ]
  },
  {
    groupKeys: [
      'automation.home.title',
      'automation.home.autoSelect',
      'automation.champSelect.title'
    ],
    targets: [
      {
        id: 'automation.champ-select.ban',
        labelKey: 'automation.champSelect.ban.title',
        searchable: false
      }
    ]
  },
  {
    groupKeys: [
      'automation.home.title',
      'automation.home.autoSelect',
      'automation.champSelect.ban.title'
    ],
    targets: [
      {
        id: 'automation.champ-select.ban.enabled',
        labelKey: 'automation.champSelect.ban.enabled.label',
        descriptionKey: 'automation.champSelect.ban.enabled.description'
      },
      {
        id: 'automation.champ-select.ban.expected-champions',
        labelKey: 'automation.champSelect.ban.expectedChampions.label',
        descriptionKey: 'automation.champSelect.ban.expectedChampions.description'
      },
      {
        id: 'automation.champ-select.ban.strategy',
        labelKey: 'automation.champSelect.ban.strategy.label',
        descriptionKey: 'automation.champSelect.ban.strategy.description'
      },
      {
        id: 'automation.champ-select.ban.delay',
        labelKey: 'automation.champSelect.ban.delaySeconds.label',
        descriptionKey: 'automation.champSelect.ban.delaySeconds.description'
      }
    ]
  },
  {
    groupKeys: [
      'automation.home.title',
      'automation.home.autoChampConfig',
      'automation.champConfig.title'
    ],
    targets: [
      {
        id: 'automation.champ-config',
        labelKey: 'automation.champConfig.title',
        searchable: false
      },
      {
        id: 'automation.champ-config.enabled',
        labelKey: 'automation.champConfig.enabled.label',
        descriptionKey: 'automation.champConfig.enabled.description'
      },
      {
        id: 'automation.champ-config.configure',
        labelKey: 'automation.champConfig.configure.label'
      }
    ]
  },
  {
    groupKeys: [
      'automation.home.title',
      'automation.home.autoMisc',
      'automation.misc.autoReply.title'
    ],
    targets: [
      {
        id: 'automation.misc.auto-reply',
        labelKey: 'automation.misc.autoReply.title',
        searchable: false
      },
      {
        id: 'automation.misc.auto-reply.enabled',
        labelKey: 'automation.misc.autoReply.enabled.label'
      },
      {
        id: 'automation.misc.auto-reply.enable-on-away',
        labelKey: 'automation.misc.autoReply.enableOnAway.label',
        descriptionKey: 'automation.misc.autoReply.enableOnAway.description'
      },
      {
        id: 'automation.misc.auto-reply.text',
        labelKey: 'automation.misc.autoReply.text.label',
        descriptionKey: 'automation.misc.autoReply.text.description'
      }
    ]
  },
  {
    groupKeys: ['automation.home.title', 'automation.home.autoMisc'],
    targets: [
      {
        id: 'automation.misc.auto-invitation',
        labelKey: 'automation.misc.autoInvitation.title',
        descriptionKey: 'automation.misc.autoInvitation.description'
      }
    ]
  },
  {
    groupKeys: ['toolkit.home.title', 'toolkit.home.client', 'toolkit.client.gameClient.title'],
    targets: [
      {
        id: 'toolkit.client.game-client',
        labelKey: 'toolkit.client.gameClient.title',
        searchable: false
      },
      {
        id: 'toolkit.client.game-client.terminate-shortcut-enabled',
        labelKey: 'toolkit.client.gameClient.terminateGameClientWithShortcut.label',
        descriptionKey: 'toolkit.client.gameClient.terminateGameClientWithShortcut.description'
      },
      {
        id: 'toolkit.client.game-client.terminate-shortcut',
        labelKey: 'toolkit.client.gameClient.terminateShortcut.label',
        descriptionKey: 'toolkit.client.gameClient.terminateShortcut.description'
      },
      {
        id: 'toolkit.client.game-client.settings-file-mode',
        labelKey: 'toolkit.client.gameClient.settingsFileMode.label',
        descriptionKey: 'toolkit.client.gameClient.settingsFileMode.description'
      }
    ]
  },
  {
    groupKeys: ['toolkit.home.title', 'toolkit.home.client', 'toolkit.client.leagueClientUx.title'],
    targets: [
      {
        id: 'toolkit.client.league-client-ux',
        labelKey: 'toolkit.client.leagueClientUx.title',
        searchable: false
      },
      {
        id: 'toolkit.client.league-client-ux.adjust-window-size',
        labelKey: 'toolkit.client.leagueClientUx.fixWindowMethodAOptions.label',
        descriptionKey: 'toolkit.client.leagueClientUx.fixWindowMethodAOptions.description'
      }
    ]
  },
  {
    groupKeys: ['toolkit.home.title', 'toolkit.home.in-game-send'],
    targets: [
      {
        id: 'toolkit.in-game-send.presets',
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
        labelKey: 'toolkit.inGameSend.settings.title',
        searchable: false
      }
    ]
  },
  {
    groupKeys: [
      'toolkit.home.title',
      'toolkit.home.in-game-send',
      'toolkit.inGameSend.settings.title'
    ],
    targets: [
      {
        id: 'toolkit.in-game-send.settings.cancel-shortcut',
        labelKey: 'toolkit.inGameSend.settings.cancelShortcut.label',
        descriptionKey: 'toolkit.inGameSend.settings.cancelShortcut.description'
      },
      {
        id: 'toolkit.in-game-send.settings.send-interval',
        labelKey: 'toolkit.inGameSend.settings.sendInterval.label',
        descriptionKey: 'toolkit.inGameSend.settings.sendInterval.description'
      }
    ]
  },
  {
    groupKeys: ['toolkit.home.title', 'toolkit.home.misc', 'toolkit.chatAvailability.title'],
    targets: [
      {
        id: 'toolkit.misc.chat-availability',
        labelKey: 'toolkit.chatAvailability.title',
        searchable: false
      },
      {
        id: 'toolkit.misc.chat-availability.availability',
        labelKey: 'toolkit.chatAvailability.availability.label',
        descriptionKey: 'toolkit.chatAvailability.availability.description'
      },
      {
        id: 'toolkit.misc.chat-availability.lock-offline',
        labelKey: 'toolkit.chatAvailability.lockOfflineStatus.label',
        descriptionKey: 'toolkit.chatAvailability.lockOfflineStatus.description'
      }
    ]
  },
  {
    groupKeys: ['toolkit.home.title', 'toolkit.home.misc', 'toolkit.chatStatusMessage.title'],
    targets: [
      {
        id: 'toolkit.misc.chat-status-message',
        labelKey: 'toolkit.chatStatusMessage.title',
        searchable: false
      },
      {
        id: 'toolkit.misc.chat-status-message.text',
        labelKey: 'toolkit.chatStatusMessage.text.label',
        descriptionKey: 'toolkit.chatStatusMessage.text.description'
      },
      {
        id: 'toolkit.misc.chat-status-message.reset-on-login',
        labelKey: 'toolkit.chatStatusMessage.resetOnLogin.label',
        descriptionKey: 'toolkit.chatStatusMessage.resetOnLogin.description'
      }
    ]
  },
  {
    groupKeys: ['toolkit.home.title', 'toolkit.home.misc', 'toolkit.fakeRanked.title'],
    targets: [
      {
        id: 'toolkit.misc.fake-ranked',
        labelKey: 'toolkit.fakeRanked.title',
        searchable: false
      },
      {
        id: 'toolkit.misc.fake-ranked.status',
        labelKey: 'toolkit.fakeRanked.set.label',
        descriptionKey: 'toolkit.fakeRanked.set.description'
      },
      {
        id: 'toolkit.misc.fake-ranked.reset-on-login',
        labelKey: 'toolkit.fakeRanked.resetOnLogin.label',
        descriptionKey: 'toolkit.fakeRanked.resetOnLogin.description'
      }
    ]
  },
  {
    groupKeys: ['settings.debug.title', 'settings.debug.files.title'],
    targets: [
      {
        id: 'debug.files',
        labelKey: 'settings.debug.files.title',
        searchable: false
      },
      {
        id: 'debug.files.logs',
        labelKey: 'settings.debug.files.logs.label',
        descriptionKey: 'settings.debug.files.logs.description'
      },
      {
        id: 'debug.files.app-data',
        labelKey: 'settings.debug.files.appData.label'
      }
    ]
  },
  {
    groupKeys: ['settings.debug.title'],
    targets: [
      {
        id: 'debug.test-page',
        labelKey: 'settings.debug.testPage.label',
        descriptionKey: 'settings.debug.testPage.description'
      }
    ]
  }
] as const satisfies readonly NavigationTargetGroup[]

export type MainWindowTargetId = (typeof mainWindowTargets)[number]['targets'][number]['id']
