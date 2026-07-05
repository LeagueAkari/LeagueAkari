import { Ballot } from '@shared/types/league-client/honorV2'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class HonorHttpApi {
  constructor(private _http: AxiosInstance) {}

  ballot(options: HttpApiRequestOptions = {}) {
    return this._http.post('/lol-honor/v1/ballot', undefined, { signal: options.signal })
  }

  honor(honorType: string, recipientPuuid: string, options: HttpApiRequestOptions = {}) {
    return this._http.post(
      '/lol-honor/v1/honor',
      {
        honorType,
        recipientPuuid
      },
      { signal: options.signal }
    )
  }

  v2Honor(
    gameId: string | number,
    honorCategory: 'COOL' | 'SHOTCALLER' | 'HEART' | '' | 'OPT_OUT',
    summonerId?: string | number,
    puuid?: string,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.post(
      '/lol-honor-v2/v1/honor-player/',
      {
        gameId,
        honorCategory,
        summonerId,
        puuid
      },
      { signal: options.signal }
    )
  }

  getV2Ballot(options: HttpApiRequestOptions = {}) {
    return this._http.get<Ballot>('/lol-honor-v2/v1/ballot/', { signal: options.signal })
  }

  ackHonorNotification(mailId: string, options: HttpApiRequestOptions = {}) {
    return this._http.post(`/lol-honor-v2/v1/ack-honor-notification/${mailId}`, undefined, {
      signal: options.signal
    })
  }

  ackLateRecognition(options: HttpApiRequestOptions = {}) {
    return this._http.post(`/lol-honor-v2/v1/late-recognition/ack`, undefined, {
      signal: options.signal
    })
  }

  ackLevelChange(options: HttpApiRequestOptions = {}) {
    return this._http.post(`/lol-honor-v2/v1/level-change/ack`, undefined, {
      signal: options.signal
    })
  }

  ackMutualHonor(options: HttpApiRequestOptions = {}) {
    return this._http.post(`/lol-honor-v2/v1/mutual-honor/ack`, undefined, {
      signal: options.signal
    })
  }

  ackRewardGranted(options: HttpApiRequestOptions = {}) {
    return this._http.post(`/lol-honor-v2/v1/reward-granted/ack`, undefined, {
      signal: options.signal
    })
  }
}
