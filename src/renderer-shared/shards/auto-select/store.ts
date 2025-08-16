import { ChampSelectTeam } from '@shared/types/league-client/champ-select'
import { defineStore } from 'pinia'
import { shallowReactive, shallowRef } from 'vue'

// copied from main shard
interface UpcomingBanPick {
  championId: number
  isActingNow: boolean
  action: {
    id: number
    isInProgress: boolean
    completed: boolean
  }
}

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

// copied from main shard
export interface PickChampionConfig {
  enabled: boolean
  champions: PositionChampion
  delaySeconds: number
  pickTeammateIntendedChampion: boolean
  pickStrategy: string

  // bench mode only
  benchSelectFirstAvailableChampion: boolean
  benchSwapAccumulatedDelaySeconds: number
  benchHandleTradeEnabled: boolean
}

export interface BanChampionConfig {
  enabled: boolean
  champions: PositionChampion
  delaySeconds: number
  banTeammateIntendedChampion: boolean
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
    normalModeEnabled: false,
    expectedChampions: {
      top: [],
      jungle: [],
      middle: [],
      bottom: [],
      utility: [],
      default: []
    },
    selectTeammateIntendedChampion: false,
    showIntent: false,
    pickStrategy: 'lock-in',
    lockInDelaySeconds: 0,
    benchModeEnabled: false,
    benchSelectFirstAvailableChampion: false,
    benchHandleTradeEnabled: false,
    benchExpectedChampions: [],
    grabDelaySeconds: 1,
    banEnabled: false,
    banDelaySeconds: 0,
    bannedChampions: {
      top: [],
      jungle: [],
      middle: [],
      bottom: [],
      utility: [],
      default: []
    },
    banTeammateIntendedChampion: false,

    pickConfig: {} as Record<string, PickChampionConfig>,
    banConfig: {} as Record<string, BanChampionConfig>
  })

  const targetPick = shallowRef<UpcomingBanPick | null>(null)
  const targetBan = shallowRef<UpcomingBanPick | null>(null)
  const memberMe = shallowRef<ChampSelectTeam | null>(null)
  const upcomingGrab = shallowRef<{ championId: number; willGrabAt: number } | null>(null)
  const upcomingPick = shallowRef<{ championId: number; willPickAt: number } | null>(null)
  const upcomingBan = shallowRef<{ championId: number; willBanAt: number } | null>(null)
  const groups = shallowRef<AutoSelectGroup[]>([])

  return {
    settings,

    targetPick,
    targetBan,
    upcomingGrab,
    memberMe,
    upcomingPick,
    upcomingBan,
    groups
  }
})
