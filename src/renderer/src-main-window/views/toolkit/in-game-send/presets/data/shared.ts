import type { InGameSendPresetTargetShortcuts } from '@shared/types/shards/in-game-send'
import type { ComputedRef, InjectionKey } from 'vue'
import { inject } from 'vue'

import type { GamePhase, PresetTargetId, PreviewedLines } from '../types'

export interface PresetScopeContext {
  shortcutTargetIds: Record<PresetTargetId, string>
  shortcuts: ComputedRef<InGameSendPresetTargetShortcuts>

  gamePhase: ComputedRef<GamePhase>
  canSend: ComputedRef<boolean>

  previewedLines: ComputedRef<PreviewedLines | null>

  setShortcut: (targetId: PresetTargetId, shortcutId: string | null) => Promise<void>
  send: (targetId: PresetTargetId) => Promise<boolean>
  dryRun: (targetId: PresetTargetId) => Promise<void>
  closePreview: () => void
}

export type ShortcutTargetIds = Record<PresetTargetId, string>

export function createShortcutTargetIds(
  getShortcutTargetId: (targetId: PresetTargetId) => string
): ShortcutTargetIds {
  return {
    friendly: getShortcutTargetId('friendly'),
    enemy: getShortcutTargetId('enemy'),
    all: getShortcutTargetId('all')
  }
}

export function createTargetShortcutPatch(
  targetId: PresetTargetId,
  shortcutId: string | null
): Partial<InGameSendPresetTargetShortcuts> {
  return {
    [targetId]: shortcutId
  }
}

export function createPreviewedLines(targetId: PresetTargetId, lines: string[]): PreviewedLines {
  return {
    targetId,
    lines
  }
}

export function injectRequired<T>(key: InjectionKey<T>, name: string) {
  const context = inject(key)

  if (!context) {
    throw new Error(`${name} must be used within InGameSendPresets`)
  }

  return context
}
