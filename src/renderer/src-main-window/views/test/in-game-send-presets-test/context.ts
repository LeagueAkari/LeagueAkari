import type { ComputedRef, InjectionKey, Ref } from 'vue'
import { inject, provide } from 'vue'

import type {
  DemoTeam,
  PremadeColors,
  PremadeTeamView,
  Preset,
  PresetTarget,
  PresetTargetId,
  PreviewedLines
} from './types'

export interface PresetDisplayOption {
  label: string
  value: string
  description: string
}

export interface PresetScopeContext {
  preset: Preset
  targets: PresetTarget[]
  shortcuts: Record<PresetTargetId, string | null>
  canSend: ComputedRef<boolean>
  sendButtonText: ComputedRef<string>
  sendDisabledReason: ComputedRef<string>
  previewedLines: ComputedRef<PreviewedLines | null>
  setShortcut: (targetId: PresetTargetId, shortcutId: string | null) => void
  send: (target: PresetTarget) => Promise<void>
  dryRun: (target: PresetTarget) => Promise<void>
  closePreview: () => void
}

export interface PlayerSelectionPresetContext {
  teams: ComputedRef<DemoTeam[]>
  totalCount: ComputedRef<number>
  selectedCount: ComputedRef<number>
  selectedInTeam: (teamId: string) => number
  isTeamAllSelected: (teamId: string) => boolean
  isTeamIndeterminate: (teamId: string) => boolean
  isPlayerSelected: (puuid: string) => boolean
  setTeamSelected: (teamId: string, selected: boolean) => void
  setPlayerSelected: (puuid: string, selected: boolean) => void
  setAllSelected: (selected: boolean) => void
}

export interface PremadeSelectionPresetContext {
  totalCount: ComputedRef<number>
  teams: ComputedRef<PremadeTeamView[]>
  selectedGroupCount: ComputedRef<number>
  totalGroupCount: ComputedRef<number>
  colors: ComputedRef<PremadeColors>
  isBucketSelected: (groupIndex: number) => boolean
  setBucketSelected: (groupIndex: number, selected: boolean) => void
  setAllSelected: (selected: boolean) => void
  isTeamAllSelected: (teamId: string) => boolean
  isTeamIndeterminate: (teamId: string) => boolean
  setTeamSelected: (teamId: string, selected: boolean) => void
}

export interface RatingPresetContext extends PresetScopeContext {
  displayOptions: PresetDisplayOption[]
  selectedDisplayItems: Ref<string[]>
  playerSelection: PlayerSelectionPresetContext
}

export interface JunglePresetContext extends PresetScopeContext {
  displayOptions: PresetDisplayOption[]
  selectedDisplayItems: Ref<string[]>
  playerSelection: PlayerSelectionPresetContext
}

export interface PremadePresetContext extends PresetScopeContext {
  premadeSelection: PremadeSelectionPresetContext
}

export interface InGameSendPresetsTestContext {
  rating: RatingPresetContext
  jungle: JunglePresetContext
  premade: PremadePresetContext
}

export const InGameSendPresetsTestContextKey: InjectionKey<InGameSendPresetsTestContext> = Symbol(
  'InGameSendPresetsTestContext'
)
export const CurrentPresetContextKey: InjectionKey<PresetScopeContext> =
  Symbol('CurrentInGameSendPreset')
export const PlayerSelectionPresetContextKey: InjectionKey<PlayerSelectionPresetContext> = Symbol(
  'InGameSendPlayerSelectionPreset'
)
export const PremadeSelectionPresetContextKey: InjectionKey<PremadeSelectionPresetContext> = Symbol(
  'InGameSendPremadeSelectionPreset'
)

function injectRequired<T>(key: InjectionKey<T>, name: string) {
  const context = inject(key)

  if (!context) {
    throw new Error(`${name} must be used within InGameSendPresetsTest`)
  }

  return context
}

export function provideInGameSendPresetsTest(context: InGameSendPresetsTestContext) {
  provide(InGameSendPresetsTestContextKey, context)
}

export function useInGameSendPresetsTest() {
  return injectRequired(InGameSendPresetsTestContextKey, 'useInGameSendPresetsTest')
}

export function useRatingPreset() {
  return useInGameSendPresetsTest().rating
}

export function useJunglePreset() {
  return useInGameSendPresetsTest().jungle
}

export function usePremadePreset() {
  return useInGameSendPresetsTest().premade
}

export function provideCurrentPreset(preset: PresetScopeContext) {
  provide(CurrentPresetContextKey, preset)
}

export function useCurrentPreset() {
  return injectRequired(CurrentPresetContextKey, 'useCurrentPreset')
}

export function providePlayerSelectionPreset(selection: PlayerSelectionPresetContext) {
  provide(PlayerSelectionPresetContextKey, selection)
}

export function usePlayerSelectionPreset() {
  return injectRequired(PlayerSelectionPresetContextKey, 'usePlayerSelectionPreset')
}

export function providePremadeSelectionPreset(selection: PremadeSelectionPresetContext) {
  provide(PremadeSelectionPresetContextKey, selection)
}

export function usePremadeSelectionPreset() {
  return injectRequired(PremadeSelectionPresetContextKey, 'usePremadeSelectionPreset')
}
