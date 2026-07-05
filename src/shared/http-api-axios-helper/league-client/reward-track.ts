import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

// TODO: Add types
export class RewardTrackHttpApi {
  constructor(private _http: AxiosInstance) {}

  getRegister(progressionGroupId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/lol-reward-track/register/${progressionGroupId}`, {
      signal: options.signal
    })
  }

  getBonusItems(progressionGroupId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/lol-reward-track/${progressionGroupId}/reward-track/bonus-items`, {
      signal: options.signal
    })
  }

  getBonusProgress(progressionGroupId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/lol-reward-track/${progressionGroupId}/reward-track/bonus-progress`, {
      signal: options.signal
    })
  }

  getFailure(progressionGroupId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/lol-reward-track/${progressionGroupId}/reward-track/failure`, {
      signal: options.signal
    })
  }

  getItems(progressionGroupId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/lol-reward-track/${progressionGroupId}/reward-track/items`, {
      signal: options.signal
    })
  }

  getProgress(progressionGroupId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/lol-reward-track/${progressionGroupId}/reward-track/progress`, {
      signal: options.signal
    })
  }

  getUnclaimedRewards(progressionGroupId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(
      `/lol-reward-track/${progressionGroupId}/reward-track/unclaimed-rewards`,
      { signal: options.signal }
    )
  }

  getXp(progressionGroupId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/lol-reward-track/${progressionGroupId}/reward-track/xp`, {
      signal: options.signal
    })
  }
}
