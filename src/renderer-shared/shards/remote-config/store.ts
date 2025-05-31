import { GithubApiLatestRelease } from '@shared/types/github'
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

// copied from main
export interface Announcement {
  content: string
  sha: string
}

export const useRemoteConfigStore = defineStore('shard:remote-config-renderer', () => {
  const announcement = ref<Announcement | null>(null)
  const latestRelease = shallowRef<GithubApiLatestRelease | null>(null)

  return {
    announcement,
    latestRelease
  }
})
