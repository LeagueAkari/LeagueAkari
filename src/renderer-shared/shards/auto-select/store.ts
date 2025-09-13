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

// copied from main shard
export interface BanChampionConfig {
  enabled: boolean
  champions: PositionChampion
  delaySeconds: number
  strategy: AutoPickBanStrategy
  ignoreIntent: boolean
}

// copied from main shard
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

// copied from main shard
export interface DelayedBanPick {
  isPickIntent: boolean
  completed: boolean
  championId: number
  delayMs: number
  startAt: number
  finishAt: number
}

// copied from main shard
export interface DelayedSwap {
  championId: number
  delayMs: number
  startAt: number
  finishAt: number
}

export interface ExpectedChampionStatus {
  id: number
  status: string
}

export const useAutoSelectStore = defineStore('shard:auto-select-renderer', () => {
  const settings = shallowReactive({
    pickConfig: {} as Record<string, PickChampionConfig>,
    banConfig: {} as Record<string, BanChampionConfig>
  })

  const groups = shallowRef<AutoSelectGroup[]>([])

  const delayedBan = shallowRef<DelayedBanPick | null>(null)
  const delayedPick = shallowRef<DelayedBanPick | null>(null)
  const delayedSwap = shallowRef<DelayedSwap | null>(null)

  const expectedPicks = shallowRef<ExpectedChampionStatus[] | null>(null)
  const expectedBans = shallowRef<ExpectedChampionStatus[] | null>(null)
  const expectedSwaps = shallowRef<ExpectedChampionStatus[] | null>(null)

  return {
    settings,

    groups,

    delayedBan,
    delayedPick,
    delayedSwap,

    expectedPicks,
    expectedBans,
    expectedSwaps
  }
})
