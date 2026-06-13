import type { InGameSendPresetId, InGameSendPresetTarget } from '@shared/types/shards/in-game-send'
import type { Component } from 'vue'

export type GamePhase = 'none' | 'lobby' | 'champ-select' | 'in-game' | 'draft'
export type PresetId = InGameSendPresetId
export type PresetTargetId = InGameSendPresetTarget
export type PlayerSelectionPresetId = Extract<PresetId, 'rating' | 'jungle'>

export interface PresetTarget {
  id: PresetTargetId
  label: string
  description: string
  buttonType: 'error' | 'primary' | 'default'
  icon: Component
}

export interface Preset {
  id: PresetId
  label: string
  description: string
  hasTeamSelection?: boolean
}

export interface PreviewedLines {
  presetId: PresetId
  preset: string
  target: string
  lines: string[]
}

export type PreviewedLinesByPresetId = Record<PresetId, PreviewedLines | null>

export interface DemoPlayer {
  puuid: string
  championId: number
  gameName: string
  tagLine: string
  premadeGroup?: number
}

export interface DemoTeam {
  id: string
  label: string
  primaryLabel: string
  secondaryLabel?: string
  indicatorColorClass: string | null
  players: DemoPlayer[]
}

export interface PremadeBucket {
  key: string
  groupIndex: number
  groupLetter: string
  players: DemoPlayer[]
}

export interface PremadeTeamView {
  team: DemoTeam
  groups: PremadeBucket[]
}

export interface PremadeColor {
  foregroundColor: string
  color: string
  borderColor: string
}

export type PremadeColors = Record<string, PremadeColor | undefined>
