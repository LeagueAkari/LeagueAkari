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
  targetGameModes: {
    gameMode: string
    queueTypes: string[]
  }[]
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
export interface DelayedBenchSwap {
  championId: number
  delayMs: number
  startAt: number
  finishAt: number
}

// copied from main shard
export interface DelayedChampionSwap {
  action: 'accept' | 'decline'
  tradeId: number
  delayMs: number
  startAt: number
  finishAt: number
  requesterChampionId: number
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
  const delayedBenchSwap = shallowRef<DelayedBenchSwap | null>(null)
  const delayedChampionSwap = shallowRef<DelayedChampionSwap | null>(null)

  const expectedPicks = shallowRef<ExpectedChampionStatus[] | null>(null)
  const expectedBans = shallowRef<ExpectedChampionStatus[] | null>(null)
  const expectedSwaps = shallowRef<ExpectedChampionStatus[] | null>(null)

  const temporarilyDisabled = shallowRef(false)
  const activeGroupConfigId = shallowRef<string | null>(null)

  return {
    settings,

    groups,

    delayedBan,
    delayedPick,
    delayedBenchSwap,
    delayedChampionSwap,
    expectedPicks,
    expectedBans,
    expectedSwaps,

    temporarilyDisabled,
    activeGroupConfigId
  }
})
