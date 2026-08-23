import { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import type {
  InGameSendCustomTemplateItem,
  InGameSendCustomTemplateItemPatch,
  InGameSendCustomTemplateLastError,
  InGameSendPresetTarget
} from '@shared/shards/in-game-send'
import { type ComputedRef, type InjectionKey, provide } from 'vue'

import type { GamePhase, PresetSlot } from '../types'
import { injectRequired } from './shared'

export interface CustomTemplatePresetContext {
  riskNoticeShown: ComputedRef<boolean>
  items: ComputedRef<InGameSendCustomTemplateItem[]>
  lastErrors: ComputedRef<Record<string, InGameSendCustomTemplateLastError>>
  gamePhase: ComputedRef<GamePhase>
  canSend: ComputedRef<boolean>

  getShortcutTargetId: (id: string, target: InGameSendPresetTarget) => string
  markRiskNoticeShown: () => Promise<void>
  createItem: () => Promise<InGameSendCustomTemplateItem>
  updateItem: (
    id: string,
    patch: InGameSendCustomTemplateItemPatch
  ) => Promise<InGameSendCustomTemplateItem>
  deleteItem: (id: string) => Promise<boolean>
  reorderItem: (id: string, targetIndex: number) => Promise<boolean>
  generateLines: (id: string, target: InGameSendPresetTarget) => Promise<string[]>
  send: (id: string, target: InGameSendPresetTarget) => Promise<boolean>
}

export const CustomTemplatePresetContextKey: InjectionKey<CustomTemplatePresetContext> = Symbol(
  'InGameSendCustomTemplatePreset'
)

export const customTemplatePresetSlot: PresetSlot = 'customTemplate'

export function provideCustomTemplatePreset(context: CustomTemplatePresetContext) {
  provide(CustomTemplatePresetContextKey, context)
}

export function useCustomTemplatePreset() {
  return injectRequired(CustomTemplatePresetContextKey, 'useCustomTemplatePreset')
}

interface CustomTemplatePresetDataOptions {
  inGameSend: InGameSendRenderer
  gamePhase: ComputedRef<GamePhase>
  canSend: ComputedRef<boolean>
  riskNoticeShown: ComputedRef<boolean>
  items: ComputedRef<InGameSendCustomTemplateItem[]>
  lastErrors: ComputedRef<Record<string, InGameSendCustomTemplateLastError>>
}

export function useCustomTemplatePresetData({
  inGameSend,
  gamePhase,
  canSend,
  riskNoticeShown,
  items,
  lastErrors
}: CustomTemplatePresetDataOptions): CustomTemplatePresetContext {
  return {
    riskNoticeShown,
    items,
    lastErrors,
    gamePhase,
    canSend,

    getShortcutTargetId: (id, target) =>
      InGameSendRenderer.getCustomTemplateShortcutTargetId(id, target),
    markRiskNoticeShown: () => inGameSend.markCustomTemplateRiskNoticeShown(),
    createItem: () => inGameSend.createCustomTemplateItem(),
    updateItem: (id, patch) => inGameSend.updateCustomTemplateItem(id, patch),
    deleteItem: (id) => inGameSend.deleteCustomTemplateItem(id),
    reorderItem: (id, targetIndex) => inGameSend.reorderCustomTemplateItem(id, targetIndex),
    generateLines: (id, target) => inGameSend.generateCustomTemplateLines(id, target),
    send: (id, target) => inGameSend.sendCustomTemplate(id, target)
  }
}
