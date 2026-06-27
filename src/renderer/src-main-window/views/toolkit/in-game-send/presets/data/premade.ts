import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import type { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import type {
  InGameSendPremadePresetOptionPatch,
  InGameSendPremadePresetOptions
} from '@shared/shards/in-game-send'
import { type ComputedRef, type InjectionKey, computed, provide } from 'vue'

import {
  type PremadeSelectionPresetContext,
  usePremadeSelection
} from '../composables/usePresetSelections'
import type { GamePhase, InGameSendTeam, PresetSlot } from '../types'
import {
  type PresetScopeContext,
  createShortcutTargetIds,
  injectRequired,
  usePresetScopeData
} from './shared'

export interface PremadePresetContext extends PresetScopeContext {
  options: ComputedRef<InGameSendPremadePresetOptions>
  updateOptions: (options: InGameSendPremadePresetOptionPatch) => Promise<void>
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
  premadePresetOptions: ComputedRef<InGameSendPremadePresetOptions>
}

export function usePremadePresetData({
  inGameSend,
  inGameSendStore,
  gamePhase,
  canSend,
  teamsWithPlayers,
  totalCount,
  premadePresetOptions
}: PremadePresetDataOptions): PremadePresetContext {
  const scope = usePresetScopeData({
    shortcutTargetIds: createShortcutTargetIds(InGameSendRenderer.getPremadePresetShortcutTargetId),
    shortcuts: computed(() => premadePresetOptions.value.targetShortcuts),
    gamePhase,
    canSend,
    options: premadePresetOptions,
    updateOptions: (options: InGameSendPremadePresetOptionPatch) =>
      inGameSend.updatePremadePresetOptions(options),
    createShortcutPatch: (targetId, shortcutId): InGameSendPremadePresetOptionPatch => ({
      targetShortcuts: {
        [targetId]: shortcutId
      }
    }),
    send: (targetId) => inGameSend.sendPremadePreset(targetId),
    generateLines: (targetId) => inGameSend.generatePremadePresetLines(targetId)
  })
  const premadeSelection = usePremadeSelection({
    teamsWithPlayers,
    totalCount,
    selectedIndices: computed(() => inGameSendStore.state.premadeIndices),
    setSelectedIndices: (indices) => inGameSend.setPremadeIndices(indices)
  })

  return {
    ...scope,
    premadeSelection
  }
}
