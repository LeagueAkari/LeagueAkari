import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import type { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import type {
  InGameSendJunglePresetOptionPatch,
  InGameSendJunglePresetOptions
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

export interface JunglePresetContext extends PresetScopeContext {
  options: ComputedRef<InGameSendJunglePresetOptions>
  updateOptions: (options: InGameSendJunglePresetOptionPatch) => Promise<void>
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
  junglePresetOptions: ComputedRef<InGameSendJunglePresetOptions>
}

export function useJunglePresetData({
  inGameSend,
  inGameSendStore,
  gamePhase,
  canSend,
  teamsWithPlayers,
  allPuuids,
  totalCount,
  junglePresetOptions
}: JunglePresetDataOptions): JunglePresetContext {
  const scope = usePresetScopeData({
    shortcutTargetIds: createShortcutTargetIds(InGameSendRenderer.getJunglePresetShortcutTargetId),
    shortcuts: computed(() => junglePresetOptions.value.targetShortcuts),
    gamePhase,
    canSend,
    options: junglePresetOptions,
    updateOptions: (options: InGameSendJunglePresetOptionPatch) =>
      inGameSend.updateJunglePresetOptions(options),
    createShortcutPatch: (targetId, shortcutId): InGameSendJunglePresetOptionPatch => ({
      targetShortcuts: {
        [targetId]: shortcutId
      }
    }),
    send: (targetId) => inGameSend.sendJunglePreset(targetId),
    generateLines: (targetId) => inGameSend.generateJunglePresetLines(targetId)
  })
  const playerSelection = usePlayerSelection({
    teamsWithPlayers,
    allPuuids,
    totalCount,
    selectedPuuids: computed(() => inGameSendStore.state.junglePuuids),
    setSelectedPuuids: (puuids) => inGameSend.setJunglePuuids(puuids)
  })

  return {
    ...scope,
    playerSelection
  }
}
