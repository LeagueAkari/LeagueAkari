export type InGameSendPresetId = 'rating' | 'jungle' | 'premade'

export type InGameSendPresetTarget = 'friendly' | 'enemy' | 'all'

export const IN_GAME_SEND_PRESET_TARGETS = ['friendly', 'enemy', 'all'] as const

export const IN_GAME_SEND_PRESET_SHORTCUT_TARGET_ID_PREFIX = 'in-game-send-main/preset'

export const IN_GAME_SEND_RATING_OPTION_IDS = [
  'kda',
  'win-rate',
  'akari-score',
  'game-count',
  'solo-kills',
  'kill-participation',
  'damage-per-minute',
  'damage-taken-share'
] as const

export const IN_GAME_SEND_JUNGLE_OPTION_IDS = [
  'first-clear-route',
  'first-clear-side',
  'gank-lanes',
  'invade-tendency',
  'scuttle-control',
  'objective-priority',
  'counter-jungle-risk',
  'duo-lane-link'
] as const

export type InGameSendRatingOptionId = (typeof IN_GAME_SEND_RATING_OPTION_IDS)[number]
export type InGameSendJungleOptionId = (typeof IN_GAME_SEND_JUNGLE_OPTION_IDS)[number]

export interface InGameSendRatingPresetOptions {
  targetShortcuts: InGameSendPresetTargetShortcuts
  enabledMetrics: InGameSendRatingOptionId[]
}

export interface InGameSendJunglePresetOptions {
  targetShortcuts: InGameSendPresetTargetShortcuts
  enabledModules: InGameSendJungleOptionId[]
}

export interface InGameSendPremadePresetOptions {
  targetShortcuts: InGameSendPresetTargetShortcuts
}

export type InGameSendPresetTargetShortcuts = Record<InGameSendPresetTarget, string | null>

export interface InGameSendPresetOptions {
  rating: InGameSendRatingPresetOptions
  jungle: InGameSendJunglePresetOptions
  premade: InGameSendPremadePresetOptions
}

type InGameSendPresetOptionPatchBase<
  T extends { targetShortcuts: InGameSendPresetTargetShortcuts }
> = Partial<Omit<T, 'targetShortcuts'>> & {
  targetShortcuts?: Partial<InGameSendPresetTargetShortcuts>
}

export type InGameSendPresetOptionPatch<P extends InGameSendPresetId = InGameSendPresetId> =
  P extends 'rating'
    ? InGameSendPresetOptionPatchBase<InGameSendRatingPresetOptions>
    : P extends 'jungle'
      ? InGameSendPresetOptionPatchBase<InGameSendJunglePresetOptions>
      : InGameSendPresetOptionPatchBase<InGameSendPremadePresetOptions>

export type InGameSendPresetOptionsPatch = {
  [K in InGameSendPresetId]?: InGameSendPresetOptionPatch<K>
}

export function createDefaultInGameSendPresetOptions(): InGameSendPresetOptions {
  return {
    rating: {
      targetShortcuts: createDefaultInGameSendPresetTargetShortcuts(),
      enabledMetrics: [...IN_GAME_SEND_RATING_OPTION_IDS]
    },
    jungle: {
      targetShortcuts: createDefaultInGameSendPresetTargetShortcuts(),
      enabledModules: [...IN_GAME_SEND_JUNGLE_OPTION_IDS]
    },
    premade: {
      targetShortcuts: createDefaultInGameSendPresetTargetShortcuts()
    }
  }
}

export function createDefaultInGameSendPresetTargetShortcuts(): InGameSendPresetTargetShortcuts {
  return {
    friendly: null,
    enemy: null,
    all: null
  }
}

export function getInGameSendPresetShortcutTargetId(
  presetId: InGameSendPresetId,
  target: InGameSendPresetTarget
) {
  return `${IN_GAME_SEND_PRESET_SHORTCUT_TARGET_ID_PREFIX}/${presetId}/${target}`
}

function normalizeOptionIds<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: readonly T[]
) {
  if (!Array.isArray(value)) {
    return [...fallback]
  }

  const allowedSet = new Set(allowed)
  return [...new Set(value)].filter((item): item is T => {
    return typeof item === 'string' && allowedSet.has(item as T)
  })
}

export function normalizeInGameSendPresetOptions(
  value: InGameSendPresetOptionsPatch | null | undefined
): InGameSendPresetOptions {
  const defaults = createDefaultInGameSendPresetOptions()

  return {
    rating: {
      targetShortcuts: normalizeTargetShortcuts(
        value?.rating?.targetShortcuts,
        defaults.rating.targetShortcuts
      ),
      enabledMetrics: normalizeOptionIds(
        value?.rating?.enabledMetrics,
        IN_GAME_SEND_RATING_OPTION_IDS,
        defaults.rating.enabledMetrics
      )
    },
    jungle: {
      targetShortcuts: normalizeTargetShortcuts(
        value?.jungle?.targetShortcuts,
        defaults.jungle.targetShortcuts
      ),
      enabledModules: normalizeOptionIds(
        value?.jungle?.enabledModules,
        IN_GAME_SEND_JUNGLE_OPTION_IDS,
        defaults.jungle.enabledModules
      )
    },
    premade: {
      targetShortcuts: normalizeTargetShortcuts(
        value?.premade?.targetShortcuts,
        defaults.premade.targetShortcuts
      )
    }
  }
}

export function mergeInGameSendPresetOptions(
  current: InGameSendPresetOptionsPatch | null | undefined,
  patch: InGameSendPresetOptionsPatch
) {
  const normalizedCurrent = normalizeInGameSendPresetOptions(current)

  return normalizeInGameSendPresetOptions({
    rating: {
      ...normalizedCurrent.rating,
      ...patch.rating,
      targetShortcuts: {
        ...normalizedCurrent.rating.targetShortcuts,
        ...patch.rating?.targetShortcuts
      }
    },
    jungle: {
      ...normalizedCurrent.jungle,
      ...patch.jungle,
      targetShortcuts: {
        ...normalizedCurrent.jungle.targetShortcuts,
        ...patch.jungle?.targetShortcuts
      }
    },
    premade: {
      ...normalizedCurrent.premade,
      ...patch.premade,
      targetShortcuts: {
        ...normalizedCurrent.premade.targetShortcuts,
        ...patch.premade?.targetShortcuts
      }
    }
  })
}

function normalizeTargetShortcuts(
  value: unknown,
  fallback: InGameSendPresetTargetShortcuts
): InGameSendPresetTargetShortcuts {
  const source = typeof value === 'object' && value !== null ? value : {}

  return {
    friendly: normalizeShortcutId(
      (source as Partial<InGameSendPresetTargetShortcuts>).friendly,
      fallback.friendly
    ),
    enemy: normalizeShortcutId(
      (source as Partial<InGameSendPresetTargetShortcuts>).enemy,
      fallback.enemy
    ),
    all: normalizeShortcutId((source as Partial<InGameSendPresetTargetShortcuts>).all, fallback.all)
  }
}

function normalizeShortcutId(value: unknown, fallback: string | null) {
  if (value === null || typeof value === 'string') {
    return value
  }

  return fallback
}
