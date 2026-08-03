import { analyzeGames } from '@shared/data-adapter/analysis/player'
import type { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import type {
  LanWebMatchDto,
  LanWebMatchHistoryDto,
  LanWebOngoingGameDto,
  LanWebPlayerDto,
  LanWebPlayerSearchDto,
  LanWebRankedEntryDto,
  LanWebStatusDto
} from '@shared/shards/lan-web'

import type { LanWebMainContext } from './context'
import {
  toLanWebAnalysis,
  toLanWebMatch,
  toLanWebOngoingRecentMatch,
  toLanWebRankedEntries
} from './dto'

const PUUID_PATTERN = /^[0-9a-fA-F-]{36}$/
const MAX_SEARCH_RESULTS = 20
const MAX_HISTORY_COUNT = 50

export class LanWebApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string
  ) {
    super(message)
  }
}

export class LanWebReadOnlyApiController {
  constructor(private readonly _context: LanWebMainContext) {}

  getStatus(): LanWebStatusDto {
    const { leagueClient, sgp } = this._context
    const currentSgpServerId = sgp.state.availability.sgpServerId || null
    const summoner = leagueClient.data.summoner.me
    return {
      service: 'league-akari-lan-web',
      leagueClientConnected: leagueClient.state.isConnected,
      leagueClientConnectionState: leagueClient.state.connectionState,
      currentSgpServerId,
      currentPlayer:
        summoner && currentSgpServerId
          ? {
              puuid: summoner.puuid,
              gameName: summoner.gameName || summoner.displayName,
              tagLine: summoner.tagLine || '',
              profileIconId: summoner.profileIconId,
              summonerLevel: summoner.summonerLevel,
              privacy: summoner.privacy,
              sgpServerId: currentSgpServerId
            }
          : null,
      sgpMatchHistoryAvailable: Boolean(
        sgp.state.availability.serversSupported.matchHistory && sgp.state.isTokenReady
      ),
      updatedAt: Date.now()
    }
  }

  getOngoingGame(): LanWebOngoingGameDto {
    const { leagueClient, ongoingGame } = this._context
    const state = ongoingGame.state
    const queryStage = state.queryStage
    const sgpServerId = this._context.sgp.state.availability.sgpServerId
    const selfPuuid = leagueClient.data.summoner.me?.puuid

    return {
      leagueClientConnected: leagueClient.state.isConnected,
      phase: queryStage.phase,
      gameInfo: queryStage.gameInfo ? { ...queryStage.gameInfo } : null,
      teams: Object.entries(state.teams).map(([teamId, puuids]) => ({
        id: teamId,
        players: puuids.map((puuid) => {
          const summoner = state.summoner[puuid]
          const savedInfo = state.savedInfo[puuid]
          const tags = [
            savedInfo?.tag,
            ...(savedInfo?.tags.filter((tag) => tag.markedBySelf).map((tag) => tag.tag) ?? [])
          ].filter((tag): tag is string => Boolean(tag))
          const recentMatches = (state.matchHistory[puuid]?.data ?? [])
            .map((summary) => toLanWebOngoingRecentMatch(summary, sgpServerId, puuid))
            .filter((match): match is NonNullable<typeof match> => match !== null)
            .slice(0, 10)
          return {
            puuid,
            sgpServerId,
            gameName: summoner?.gameName || summoner?.displayName || 'Unknown Player',
            tagLine: summoner?.tagLine || '',
            profileIconId: summoner?.profileIconId || 0,
            summonerLevel: summoner?.summonerLevel || 0,
            championId: state.championSelections[puuid] || null,
            position: state.positionAssignments[puuid]?.position || null,
            teamId,
            premadeTeamId: state.mergedPremadeTeamMap[puuid] || null,
            isSelf: puuid === selfPuuid,
            ranked: toLanWebRankedEntries(state.rankedStats[puuid]),
            tags: [...new Set(tags)],
            recentMatches,
            loadingState: state.matchHistoryLoadingState[puuid] || null,
            analysis: toLanWebAnalysis(state.analysis?.players[puuid])
          }
        })
      })),
      updatedAt: Date.now()
    }
  }

  async searchPlayers(query: string, requestedServerId?: string): Promise<LanWebPlayerSearchDto> {
    this._assertLeagueClientConnected()
    const normalized = query.trim()
    if (!normalized || normalized.length > 80) {
      throw new LanWebApiError(
        400,
        'INVALID_QUERY',
        'Search text must be between 1 and 80 characters'
      )
    }

    const serverId = this._resolveServerId(requestedServerId)
    if (PUUID_PATTERN.test(normalized)) {
      const player = await this.getPlayer(serverId, normalized)
      return { query: normalized, results: [player] }
    }

    const hashIndex = normalized.lastIndexOf('#')
    const gameName = hashIndex >= 0 ? normalized.slice(0, hashIndex).trim() : normalized
    const tagLine = hashIndex >= 0 ? normalized.slice(hashIndex + 1).trim() : undefined
    const { data: aliases } =
      await this._context.riotClient.api.playerAccount.getPlayerAccountAlias(gameName, tagLine)

    const results: LanWebPlayerDto[] = []
    for (const alias of aliases.slice(0, MAX_SEARCH_RESULTS)) {
      try {
        results.push(
          await this.getPlayer(serverId, alias.puuid, alias.alias.game_name, alias.alias.tag_line)
        )
      } catch (error) {
        this._context.logger.debug('Skipped unavailable LAN Web player search result', error)
      }
    }

    return { query: normalized, results }
  }

  async getPlayer(
    serverId: string,
    puuid: string,
    fallbackGameName?: string,
    fallbackTagLine?: string
  ): Promise<LanWebPlayerDto> {
    this._assertLeagueClientConnected()
    const normalizedServerId = this._resolveServerId(serverId)

    if (normalizedServerId === this._context.sgp.state.availability.sgpServerId) {
      const { data } = await this._context.leagueClient.api.summoner.getSummonerByPuuid(puuid)
      return {
        puuid: data.puuid,
        gameName: data.gameName || data.displayName,
        tagLine: data.tagLine || '',
        profileIconId: data.profileIconId,
        summonerLevel: data.summonerLevel,
        privacy: data.privacy,
        sgpServerId: normalizedServerId
      }
    }

    this._assertSgpServerAvailable(normalizedServerId)
    const [{ data: summoners }, names] = await Promise.all([
      this._context.sgp.api.summonerLedge.postSummonersByPuuids([puuid], {
        __sgpServerId: normalizedServerId
      }),
      fallbackGameName
        ? Promise.resolve({ gameName: fallbackGameName, tagLine: fallbackTagLine || '' })
        : this._getPlayerName(puuid)
    ])
    const summoner = summoners[0]
    if (!summoner) {
      throw new LanWebApiError(404, 'PLAYER_NOT_FOUND', 'Player was not found')
    }

    return {
      puuid: summoner.puuid,
      gameName: names.gameName || summoner.name,
      tagLine: names.tagLine,
      profileIconId: summoner.profileIconId,
      summonerLevel: summoner.level,
      privacy: summoner.privacy,
      sgpServerId: normalizedServerId
    }
  }

  async getMatchHistory(
    serverId: string,
    puuid: string,
    startIndex: number,
    requestedCount: number
  ): Promise<LanWebMatchHistoryDto> {
    this._assertLeagueClientConnected()
    if (!Number.isFinite(startIndex) || !Number.isFinite(requestedCount)) {
      throw new LanWebApiError(400, 'INVALID_PAGINATION', 'Invalid match history pagination')
    }
    const normalizedServerId = this._resolveServerId(serverId)
    const count = Math.min(Math.max(Math.trunc(requestedCount), 1), MAX_HISTORY_COUNT)
    const start = Math.max(Math.trunc(startIndex), 0)
    const player = await this.getPlayer(normalizedServerId, puuid)
    const source = this._selectMatchHistorySource(normalizedServerId)
    let games: LcuOrSgpGameSummary[]

    if (source === 'sgp') {
      const { data } =
        await this._context.sgp.api.matchHistoryQuery.getMatchHistorySummaryByPlayerPuuid(puuid, {
          startIndex: start,
          count,
          __sgpServerId: normalizedServerId
        })
      games = data.games.map((game) => ({ source: 'sgp', gameId: game.json.gameId, data: game }))
    } else {
      const { data } = await this._context.leagueClient.api.matchHistory.getMatchHistory(
        puuid,
        start,
        start + count - 1
      )
      games = data.games.games.map((game) => ({ source: 'lcu', gameId: game.gameId, data: game }))
    }

    const analysis = analyzeGames(
      games.map((summary) => ({ gameId: summary.gameId, summary })),
      puuid
    )
    const ranked = await this._getRankedEntries(normalizedServerId, puuid)

    return {
      player,
      source,
      analysis: toLanWebAnalysis(analysis ?? undefined),
      ranked,
      startIndex: start,
      count: games.length,
      hasMore: games.length === count,
      games: games.map((game) => toLanWebMatch(game, normalizedServerId, puuid))
    }
  }

  async getMatch(
    serverId: string,
    source: 'lcu' | 'sgp',
    gameId: number,
    subjectPuuid?: string
  ): Promise<LanWebMatchDto> {
    this._assertLeagueClientConnected()
    if (!Number.isSafeInteger(gameId) || gameId <= 0) {
      throw new LanWebApiError(400, 'INVALID_GAME_ID', 'Invalid game id')
    }
    const normalizedServerId = this._resolveServerId(serverId)
    let summary: LcuOrSgpGameSummary

    if (source === 'sgp') {
      this._assertSgpServerAvailable(normalizedServerId)
      const { data } = await this._context.sgp.api.matchHistoryQuery.getGameSummaryByGameId(
        gameId,
        {
          __sgpServerId: normalizedServerId
        }
      )
      summary = { source: 'sgp', gameId, data }
    } else {
      if (normalizedServerId !== this._context.sgp.state.availability.sgpServerId) {
        throw new LanWebApiError(
          400,
          'INVALID_DATA_SOURCE',
          'LCU data is only available for the connected region'
        )
      }
      const { data } = await this._context.leagueClient.api.matchHistory.getGame(gameId)
      summary = { source: 'lcu', gameId, data }
    }

    return toLanWebMatch(summary, normalizedServerId, subjectPuuid)
  }

  async getGameAsset(kind: 'champion' | 'profile-icon' | 'item', id: number) {
    this._assertLeagueClientConnected()
    if (!Number.isSafeInteger(id) || id < 0 || id > 999999) {
      throw new LanWebApiError(400, 'INVALID_ASSET', 'Invalid game asset id')
    }

    const path =
      kind === 'champion'
        ? `/lol-game-data/assets/v1/champion-icons/${id}.png`
        : kind === 'profile-icon'
          ? `/lol-game-data/assets/v1/profile-icons/${id}.jpg`
          : this._context.leagueClient.data.gameData.items[id]?.iconPath

    if (!path || !path.startsWith('/lol-game-data/assets/')) {
      throw new LanWebApiError(404, 'ASSET_NOT_FOUND', 'Game asset was not found')
    }

    const response = await this._context.leagueClient.request<ArrayBuffer>({
      url: path,
      responseType: 'arraybuffer'
    })
    return {
      data: Buffer.from(response.data),
      contentType: kind === 'profile-icon' ? 'image/jpeg' : 'image/png'
    }
  }

  private async _getPlayerName(puuid: string) {
    const { data } = await this._context.riotClient.api.playerAccount.getPlayerAccountNameset([
      puuid
    ])
    const nameset = data.namesets.find((entry) => entry.puuid === puuid)
    return {
      gameName: nameset?.gnt.gameName || '',
      tagLine: nameset?.gnt.tagLine || ''
    }
  }

  private async _getRankedEntries(
    serverId: string,
    puuid: string
  ): Promise<LanWebRankedEntryDto[] | null> {
    if (serverId !== this._context.sgp.state.availability.sgpServerId) {
      return null
    }

    try {
      const { data } = await this._context.leagueClient.api.ranked.getRankedStats(puuid)
      return toLanWebRankedEntries(data)
    } catch (error) {
      this._context.logger.debug('Failed to load optional LAN Web ranked stats', error)
      return []
    }
  }

  private _selectMatchHistorySource(serverId: string): 'lcu' | 'sgp' {
    const availability = this._context.sgp.state.availability
    if (serverId !== availability.sgpServerId) {
      this._assertSgpServerAvailable(serverId)
      return 'sgp'
    }

    if (
      this._context.appCommon.settings.preferredLolSource === 'sgp' &&
      availability.serversSupported.matchHistory &&
      this._context.sgp.state.isTokenReady
    ) {
      return 'sgp'
    }

    return 'lcu'
  }

  private _resolveServerId(serverId?: string) {
    const resolved = (serverId || this._context.sgp.state.availability.sgpServerId).trim()
    if (!resolved || resolved.length > 64 || !/^[A-Za-z0-9_-]+$/.test(resolved)) {
      throw new LanWebApiError(400, 'INVALID_SERVER', 'A valid League server is required')
    }
    return resolved
  }

  private _assertLeagueClientConnected() {
    if (!this._context.leagueClient.state.isConnected) {
      throw new LanWebApiError(503, 'LEAGUE_CLIENT_DISCONNECTED', 'League Client is not connected')
    }
  }

  private _assertSgpServerAvailable(serverId: string) {
    const server = this._context.sgp.state.leagueServers.servers[serverId.toUpperCase()]
    if (!server?.matchHistory || !this._context.sgp.state.isTokenReady) {
      throw new LanWebApiError(
        503,
        'SGP_UNAVAILABLE',
        'SGP match history is not available for this server'
      )
    }
  }
}
