import {
  ChatMessage,
  ChatPerson,
  Conversation,
  Friend,
  FriendGroup
} from '@shared/types/league-client/chat'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export type AvailabilityType =
  | 'chat'
  | 'mobile'
  | 'dnd'
  | 'away'
  | 'offline'
  | 'online'
  | 'spectating'

export class ChatHttpApi {
  constructor(private _http: AxiosInstance) {}

  getFriends(options: HttpApiRequestOptions = {}) {
    return this._http.get<Friend[]>('/lol-chat/v1/friends', { signal: options.signal })
  }

  deleteFriend(id: string, options: HttpApiRequestOptions = {}) {
    return this._http.delete(`/lol-chat/v1/friends/${id}`, { signal: options.signal })
  }

  getFriendGroups(options: HttpApiRequestOptions = {}) {
    return this._http.get<FriendGroup[]>('/lol-chat/v1/friend-groups', { signal: options.signal })
  }

  getMe(options: HttpApiRequestOptions = {}) {
    return this._http.get<ChatPerson>('/lol-chat/v1/me', { signal: options.signal })
  }

  getConversations(options: HttpApiRequestOptions = {}) {
    return this._http.get<Conversation[]>('/lol-chat/v1/conversations', { signal: options.signal })
  }

  getParticipants(id: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<ChatPerson[]>(`/lol-chat/v1/conversations/${id}/participants`, {
      signal: options.signal
    })
  }

  changeAvailability(availability: AvailabilityType, options: HttpApiRequestOptions = {}) {
    return this._http.put(
      '/lol-chat/v1/me',
      {
        availability
      },
      { signal: options.signal }
    )
  }

  // 暂时不了解summonerId有什么用处，经过测试是加不加都行，尽量保持原样
  chatSend(
    targetId: number | string,
    message: string,
    type: string = 'chat',
    isHistorical: boolean = false,
    summonerId?: number,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.post<ChatMessage>(
      `/lol-chat/v1/conversations/${targetId}/messages`,
      {
        body: message,
        fromId: summonerId,
        fromPid: '',
        fromSummonerId: summonerId ?? 0,
        id: targetId,
        isHistorical,
        timestamp: '',
        type
      },
      { signal: options.signal }
    )
  }

  getChatParticipants(chatRoomId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<ChatPerson[]>(`/lol-chat/v1/conversations/${chatRoomId}/participants`, {
      signal: options.signal
    })
  }

  changeRanked(
    rankedLeagueQueue: string,
    rankedLeagueTier: string,
    rankedLeagueDivision?: string,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.put<ChatPerson>(
      '/lol-chat/v1/me',
      {
        lol: {
          rankedLeagueQueue,
          rankedLeagueTier,
          rankedLeagueDivision
        }
      },
      { signal: options.signal }
    )
  }

  friendRequests(gameName: string, tagLine: string, options: HttpApiRequestOptions = {}) {
    return this._http.post(
      '/lol-chat/v2/friend-requests',
      {
        gameName,
        tagLine,
        gameTag: tagLine
      },
      { signal: options.signal }
    )
  }

  setChatStatusMessage(message: string, options: HttpApiRequestOptions = {}) {
    return this._http.put<ChatPerson>(
      '/lol-chat/v1/me',
      {
        statusMessage: message
      },
      { signal: options.signal }
    )
  }
}
