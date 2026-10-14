import type {
  LanWebGameAssetKind,
  LanWebMatchDto,
  LanWebMatchHistoryDto,
  LanWebOngoingGameDto,
  LanWebPlayerDto,
  LanWebPlayerSearchDto,
  LanWebStatusDto
} from '@shared/shards/lan-web'

export class LanWebClientError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message)
  }
}

export class LanWebApiClient {
  getStatus() {
    return this._get<LanWebStatusDto>('/api/v1/status')
  }

  getOngoingGame() {
    return this._get<LanWebOngoingGameDto>('/api/v1/ongoing-game')
  }

  searchPlayers(query: string) {
    return this._get<LanWebPlayerSearchDto>(
      `/api/v1/players/search?query=${encodeURIComponent(query)}`
    )
  }

  getPlayer(serverId: string, puuid: string) {
    return this._get<LanWebPlayerDto>(
      `/api/v1/players/${encodeURIComponent(serverId)}/${encodeURIComponent(puuid)}`
    )
  }

  getMatchHistory(serverId: string, puuid: string, start = 0, count = 20) {
    return this._get<LanWebMatchHistoryDto>(
      `/api/v1/players/${encodeURIComponent(serverId)}/${encodeURIComponent(puuid)}/matches?start=${start}&count=${count}`
    )
  }

  getMatch(match: LanWebMatchDto) {
    const subject = match.subject?.puuid
      ? `?subject=${encodeURIComponent(match.subject.puuid)}`
      : ''
    return this._get<LanWebMatchDto>(
      `/api/v1/matches/${encodeURIComponent(match.sgpServerId)}/${match.source}/${match.gameId}${subject}`
    )
  }

  assetUrl(kind: LanWebGameAssetKind, id: number) {
    return `/api/v1/assets/${kind}/${id}`
  }

  createEventSource() {
    return new EventSource('/api/v1/events')
  }

  private async _get<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      cache: 'no-store'
    })
    const body = await response.json()
    if (!response.ok) {
      throw new LanWebClientError(
        body.error?.code || 'REQUEST_FAILED',
        body.error?.message || 'Request failed'
      )
    }
    return body as T
  }
}
