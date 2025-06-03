import { GithubApiAsset, GithubApiLatestRelease } from '@shared/types/github'
import { defineStore } from 'pinia'
import { ref, shallowReactive, shallowRef } from 'vue'

// copied from main
export interface Announcement {
  content: string
  uniqueId: string
}

// copied from main
export interface LatestReleaseWithMetadata extends GithubApiLatestRelease {
  isNew: boolean
  currentVersion: string
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
