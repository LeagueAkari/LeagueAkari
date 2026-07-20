import type { AkariAutoSelectGroup } from './types'

export function isAutoSelectGroupSupportedOnSgpServer(
  group: Pick<AkariAutoSelectGroup, 'supportedSgpServers'>,
  sgpServerId: string,
  leagueServers: Readonly<Record<string, unknown>>
) {
  if (group.supportedSgpServers.includes('*')) {
    return true
  }

  return (
    Boolean(sgpServerId) &&
    Object.hasOwn(leagueServers, sgpServerId) &&
    group.supportedSgpServers.includes(sgpServerId)
  )
}
