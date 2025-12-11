import { SummonerInfo } from '@shared/types/league-client/summoner'
import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

export type ConnectableClientExtraInfo = {
  summoner: SummonerInfo
  profileIcon: string
  lastUpdate: number
}

export const useLeagueClientPeekStore = defineStore('shard:league-client-peek-renderer', () => {
  const connectableClientExtraInfo = shallowReactive<Record<string, ConnectableClientExtraInfo>>({})

  return {
    connectableClientExtraInfo
  }
})
