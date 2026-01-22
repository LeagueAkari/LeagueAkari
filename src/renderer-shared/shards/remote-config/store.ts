import {
  LeagueServersConfig,
  OngoingGameConfig,
  SupportedQueues
} from '@shared/schemas/remote-config'
import { LatestReleaseInfo } from '@shared/types/akari'
import { Announcement } from '@shared/types/shards/remote-config'
import { defineStore } from 'pinia'
import { ref, shallowReactive, shallowRef } from 'vue'

export const useRemoteConfigStore = defineStore('shard:remote-config-renderer', () => {
  const announcement = ref<Announcement | null>(null)
  const latestRelease = shallowRef<LatestReleaseInfo | null>(null)

  const leagueServers = shallowRef<LeagueServersConfig>({
    version: 0,
    lastUpdate: 0,
    servers: {},
    serverNames: {},
    tencentServerMatchHistoryInteroperability: [],
    tencentServerSpectatorInteroperability: [],
    tencentServerSummonerInteroperability: []
  })

  const supportedQueues = shallowRef<SupportedQueues>({
    version: 0,
    lastUpdate: 0,
    queues: []
  })

  const ongoingGameConfig = shallowRef<OngoingGameConfig>({
    version: 0,
    lastUpdate: 0,
    spotlight: {
      deobfuscation: false,
      gsmByPuuid: false,
      spectatorByPuuid: false
    }
  })

  const isUpdatingLatestRelease = ref(false)
  const isUpdatingAnnouncement = ref(false)
  const isUpdatingLeagueServers = ref(false)
  const isUpdatingSupportedQueues = ref(false)
  const isUpdatingOngoingGameConfig = ref(false)

  const settings = shallowReactive({
    preferredSource: 'gitee' as 'gitee' | 'github',
    updateLatestRelease: true
  })

  return {
    announcement,
    latestRelease,
    leagueServers,
    supportedQueues,
    ongoingGameConfig,
    settings,

    isUpdatingLatestRelease,
    isUpdatingAnnouncement,
    isUpdatingLeagueServers,
    isUpdatingSupportedQueues,
    isUpdatingOngoingGameConfig
  }
})
