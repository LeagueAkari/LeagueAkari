import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import type { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import type {
  InGameSendFixedTextPresetItem,
  InGameSendFixedTextPresetItemMoveDirection,
  InGameSendFixedTextPresetItemPatch
} from '@shared/shards/in-game-send'
import { type ComputedRef, type InjectionKey, provide } from 'vue'

import type { GamePhase, PresetSlot } from '../types'
import { injectRequired } from './shared'

export interface FixedTextPresetContext {
  items: ComputedRef<InGameSendFixedTextPresetItem[]>
  gamePhase: ComputedRef<GamePhase>
  canSend: ComputedRef<boolean>

  getShortcutTargetId: (id: string) => string
  createItem: () => Promise<InGameSendFixedTextPresetItem>
  updateItem: (
    id: string,
    patch: InGameSendFixedTextPresetItemPatch
  ) => Promise<InGameSendFixedTextPresetItem>
  deleteItem: (id: string) => Promise<boolean>
  moveItem: (id: string, direction: InGameSendFixedTextPresetItemMoveDirection) => Promise<boolean>
  setShortcut: (id: string, shortcutId: string | null) => Promise<InGameSendFixedTextPresetItem>
  send: (id: string) => Promise<boolean>
}

export const FixedTextPresetContextKey: InjectionKey<FixedTextPresetContext> = Symbol(
  'InGameSendFixedTextPreset'
)

export const fixedTextPresetSlot: PresetSlot = 'fixedText'

export function provideFixedTextPreset(context: FixedTextPresetContext) {
  provide(FixedTextPresetContextKey, context)
}

export function useFixedTextPreset() {
  return injectRequired(FixedTextPresetContextKey, 'useFixedTextPreset')
}

interface FixedTextPresetDataOptions {
  inGameSend: InGameSendRenderer
  inGameSendStore: ReturnType<typeof useInGameSendStore>
  gamePhase: ComputedRef<GamePhase>
  canSend: ComputedRef<boolean>
  fixedTextPresetItems: ComputedRef<InGameSendFixedTextPresetItem[]>
}

export function useFixedTextPresetData({
  inGameSend,
  gamePhase,
  canSend,
  fixedTextPresetItems
}: FixedTextPresetDataOptions): FixedTextPresetContext {
  return {
    items: fixedTextPresetItems,
    gamePhase,
    canSend,

    getShortcutTargetId: (id) => InGameSendRenderer.getFixedTextPresetShortcutTargetId(id),
    createItem: () => inGameSend.createFixedTextPresetItem(),
    updateItem: (id, patch) => inGameSend.updateFixedTextPresetItem(id, patch),
    deleteItem: (id) => inGameSend.deleteFixedTextPresetItem(id),
    moveItem: (id, direction) => inGameSend.moveFixedTextPresetItem(id, direction),
    setShortcut: (id, shortcutId) =>
      inGameSend.updateFixedTextPresetItem(id, { shortcut: shortcutId }),
    send: (id) => inGameSend.sendFixedTextPreset(id)
  }
}
