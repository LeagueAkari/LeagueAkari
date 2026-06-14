import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import type { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import type {
  InGameSendPremadePresetOptions,
  InGameSendPresetOptionPatch,
  InGameSendPresetOptions
} from '@shared/types/shards/in-game-send'
import { type ComputedRef, type InjectionKey, computed, provide, ref } from 'vue'

import {
  type PremadeSelectionPresetContext,
  usePremadeSelection
} from '../composables/usePresetSelections'
import type { GamePhase, InGameSendTeam, PresetSlot, PreviewedLines } from '../types'
import {
  type PresetScopeContext,
  createPreviewedLines,
  createShortcutTargetIds,
  createTargetShortcutPatch,
  injectRequired
} from './shared'

export interface PremadePresetContext extends PresetScopeContext {
  options: ComputedRef<InGameSendPremadePresetOptions>
  updateOptions: (options: InGameSendPresetOptionPatch<'premade'>) => Promise<void>
  premadeSelection: PremadeSelectionPresetContext
}

export const PremadePresetContextKey: InjectionKey<PremadePresetContext> =
  Symbol('InGameSendPremadePreset')

export const premadePresetSlot: PresetSlot = 'premade'

export function providePremadePreset(context: PremadePresetContext) {
  provide(PremadePresetContextKey, context)
}

export function usePremadePreset() {
  return injectRequired(PremadePresetContextKey, 'usePremadePreset')
}

interface PremadePresetDataOptions {
  inGameSend: InGameSendRenderer
  inGameSendStore: ReturnType<typeof useInGameSendStore>
  gamePhase: ComputedRef<GamePhase>
  canSend: ComputedRef<boolean>
  teamsWithPlayers: ComputedRef<InGameSendTeam[]>
  totalCount: ComputedRef<number>
  presetOptions: ComputedRef<InGameSendPresetOptions>
}

export function usePremadePresetData({
  inGameSend,
  inGameSendStore,
  gamePhase,
  canSend,
  teamsWithPlayers,
  totalCount,
  presetOptions
}: PremadePresetDataOptions): PremadePresetContext {
  const previewedLines = ref<PreviewedLines | null>(null)

  const premadeSelection = usePremadeSelection({
    teamsWithPlayers,
    totalCount,
    selectedIndices: computed(() => inGameSendStore.state.premadeIndices),
    setSelectedIndices: (indices) => inGameSend.setPremadeIndices(indices)
  })

  return {
    shortcutTargetIds: createShortcutTargetIds(InGameSendRenderer.getPremadePresetShortcutTargetId),
    shortcuts: computed(() => presetOptions.value.premade.targetShortcuts),

    gamePhase,
    canSend,

    previewedLines: computed(() => previewedLines.value),

    setShortcut: (targetId, shortcutId) =>
      inGameSend.updatePremadePresetOptions({
        targetShortcuts: createTargetShortcutPatch(targetId, shortcutId)
      }),

    send: (targetId) => inGameSend.sendPremadePreset(targetId),

    dryRun: async (targetId) => {
      const lines = await inGameSend.generatePremadePresetLines(targetId)
      previewedLines.value = createPreviewedLines(targetId, lines)
    },

    closePreview: () => {
      previewedLines.value = null
    },

    options: computed(() => presetOptions.value.premade),
    updateOptions: (options) => inGameSend.updatePremadePresetOptions(options),

    premadeSelection
  }
}
