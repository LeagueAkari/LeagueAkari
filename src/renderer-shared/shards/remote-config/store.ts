import { GithubApiAsset, GithubApiLatestRelease } from '@shared/types/github'
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

  const isUpdatingLatestRelease = ref(false)
  const isUpdatingAnnouncement = ref(false)
  const isUpdatingSgpLeagueServers = ref(false)

  const settings = shallowReactive({
    preferredSource: 'gitee' as 'gitee' | 'github'
  })

  return {
    announcement,
    latestRelease,
    settings,

    isUpdatingLatestRelease,
    isUpdatingAnnouncement,
    isUpdatingSgpLeagueServers
  }
})
