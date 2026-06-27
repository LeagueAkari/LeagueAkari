import type { InGameSendPresetTargetShortcuts } from '@shared/shards/in-game-send'
import type { ComputedRef, InjectionKey } from 'vue'
import { computed, inject, ref } from 'vue'

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

export interface PresetScopeDataOptions<Options, OptionsPatch> {
  shortcutTargetIds: ShortcutTargetIds
  shortcuts: ComputedRef<InGameSendPresetTargetShortcuts>
  gamePhase: ComputedRef<GamePhase>
  canSend: ComputedRef<boolean>
  options: ComputedRef<Options>
  updateOptions: (options: OptionsPatch) => Promise<void>
  createShortcutPatch: (targetId: PresetTargetId, shortcutId: string | null) => OptionsPatch
  send: (targetId: PresetTargetId) => Promise<boolean>
  generateLines: (targetId: PresetTargetId) => Promise<string[]>
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

export function usePresetScopeData<Options, OptionsPatch>({
  shortcutTargetIds,
  shortcuts,
  gamePhase,
  canSend,
  options,
  updateOptions,
  createShortcutPatch,
  send,
  generateLines
}: PresetScopeDataOptions<Options, OptionsPatch>): PresetScopeContext & {
  options: ComputedRef<Options>
  updateOptions: (options: OptionsPatch) => Promise<void>
} {
  const previewedLines = ref<PreviewedLines | null>(null)

  return {
    shortcutTargetIds,
    shortcuts,

    gamePhase,
    canSend,

    previewedLines: computed(() => previewedLines.value),

    setShortcut: (targetId, shortcutId) => {
      return updateOptions(createShortcutPatch(targetId, shortcutId))
    },

    send,

    dryRun: async (targetId) => {
      const lines = await generateLines(targetId)
      previewedLines.value = { targetId, createdAt: Date.now(), lines }
    },

    closePreview: () => {
      previewedLines.value = null
    },

    options,
    updateOptions
  }
}

export function injectRequired<T>(key: InjectionKey<T>, name: string) {
  const context = inject(key)

  if (!context) {
    throw new Error(`${name} must be used within InGameSendPresets`)
  }

  return context
}
