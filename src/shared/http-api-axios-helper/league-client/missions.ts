import { Mission, MissionData, MissionSeries } from '@shared/types/league-client/missions'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class MissionsHttpApi {
  constructor(private _http: AxiosInstance) {}

  putPlayer(
    data?: { seriesIds?: string[]; missionIds?: string[] },
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.put<void>('/lol-missions/v1/player', data, { signal: options.signal })
  }

  // ?
  putRewardGroups(id: string, rewardGroups: string[], options: HttpApiRequestOptions = {}) {
    return this._http.put<void>(
      `/lol-missions/v1/player/${id}/reward-groups`,
      { rewardGroups },
      { signal: options.signal }
    )
  }

  putPlayerMission(
    missionId: string,
    data?: {
      rewardGroups?: string[]
    },
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.put<void>(`/lol-missions/v1/player/${missionId}`, data, {
      signal: options.signal
    })
  }

  getMissions(options: HttpApiRequestOptions = {}) {
    return this._http.get<Mission[]>('/lol-missions/v1/missions', { signal: options.signal })
  }

  getSeries(options: HttpApiRequestOptions = {}) {
    return this._http.get<MissionSeries[]>('/lol-missions/v1/series', { signal: options.signal })
  }

  getData(options: HttpApiRequestOptions = {}) {
    return this._http.get<MissionData>('/lol-missions/v1/data', { signal: options.signal })
  }
}
