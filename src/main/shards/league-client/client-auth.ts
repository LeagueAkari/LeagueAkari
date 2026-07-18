import type { UxCommandLine } from '@shared/shards/league-client-ux'

export type ClientCredentialChange = 'none' | 'riot-client' | 'league-client'

export function classifyClientCredentialChange(
  current: UxCommandLine,
  next: UxCommandLine
): ClientCredentialChange {
  if (current.port !== next.port || current.authToken !== next.authToken) {
    return 'league-client'
  }

  if (
    current.riotClientPort !== next.riotClientPort ||
    current.riotClientAuthToken !== next.riotClientAuthToken
  ) {
    return 'riot-client'
  }

  return 'none'
}

export function getClientAuthLogMetadata(auth: UxCommandLine) {
  const {
    authToken: _authToken,
    certificate: _certificate,
    riotClientAuthToken: _riotToken,
    ...rest
  } = auth

  return rest
}
