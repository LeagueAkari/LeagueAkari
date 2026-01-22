import { AutoSelectGroup } from '@shared/schemas/remote-config'
import {
  BanChampionConfig,
  DelayedBanPick,
  DelayedBenchSwap,
  DelayedChampionSwap,
  ExpectedChampionStatus,
  PickChampionConfig
} from '@shared/types/shards/auto-select'
import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

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
