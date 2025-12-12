import { GithubApiAsset, GithubApiLatestRelease } from '@shared/types/github'
import {
  LeagueServersConfig,
  OngoingGameConfig,
  SupportedQueues
} from '@shared/validators/remote-config'
import { defineStore } from 'pinia'
import { ref, shallowReactive, shallowRef } from 'vue'

// pre-defined
interface AnnouncementFrontMatter {
  /**
   * low: 不会提醒
   * medium: 只会提示
   * high: 会弹窗提醒
   */
  alertLevel?: 'low' | 'medium' | 'high'
}

// copied from main
export interface Announcement {
  content: string
  frontMatter: AnnouncementFrontMatter
  uniqueId: string
}

// copied from main
export interface LatestReleaseWithMetadata extends GithubApiLatestRelease {
  isNew: boolean
  currentVersion: string
  detailedChangelog: string | null
  archiveFile: GithubApiAsset | null
}

export const useRemoteConfigStore = defineStore('shard:remote-config-renderer', () => {
  const announcement = ref<Announcement | null>(null)
  const latestRelease = shallowRef<LatestReleaseWithMetadata | null>(null)

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
