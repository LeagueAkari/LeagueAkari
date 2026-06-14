import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import type { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import type {
  InGameSendJunglePresetOptions,
  InGameSendPresetOptionPatch,
  InGameSendPresetOptions
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

export interface JunglePresetContext extends PresetScopeContext {
  options: ComputedRef<InGameSendJunglePresetOptions>
  updateOptions: (options: InGameSendPresetOptionPatch<'jungle'>) => Promise<void>
  playerSelection: PlayerSelectionPresetContext
}

export const JunglePresetContextKey: InjectionKey<JunglePresetContext> =
  Symbol('InGameSendJunglePreset')

export const junglePresetSlot: PresetSlot = 'jungle'

export function provideJunglePreset(context: JunglePresetContext) {
  provide(JunglePresetContextKey, context)
}

export function useJunglePreset() {
  return injectRequired(JunglePresetContextKey, 'useJunglePreset')
}

interface JunglePresetDataOptions {
  inGameSend: InGameSendRenderer
  inGameSendStore: ReturnType<typeof useInGameSendStore>
  gamePhase: ComputedRef<GamePhase>
  canSend: ComputedRef<boolean>
  teamsWithPlayers: ComputedRef<InGameSendTeam[]>
  allPuuids: ComputedRef<string[]>
  totalCount: ComputedRef<number>
  presetOptions: ComputedRef<InGameSendPresetOptions>
}

export function useJunglePresetData({
  inGameSend,
  inGameSendStore,
  gamePhase,
  canSend,
  teamsWithPlayers,
  allPuuids,
  totalCount,
  presetOptions
}: JunglePresetDataOptions): JunglePresetContext {
  const previewedLines = ref<PreviewedLines | null>(null)

  const playerSelection = usePlayerSelection({
    teamsWithPlayers,
    allPuuids,
    totalCount,
    selectedPuuids: computed(() => inGameSendStore.state.junglePuuids),
    setSelectedPuuids: (puuids) => inGameSend.setJunglePuuids(puuids)
  })

  return {
    shortcutTargetIds: createShortcutTargetIds(InGameSendRenderer.getJunglePresetShortcutTargetId),
    shortcuts: computed(() => presetOptions.value.jungle.targetShortcuts),

    gamePhase,
    canSend,

    previewedLines: computed(() => previewedLines.value),

    setShortcut: (targetId, shortcutId) =>
      inGameSend.updateJunglePresetOptions({
        targetShortcuts: createTargetShortcutPatch(targetId, shortcutId)
      }),

    send: (targetId) => inGameSend.sendJunglePreset(targetId),

    dryRun: async (targetId) => {
      const lines = await inGameSend.generateJunglePresetLines(targetId)
      previewedLines.value = createPreviewedLines(targetId, lines)
    },

    closePreview: () => {
      previewedLines.value = null
    },

    options: computed(() => presetOptions.value.jungle),
    updateOptions: (options) => inGameSend.updateJunglePresetOptions(options),

    playerSelection
  }
}
