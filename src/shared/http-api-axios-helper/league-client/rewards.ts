import { RewardsGrant, RewardsGroup } from '@shared/types/league-client/rewards'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export interface PostGrantSelectionDto {
  grantId: string
  selections: string[]
  rewardGroupId: string
  selection?: string
}

// not sure what this is for
// further investigation needed
export interface PostCelebrationsFscDto {
  fsc?: any
  id: string
  canvas?: any
  media?: any
  rewards?: any
}

export class RewardsHttpApi {
  constructor(private _http: AxiosInstance) {}

  postCelebrationsFsc(data: PostCelebrationsFscDto, options: HttpApiRequestOptions = {}) {
    return this._http.post('/lol-rewards/v1/celebrations/fsc', data, { signal: options.signal })
  }

  getGrants(status?: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<RewardsGrant[]>('/lol-rewards/v1/grants', {
      signal: options.signal,
      params: {
        status
      }
    })
  }

  patchGrantsView(data: any, options: HttpApiRequestOptions = {}) {
    return this._http.patch('/lol-rewards/v1/grants/view', data, { signal: options.signal })
  }

  postGrantSelection(
    grantId: string,
    data: PostGrantSelectionDto,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.post(`/lol-rewards/v1/grants/${grantId}/select`, data, {
      signal: options.signal
    })
  }

  // filter it or 50000 lines of json :)
  getGroups(types?: string[], options: HttpApiRequestOptions = {}) {
    return this._http.get<RewardsGroup[]>('/lol-rewards/v1/groups', {
      signal: options.signal,
      params: {
        types
      }
    })
  }

  postRewardReplay(data: { rewardGroupId: string }, options: HttpApiRequestOptions = {}) {
    return this._http.post('/lol-rewards/v1/reward/replay', data, { signal: options.signal })
  }

  postSelectBulk(data: { selection: string[] }, options: HttpApiRequestOptions = {}) {
    return this._http.post('/lol-rewards/v1/select-bulk', data, { signal: options.signal })
  }
}
