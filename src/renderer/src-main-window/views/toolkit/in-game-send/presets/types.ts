import type { InGameSendPresetTarget } from '@shared/shards/in-game-send'

export type GamePhase = 'none' | 'lobby' | 'champ-select' | 'in-game' | 'draft'
export type PresetSlot = 'rating' | 'jungle' | 'premade'
export type PresetTargetId = InGameSendPresetTarget

export interface PresetDisplayOption<T extends string> {
  label: string
  value: T
  description: string
}

export interface PreviewedLines {
  targetId: PresetTargetId
  createdAt: number
  lines: string[]
}

export interface InGameSendPlayer {
  puuid: string
  championId: number
  hasChampionSelection: boolean
  profileIconId: number
  gameName: string
  tagLine: string
  premadeGroup?: number
}

export interface InGameSendTeam {
  teamIdentifier: string
  label: string
  primaryLabel: string
  secondaryLabel?: string
  indicatorColorClass: string | null
  players: InGameSendPlayer[]
}

export interface PremadeBucket {
  key: string
  groupIndex: number
  groupLetter: string
  players: InGameSendPlayer[]
}

export interface PremadeTeamView {
  team: InGameSendTeam
  groups: PremadeBucket[]
}

export interface PremadeColor {
  foregroundColor: string
  color: string
  borderColor: string
}

export type PremadeColors = Record<string, PremadeColor | undefined>
