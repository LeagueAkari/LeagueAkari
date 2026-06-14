import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import type { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import type {
  InGameSendPresetOptionPatch,
  InGameSendPresetOptions,
  InGameSendRatingPresetOptions
} from '@shared/types/shards/in-game-send'
import { type ComputedRef, type InjectionKey, computed, provide, ref } from 'vue'

import {
  type PlayerSelectionPresetContext,
  usePlayerSelection
} from '../composables/usePresetSelections'
import type { GamePhase, InGameSendTeam, PresetSlot, PreviewedLines } from '../types'
import {
  type PresetScopeContext,
  createPreviewedLines,
  createShortcutTargetIds,
  createTargetShortcutPatch,
  injectRequired
} from './shared'

export interface RatingPresetContext extends PresetScopeContext {
  options: ComputedRef<InGameSendRatingPresetOptions>
  updateOptions: (options: InGameSendPresetOptionPatch<'rating'>) => Promise<void>
  playerSelection: PlayerSelectionPresetContext
}

export const RatingPresetContextKey: InjectionKey<RatingPresetContext> =
  Symbol('InGameSendRatingPreset')

export const ratingPresetSlot: PresetSlot = 'rating'

export function provideRatingPreset(context: RatingPresetContext) {
  provide(RatingPresetContextKey, context)
}

export function useRatingPreset() {
  return injectRequired(RatingPresetContextKey, 'useRatingPreset')
}

interface RatingPresetDataOptions {
  inGameSend: InGameSendRenderer
  inGameSendStore: ReturnType<typeof useInGameSendStore>
  gamePhase: ComputedRef<GamePhase>
  canSend: ComputedRef<boolean>
  teamsWithPlayers: ComputedRef<InGameSendTeam[]>
  allPuuids: ComputedRef<string[]>
  totalCount: ComputedRef<number>
  presetOptions: ComputedRef<InGameSendPresetOptions>
}

export function useRatingPresetData({
  inGameSend,
  inGameSendStore,
  gamePhase,
  canSend,
  teamsWithPlayers,
  allPuuids,
  totalCount,
  presetOptions
}: RatingPresetDataOptions): RatingPresetContext {
  const previewedLines = ref<PreviewedLines | null>(null)

  const playerSelection = usePlayerSelection({
    teamsWithPlayers,
    allPuuids,
    totalCount,
    selectedPuuids: computed(() => inGameSendStore.state.ratingPuuids),
    setSelectedPuuids: (puuids) => inGameSend.setRatingPuuids(puuids)
  })

  return {
    shortcutTargetIds: createShortcutTargetIds(InGameSendRenderer.getRatingPresetShortcutTargetId),
    shortcuts: computed(() => presetOptions.value.rating.targetShortcuts),

    gamePhase,
    canSend,

    previewedLines: computed(() => previewedLines.value),

    setShortcut: (targetId, shortcutId) =>
      inGameSend.updateRatingPresetOptions({
        targetShortcuts: createTargetShortcutPatch(targetId, shortcutId)
      }),

    send: (targetId) => inGameSend.sendRatingPreset(targetId),

    dryRun: async (targetId) => {
      const lines = await inGameSend.generateRatingPresetLines(targetId)
      previewedLines.value = createPreviewedLines(targetId, lines)
    },

    closePreview: () => {
      previewedLines.value = null
    },

    options: computed(() => presetOptions.value.rating),
    updateOptions: (options) => inGameSend.updateRatingPresetOptions(options),

    playerSelection
  }
}
