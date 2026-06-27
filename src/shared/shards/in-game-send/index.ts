export type InGameSendPresetTarget = 'friendly' | 'enemy' | 'all'

export const IN_GAME_SEND_PRESET_TARGETS = ['friendly', 'enemy', 'all'] as const

export const IN_GAME_SEND_PRESET_SHORTCUT_TARGET_ID_PREFIX = 'in-game-send-main/preset'

export type InGameSendPresetNameDisplayStrategy =
  | 'preferName'
  | 'preferChampionName'
  | 'championNameWithName'

export type InGameSendRatingPresetNameDisplayStrategy = InGameSendPresetNameDisplayStrategy
export type InGameSendJunglePresetNameDisplayStrategy = InGameSendPresetNameDisplayStrategy

export interface InGameSendRatingPresetOptions {
  targetShortcuts: InGameSendPresetTargetShortcuts
  kda: boolean
  winRate: boolean
  avgSoloKills: boolean
  avgVisionScore: boolean
  mainChampions: boolean
  mainPositions: boolean
  nameDisplayStrategy: InGameSendRatingPresetNameDisplayStrategy
  showCurrentChampion: boolean
}

export interface InGameSendJunglePresetOptions {
  targetShortcuts: InGameSendPresetTargetShortcuts
  activityPreference: boolean
  firstClearDistribution: boolean
  earlyGank: boolean
  dragonControl: boolean
  monsterControl: boolean
  mainChampions: boolean
  nameDisplayStrategy: InGameSendJunglePresetNameDisplayStrategy
  showCurrentChampion: boolean
}

export interface InGameSendPremadePresetOptions {
  targetShortcuts: InGameSendPresetTargetShortcuts
  nameDisplayStrategy: InGameSendPresetNameDisplayStrategy
}

export type InGameSendPresetTargetShortcuts = Record<InGameSendPresetTarget, string | null>

export type InGameSendRatingPresetDisplayOptionKey =
  | 'kda'
  | 'winRate'
  | 'avgSoloKills'
  | 'avgVisionScore'
  | 'mainChampions'
  | 'mainPositions'

export type InGameSendRatingPresetConfigOptionKey = 'showCurrentChampion'

export type InGameSendJunglePresetDisplayOptionKey =
  | 'activityPreference'
  | 'firstClearDistribution'
  | 'earlyGank'
  | 'dragonControl'
  | 'monsterControl'
  | 'mainChampions'

export type InGameSendJunglePresetConfigOptionKey = 'showCurrentChampion'

export interface InGameSendRatingPresetOptionPatch {
  targetShortcuts?: Partial<InGameSendPresetTargetShortcuts>
  kda?: boolean
  winRate?: boolean
  avgSoloKills?: boolean
  avgVisionScore?: boolean
  mainChampions?: boolean
  mainPositions?: boolean
  nameDisplayStrategy?: InGameSendRatingPresetNameDisplayStrategy
  showCurrentChampion?: boolean
}

export interface InGameSendJunglePresetOptionPatch {
  targetShortcuts?: Partial<InGameSendPresetTargetShortcuts>
  activityPreference?: boolean
  firstClearDistribution?: boolean
  earlyGank?: boolean
  dragonControl?: boolean
  monsterControl?: boolean
  mainChampions?: boolean
  nameDisplayStrategy?: InGameSendJunglePresetNameDisplayStrategy
  showCurrentChampion?: boolean
}

export interface InGameSendPremadePresetOptionPatch {
  targetShortcuts?: Partial<InGameSendPresetTargetShortcuts>
  nameDisplayStrategy?: InGameSendPresetNameDisplayStrategy
}

export function createDefaultInGameSendRatingPresetOptions(): InGameSendRatingPresetOptions {
  return {
    targetShortcuts: createDefaultInGameSendPresetTargetShortcuts(),
    kda: true,
    winRate: true,
    avgSoloKills: true,
    avgVisionScore: false,
    mainChampions: true,
    mainPositions: true,
    nameDisplayStrategy: 'preferChampionName',
    showCurrentChampion: false
  }
}

export function createDefaultInGameSendJunglePresetOptions(): InGameSendJunglePresetOptions {
  return {
    targetShortcuts: createDefaultInGameSendPresetTargetShortcuts(),
    activityPreference: true,
    firstClearDistribution: true,
    earlyGank: true,
    dragonControl: true,
    monsterControl: true,
    mainChampions: true,
    nameDisplayStrategy: 'preferChampionName',
    showCurrentChampion: true
  }
}

export function createDefaultInGameSendPremadePresetOptions(): InGameSendPremadePresetOptions {
  return {
    targetShortcuts: createDefaultInGameSendPresetTargetShortcuts(),
    nameDisplayStrategy: 'preferChampionName'
  }
}

export function createDefaultInGameSendPresetTargetShortcuts(): InGameSendPresetTargetShortcuts {
  return {
    friendly: null,
    enemy: null,
    all: null
  }
}

export function getInGameSendRatingPresetShortcutTargetId(target: InGameSendPresetTarget) {
  return `${IN_GAME_SEND_PRESET_SHORTCUT_TARGET_ID_PREFIX}/rating/${target}`
}

export function getInGameSendJunglePresetShortcutTargetId(target: InGameSendPresetTarget) {
  return `${IN_GAME_SEND_PRESET_SHORTCUT_TARGET_ID_PREFIX}/jungle/${target}`
}

export function getInGameSendPremadePresetShortcutTargetId(target: InGameSendPresetTarget) {
  return `${IN_GAME_SEND_PRESET_SHORTCUT_TARGET_ID_PREFIX}/premade/${target}`
}
