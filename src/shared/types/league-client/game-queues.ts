export interface GameQueue {
  allowablePremadeSizes: number[]
  areFreeChampionsAllowed: boolean
  assetMutator: string
  category: Category
  championsRequiredToPlay: number
  description: string
  detailedDescription: string
  gameMode: string
  gameSelectCategory: GameSelectCategory
  gameSelectModeGroup: GameSelectModeGroup
  gameSelectPriority: number
  gameTypeConfig: GameTypeConfig
  hidePlayerPosition: boolean
  id: number
  isBotHonoringAllowed: boolean
  isCustom: boolean
  isEnabled: boolean
  isLimitedTimeQueue: boolean
  isRanked: boolean
  isSkillTreeQueue: boolean
  isTeamBuilderManaged: boolean
  isVisible: boolean
  lastToggledOffTime: number
  lastToggledOnTime: number
  mapId: number
  maxDivisionForPremadeSize2: string
  maxLobbySpectatorCount: number
  maxTierForPremadeSize2: string
  maximumParticipantListSize: number
  minLevel: number
  minimumParticipantListSize: number
  name: string
  numPlayersPerTeam: number
  numberOfTeamsInLobby: number
  queueAvailability: QueueAvailability
  queueRewards: QueueRewards
  removalFromGameAllowed: boolean
  removalFromGameDelayMinutes: number
  shortName: string
  showPositionSelector: boolean
  showQuickPlaySlotSelection: boolean
  spectatorEnabled: boolean
  type: string
}

export enum Category {
  Custom = 'Custom',
  PVP = 'PvP',
  VersusAI = 'VersusAi'
}

export enum GameSelectCategory {
  CreateCustom = 'CreateCustom',
  Empty = '',
  KPVP = 'kPvP',
  KTraining = 'kTraining',
  KVersusAI = 'kVersusAI'
}

export enum GameSelectModeGroup {
  Empty = '',
  KARAM = 'kARAM',
  KAlternativeLeagueGameModes = 'kAlternativeLeagueGameModes',
  KSummonersRift = 'kSummonersRift',
  KTeamfightTactics = 'kTeamfightTactics'
}

export interface GameTypeConfig {
  advancedLearningQuests: boolean
  allowTrades: boolean
  banMode: BanMode
  banTimerDuration: number
  battleBoost: boolean
  crossTeamChampionPool: boolean
  deathMatch: boolean
  doNotRemove: boolean
  duplicatePick: boolean
  exclusivePick: boolean
  gameModeOverride: null
  id: number
  learningQuests: boolean
  mainPickTimerDuration: number
  maxAllowableBans: number
  name: Name
  numPlayersPerTeamOverride: null
  onboardCoopBeginner: boolean
  pickMode: PickMode
  postPickTimerDuration: number
  reroll: boolean
  teamChampionPool: boolean
}

export enum BanMode {
  SkipBanStrategy = 'SkipBanStrategy',
  StandardBanStrategy = 'StandardBanStrategy',
  TournamentBanStrategy = 'TournamentBanStrategy'
}

export enum Name {
  GameCFGDraftTournament = 'GAME_CFG_DRAFT_TOURNAMENT',
  GameCFGTeamBuilderBlind = 'GAME_CFG_TEAM_BUILDER_BLIND',
  GameCFGTeamBuilderBlindDraft = 'GAME_CFG_TEAM_BUILDER_BLIND_DRAFT',
  GameCFGTeamBuilderBlindDupe = 'GAME_CFG_TEAM_BUILDER_BLIND_DUPE',
  GameCFGTeamBuilderDraft = 'GAME_CFG_TEAM_BUILDER_DRAFT',
  GameCFGTeamBuilderQuickplay = 'GAME_CFG_TEAM_BUILDER_QUICKPLAY',
  GameCFGTeamBuilderRandom = 'GAME_CFG_TEAM_BUILDER_RANDOM'
}

export enum PickMode {
  AllRandomPickStrategy = 'AllRandomPickStrategy',
  OneTeamVotePickStrategy = 'OneTeamVotePickStrategy',
  QuickplayPickStrategy = 'QuickplayPickStrategy',
  SimulPickStrategy = 'SimulPickStrategy',
  TeamBuilderDraftPickStrategy = 'TeamBuilderDraftPickStrategy',
  TournamentPickStrategy = 'TournamentPickStrategy'
}

export enum QueueAvailability {
  Available = 'Available',
  PlatformDisabled = 'PlatformDisabled'
}

export interface QueueRewards {
  isChampionPointsEnabled: boolean
  isIpEnabled: boolean
  isXpEnabled: boolean
  partySizeIpRewards: any[]
}
