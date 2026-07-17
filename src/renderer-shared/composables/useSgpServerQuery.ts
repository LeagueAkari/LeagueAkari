import { useSgpStore } from '@renderer-shared/shards/sgp/store'

export function useSgpServerQuery() {
  const sgps = useSgpStore()

  const canQueryServer = (targetServerId: string) => {
    const currentServerId = sgps.availability.sgpServerId

    if (currentServerId === targetServerId) {
      return true
    }

    return (
      sgps.leagueServers.servers[currentServerId]?.isTencent === true &&
      sgps.leagueServers.servers[targetServerId]?.isTencent === true
    )
  }

  return { canQueryServer }
}
