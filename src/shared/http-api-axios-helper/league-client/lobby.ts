import {
  EogStatus,
  Lobby,
  LobbyMember,
  QueueEligibility,
  ReceivedInvitation
} from '@shared/types/league-client/lobby'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class LobbyHttpApi {
  constructor(private _http: AxiosInstance) {}

  createCustomLobby(
    mode: string,
    mapId: number,
    spectatorPolicy: string,
    lobbyName: string,
    lobbyPassword: string | null,
    isCustom: boolean,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.post<Lobby>(
      '/lol-lobby/v2/lobby',
      {
        customGameLobby: {
          configuration: {
            gameMode: mode,
            gameMutator: '',
            gameServerRegion: '',
            mapId,
            mutators: { id: 1 }, // 1 自选 2 征召 3 禁用 4 全随机
            spectatorPolicy,
            teamSize: 5
          },
          lobbyName,
          lobbyPassword
        },
        isCustom
      },
      { signal: options.signal }
    )
  }

  createQueueLobby(queueId: number, options: HttpApiRequestOptions = {}) {
    return this._http.post('/lol-lobby/v2/lobby', { queueId }, { signal: options.signal })
  }

  /**
   * 提升为房主
   * @param summonerId 目标召唤师 ID
   */

  promote(summonerId: string | number, options: HttpApiRequestOptions = {}) {
    return this._http.post<number>(`/lol-lobby/v2/lobby/members/${summonerId}/promote`, undefined, {
      signal: options.signal
    })
  }

  kick(summonerId: string | number, options: HttpApiRequestOptions = {}) {
    return this._http.post<number>(`/lol-lobby/v2/lobby/members/${summonerId}/kick`, undefined, {
      signal: options.signal
    })
  }

  getMembers(options: HttpApiRequestOptions = {}) {
    return this._http.get<LobbyMember[]>('/lol-lobby/v2/lobby/members', { signal: options.signal })
  }

  getLobby(options: HttpApiRequestOptions = {}) {
    return this._http.get<Lobby>('/lol-lobby/v2/lobby', { signal: options.signal })
  }

  deleteLobby(options: HttpApiRequestOptions = {}) {
    return this._http.delete('/lol-lobby/v2/lobby', { signal: options.signal })
  }

  searchMatch(options: HttpApiRequestOptions = {}) {
    return this._http.post('/lol-lobby/v2/lobby/matchmaking/search', undefined, {
      signal: options.signal
    })
  }

  deleteSearchMatch(options: HttpApiRequestOptions = {}) {
    return this._http.delete('/lol-lobby/v2/lobby/matchmaking/search', { signal: options.signal })
  }

  playAgain(options: HttpApiRequestOptions = {}) {
    return this._http.post('/lol-lobby/v2/play-again', undefined, { signal: options.signal })
  }

  getEogStatus(options: HttpApiRequestOptions = {}) {
    return this._http.get<EogStatus>('/lol-lobby/v2/party/eog-status', { signal: options.signal })
  }

  acceptReceivedInvitation(invitationId: string, options: HttpApiRequestOptions = {}) {
    return this._http.post(`/lol-lobby/v2/received-invitations/${invitationId}/accept`, undefined, {
      signal: options.signal
    })
  }

  declineReceivedInvitation(invitationId: string, options: HttpApiRequestOptions = {}) {
    return this._http.post(
      `/lol-lobby/v2/received-invitations/${invitationId}/decline`,
      undefined,
      { signal: options.signal }
    )
  }

  getReceivedInvitations(options: HttpApiRequestOptions = {}) {
    return this._http.get<ReceivedInvitation[]>('/lol-lobby/v2/received-invitations', {
      signal: options.signal
    })
  }

  getEligiblePartyQueues(options: HttpApiRequestOptions = {}) {
    return this._http.post<QueueEligibility[]>('/lol-lobby/v2/eligibility/party', undefined, {
      signal: options.signal
    })
  }

  getEligibleSelfQueues(options: HttpApiRequestOptions = {}) {
    return this._http.post<QueueEligibility[]>('/lol-lobby/v2/eligibility/self', undefined, {
      signal: options.signal
    })
  }

  setPlayerSlotsStrawberry1(
    championId: number,
    mapId = 1,
    difficultyId = 1,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.put<void>(
      '/lol-lobby/v1/lobby/members/localMember/player-slots',
      [{ championId, positionPreference: 'UNSELECTED', spell1: mapId, spell2: difficultyId }],
      { signal: options.signal }
    )
  }

  setStrawberryMapId(
    data: { contentId: string; itemId: number },
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.put<void>('/lol-lobby/v2/lobby/strawberryMapId', data, {
      signal: options.signal
    })
  }

  postInvitation(summonerIds: number[], options: HttpApiRequestOptions = {}) {
    return this._http.post(
      `/lol-lobby/v2/lobby/invitations`,
      summonerIds.map((id) => ({ toSummonerId: id })),
      { signal: options.signal }
    )
  }
}
