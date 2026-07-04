export type OngoingGamePanelOrderPlayerBy =
  | 'win-rate'
  | 'kda'
  | 'default'
  | 'akari-score'
  | 'position'
  | 'premade-team'

export type OngoingGamePanelChampionUsage = 'recent' | 'mastery' | 'none'

export type OngoingGameMatchHistoryTagPreference = 'current' | 'all'

export interface OngoingGamePanelPlayerCardTagSettings {
  showPremadeTeamTag: boolean
  showSuspiciousFlashPositionTag: boolean
  showWinningStreakTag: boolean
  showLosingStreakTag: boolean
  showSoloKillsTag: boolean
  showEasyGankTag: boolean
  showGreatPerformanceTag: boolean
  showAverageTeamDamageTag: boolean
  showAverageTeamDamageTakenTag: boolean
  showAverageTeamGoldTag: boolean
  showAverageDamageGoldEfficiencyTag: boolean
  showAverageEnemyMissingPingsTag: boolean
  showAverageVisionScoreTag: boolean
  showAverageKillDamageEfficiencyTag: boolean
  showSelfTag: boolean
  showMetTag: boolean
  showTaggedTag: boolean
  showWinRateTeamTag: boolean
  showPrivacyTag: boolean
  showAkariScoreTag: boolean
}

export interface OngoingGamePanelSettings {
  enabled: boolean
  matchHistoryLoadCount: number
  orderPlayerBy: OngoingGamePanelOrderPlayerBy
  showChampionUsage: OngoingGamePanelChampionUsage
  showMatchHistoryItemBorder: boolean
  showJunglePathing: boolean
  showJunglePathingForAllPlayers: boolean
  playerCardTags: OngoingGamePanelPlayerCardTagSettings
}

export interface OngoingGameSettingsData extends OngoingGamePanelSettings {
  concurrency: number
  gameDetailsLoadCount: number
  matchHistoryTagPreference: OngoingGameMatchHistoryTagPreference
  autoRouteWhenGameStarts: boolean
  queryInLobbyPhase: boolean
  premadeTeamInferMatchCountThreshold: number
}

export const DEFAULT_ONGOING_GAME_PANEL_PLAYER_CARD_TAG_SETTINGS =
  Object.freeze<OngoingGamePanelPlayerCardTagSettings>({
    showPremadeTeamTag: true,
    showSuspiciousFlashPositionTag: true,
    showWinningStreakTag: true,
    showLosingStreakTag: true,
    showSoloKillsTag: true,
    showEasyGankTag: true,
    showGreatPerformanceTag: true,
    showAverageTeamDamageTag: false,
    showAverageTeamDamageTakenTag: false,
    showAverageTeamGoldTag: false,
    showAverageDamageGoldEfficiencyTag: false,
    showAverageEnemyMissingPingsTag: false,
    showAverageVisionScoreTag: false,
    showAverageKillDamageEfficiencyTag: true,
    showSelfTag: true,
    showMetTag: true,
    showTaggedTag: true,
    showWinRateTeamTag: true,
    showPrivacyTag: true,
    showAkariScoreTag: false
  })

export function createDefaultOngoingGamePanelPlayerCardTagSettings(): OngoingGamePanelPlayerCardTagSettings {
  return { ...DEFAULT_ONGOING_GAME_PANEL_PLAYER_CARD_TAG_SETTINGS }
}
