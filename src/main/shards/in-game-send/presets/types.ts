import type { AggregatedAnalysis } from '@shared/data-adapter/analysis/player'
import type { InGameSendPresetTarget } from '@shared/shards/in-game-send'
import type { AdditionalResult } from '@shared/shards/ongoing-game'

import type { InGameSendMainContext } from '../context'

export interface InGameSendPresetPlayer {
  puuid: string
  championId: number
  gameName: string
  tagLine: string
  position: string | null
  premadeGroup?: number
  analysis?: AggregatedAnalysis
  spells?: AdditionalResult['spells'][string]
}

export interface InGameSendPresetTeam {
  teamIdentifier: string
  label: string
  primaryLabel: string
  players: InGameSendPresetPlayer[]
}

export interface InGameSendPresetContext {
  target: InGameSendPresetTarget
  mainContext: InGameSendMainContext
}
