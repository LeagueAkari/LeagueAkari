import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

interface PositionChampion {
  // non-ranked queues
  default: number[]

  // ranked queues
  top: number[]
  jungle: number[]
  middle: number[]
  bottom: number[]
  utility: number[]
}

export type AutoPickBanStrategy = 'just-show' | 'show-and-lock-in'

// copied from main shard
export interface PickChampionConfig {
  enabled: boolean
  champions: PositionChampion
  delaySeconds: number
  ignoreIntent: boolean
  strategy: AutoPickBanStrategy
  showIntent: boolean

  // bench mode only
  benchSelectFirstAvailableChampion: boolean
  benchSwapAccumulatedDelaySeconds: number
  benchHandleTradeEnabled: boolean
}

export interface BanChampionConfig {
  enabled: boolean
  champions: PositionChampion
  delaySeconds: number
  strategy: AutoPickBanStrategy
  ignoreIntent: boolean
}

export interface AutoSelectGroup {
  groupId: string
  targetGameMode: string
  targetQueueTypes: string[] | null
  positions: string[]
  additionalPicks: number[]
  additionalBans: number[]
  excludedPicks: number[]
  excludedBans: number[]
}

export const useAutoSelectStore = defineStore('shard:auto-select-renderer', () => {
  const settings = shallowReactive({
    pickConfig: {} as Record<string, PickChampionConfig>,
    banConfig: {} as Record<string, BanChampionConfig>
  })

  const groups = shallowRef<AutoSelectGroup[]>([])

  return {
    settings,

    groups
  }
})
