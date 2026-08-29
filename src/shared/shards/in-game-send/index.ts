export type InGameSendPresetTarget = 'friendly' | 'enemy' | 'all'

export const IN_GAME_SEND_PRESET_TARGETS = ['friendly', 'enemy', 'all'] as const

export const IN_GAME_SEND_PRESET_SHORTCUT_TARGET_ID_PREFIX = 'in-game-send-main/preset'

export const IN_GAME_SEND_FIXED_TEXT_PRESET_MAX_ITEMS = 50
export const IN_GAME_SEND_FIXED_TEXT_PRESET_TITLE_MAX_LENGTH = 64
export const IN_GAME_SEND_FIXED_TEXT_PRESET_CONTENT_MAX_LENGTH = 262144

export const IN_GAME_SEND_CUSTOM_TEMPLATE_MAX_ITEMS = 20
export const IN_GAME_SEND_CUSTOM_TEMPLATE_TITLE_MAX_LENGTH = 64
export const IN_GAME_SEND_CUSTOM_TEMPLATE_CODE_MAX_LENGTH = 262144

export const IN_GAME_SEND_CUSTOM_TEMPLATE_DEFAULT_CODE = `/**
 * @param {InGameSendTemplateContext} ctx
 * @returns {string[]}
 */
function getMessages(ctx) {
  const { target } = ctx.options
  const { manager } = ctx.runtime

  return []
}
`

export type InGameSendPresetNameDisplayStrategy =
  'preferName' | 'preferChampionName' | 'championNameWithName'

export type InGameSendRatingPresetNameDisplayStrategy = InGameSendPresetNameDisplayStrategy
export type InGameSendJunglePresetNameDisplayStrategy = InGameSendPresetNameDisplayStrategy

export interface InGameSendRatingPresetOptions {
  targetShortcuts: InGameSendPresetTargetShortcuts
  kda: boolean
  winRate: boolean
  avgSoloKills: boolean
  avgVisionScore: boolean
  avgChampionDamage: boolean
  avgDamageTaken: boolean
  avgGold: boolean
  avgCsPerMinute: boolean
  avgKillParticipation: boolean
  avgDamageGoldEfficiency: boolean
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

export interface InGameSendFixedTextPresetItem {
  id: string
  title: string
  shortcut: string | null
  content: string
}

export interface InGameSendFixedTextPresetItemPatch {
  title?: string
  shortcut?: string | null
  content?: string
}

export interface InGameSendCustomTemplateItem {
  id: string
  title: string
  code: string
  targetShortcuts: InGameSendPresetTargetShortcuts
}

export interface InGameSendCustomTemplateItemPatch {
  title?: string
  code?: string
  targetShortcuts?: Partial<InGameSendPresetTargetShortcuts>
}

export type InGameSendCustomTemplateErrorStage = 'load' | 'contract' | 'execute' | 'result'

export interface InGameSendCustomTemplateLastError {
  stage: InGameSendCustomTemplateErrorStage
  target: InGameSendPresetTarget
  occurredAt: number
  error: string
}

export type InGameSendPresetTargetShortcuts = Record<InGameSendPresetTarget, string | null>

export type InGameSendRatingPresetDisplayOptionKey =
  | 'kda'
  | 'winRate'
  | 'avgSoloKills'
  | 'avgVisionScore'
  | 'avgChampionDamage'
  | 'avgDamageTaken'
  | 'avgGold'
  | 'avgCsPerMinute'
  | 'avgKillParticipation'
  | 'avgDamageGoldEfficiency'
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
  avgChampionDamage?: boolean
  avgDamageTaken?: boolean
  avgGold?: boolean
  avgCsPerMinute?: boolean
  avgKillParticipation?: boolean
  avgDamageGoldEfficiency?: boolean
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
    avgChampionDamage: false,
    avgDamageTaken: false,
    avgGold: false,
    avgCsPerMinute: false,
    avgKillParticipation: false,
    avgDamageGoldEfficiency: false,
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

export function createDefaultInGameSendFixedTextPresetItems(): InGameSendFixedTextPresetItem[] {
  return []
}

export function createDefaultInGameSendCustomTemplateItems(): InGameSendCustomTemplateItem[] {
  return []
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

export function getInGameSendFixedTextPresetShortcutTargetId(id: string) {
  return `${IN_GAME_SEND_PRESET_SHORTCUT_TARGET_ID_PREFIX}/fixed-text/${id}`
}

export function getInGameSendCustomTemplateShortcutTargetId(
  id: string,
  target: InGameSendPresetTarget
) {
  return `${IN_GAME_SEND_PRESET_SHORTCUT_TARGET_ID_PREFIX}/custom-template/${id}/${target}`
}

export function normalizeInGameSendFixedTextPresetItem(
  item: InGameSendFixedTextPresetItem
): InGameSendFixedTextPresetItem {
  return {
    id: String(item.id ?? ''),
    title: String(item.title ?? '').slice(0, IN_GAME_SEND_FIXED_TEXT_PRESET_TITLE_MAX_LENGTH),
    shortcut: item.shortcut ? String(item.shortcut) : null,
    content: String(item.content ?? '').slice(0, IN_GAME_SEND_FIXED_TEXT_PRESET_CONTENT_MAX_LENGTH)
  }
}

export function normalizeInGameSendFixedTextPresetItems(
  items: InGameSendFixedTextPresetItem[]
): InGameSendFixedTextPresetItem[] {
  if (!Array.isArray(items)) {
    return []
  }

  const seenIds = new Set<string>()
  const normalized: InGameSendFixedTextPresetItem[] = []

  for (const item of items) {
    const normalizedItem = normalizeInGameSendFixedTextPresetItem(item)

    if (!normalizedItem.id || seenIds.has(normalizedItem.id)) {
      continue
    }

    normalized.push(normalizedItem)
    seenIds.add(normalizedItem.id)

    if (normalized.length >= IN_GAME_SEND_FIXED_TEXT_PRESET_MAX_ITEMS) {
      break
    }
  }

  return normalized
}

export function normalizeInGameSendCustomTemplateItem(
  item: InGameSendCustomTemplateItem
): InGameSendCustomTemplateItem {
  const targetShortcuts = item?.targetShortcuts ?? createDefaultInGameSendPresetTargetShortcuts()

  return {
    id: String(item?.id ?? ''),
    title: String(item?.title ?? '').slice(0, IN_GAME_SEND_CUSTOM_TEMPLATE_TITLE_MAX_LENGTH),
    code: String(item?.code ?? '').slice(0, IN_GAME_SEND_CUSTOM_TEMPLATE_CODE_MAX_LENGTH),
    targetShortcuts: {
      friendly: targetShortcuts.friendly ? String(targetShortcuts.friendly) : null,
      enemy: targetShortcuts.enemy ? String(targetShortcuts.enemy) : null,
      all: targetShortcuts.all ? String(targetShortcuts.all) : null
    }
  }
}

export function normalizeInGameSendCustomTemplateItems(
  items: InGameSendCustomTemplateItem[]
): InGameSendCustomTemplateItem[] {
  if (!Array.isArray(items)) {
    return []
  }

  const seenIds = new Set<string>()
  const normalized: InGameSendCustomTemplateItem[] = []

  for (const item of items) {
    const normalizedItem = normalizeInGameSendCustomTemplateItem(item)

    if (!normalizedItem.id || seenIds.has(normalizedItem.id)) {
      continue
    }

    normalized.push(normalizedItem)
    seenIds.add(normalizedItem.id)

    if (normalized.length >= IN_GAME_SEND_CUSTOM_TEMPLATE_MAX_ITEMS) {
      break
    }
  }

  return normalized
}
