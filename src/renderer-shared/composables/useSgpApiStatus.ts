import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { type MaybeRefOrGetter, computed, toValue } from 'vue'

export type SgpApiStatus = {
  canUse: boolean
  isReady: boolean
}

export function useSgpApiStatus(sgpServerId?: MaybeRefOrGetter<string>) {
  const sgps = useSgpStore()

  return computed<SgpApiStatus>(() => {
    const effectiveSgpServerId =
      sgpServerId === undefined ? sgps.availability.sgpServerId : toValue(sgpServerId)

    if (!effectiveSgpServerId || !sgps.leagueServers.servers[effectiveSgpServerId]) {
      return {
        canUse: false,
        isReady: false
      }
    }

    return {
      canUse: true,
      isReady: sgps.isTokenReady
    }
  })
}
