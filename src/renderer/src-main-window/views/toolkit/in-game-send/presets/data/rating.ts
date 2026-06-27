import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import type { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import type {
  InGameSendRatingPresetOptionPatch,
  InGameSendRatingPresetOptions
} from '@shared/shards/in-game-send'
import { type ComputedRef, type InjectionKey, computed, provide } from 'vue'

import {
  type PlayerSelectionPresetContext,
  usePlayerSelection
} from '../composables/usePresetSelections'
import type { GamePhase, InGameSendTeam, PresetSlot } from '../types'
import {
  type PresetScopeContext,
  createShortcutTargetIds,
  injectRequired,
  usePresetScopeData
} from './shared'

export interface RatingPresetContext extends PresetScopeContext {
  options: ComputedRef<InGameSendRatingPresetOptions>
  updateOptions: (options: InGameSendRatingPresetOptionPatch) => Promise<void>
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
  ratingPresetOptions: ComputedRef<InGameSendRatingPresetOptions>
}

export function useRatingPresetData({
  inGameSend,
  inGameSendStore,
  gamePhase,
  canSend,
  teamsWithPlayers,
  allPuuids,
  totalCount,
  ratingPresetOptions
}: RatingPresetDataOptions): RatingPresetContext {
  const scope = usePresetScopeData({
    shortcutTargetIds: createShortcutTargetIds(InGameSendRenderer.getRatingPresetShortcutTargetId),
    shortcuts: computed(() => ratingPresetOptions.value.targetShortcuts),
    gamePhase,
    canSend,
    options: ratingPresetOptions,
    updateOptions: (options: InGameSendRatingPresetOptionPatch) =>
      inGameSend.updateRatingPresetOptions(options),
    createShortcutPatch: (targetId, shortcutId): InGameSendRatingPresetOptionPatch => ({
      targetShortcuts: {
        [targetId]: shortcutId
      }
    }),
    send: (targetId) => inGameSend.sendRatingPreset(targetId),
    generateLines: (targetId) => inGameSend.generateRatingPresetLines(targetId)
  })
  const playerSelection = usePlayerSelection({
    teamsWithPlayers,
    allPuuids,
    totalCount,
    selectedPuuids: computed(() => inGameSendStore.state.ratingPuuids),
    setSelectedPuuids: (puuids) => inGameSend.setRatingPuuids(puuids)
  })

  return {
    ...scope,
    playerSelection
  }
}
