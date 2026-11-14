import type { OpggJungleFullCampsResponse, OpggRegion } from '@shared/types/opgg'
import type { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

interface OpggJungleFullCampsRequestOptions extends HttpApiRequestOptions {
  page?: number
  queueId?: number
  /** Lower bound in milliseconds. The desktop client uses 171000. */
  timeFrom?: number
  championId?: number
  region?: Exclude<OpggRegion, 'global'>
  tier?: string
  puuid?: string
}

/** Separate origin from the champion API; do not use the akari://opgg proxy for this service. */
export class OpggDesktopHttpApiAxiosHelper {
  static BASE_URL = 'https://desktop-api.op.gg'

  constructor(private readonly _http: AxiosInstance) {
    if (!_http.defaults.baseURL) {
      _http.defaults.baseURL = OpggDesktopHttpApiAxiosHelper.BASE_URL
    }
  }

  getJungleFullCamps(options: OpggJungleFullCampsRequestOptions = {}) {
    return this._http.get<OpggJungleFullCampsResponse>('/timer/jungle-fullcamps', {
      params: {
        page: options.page,
        queueId: options.queueId,
        timeFrom: options.timeFrom,
        championId: options.championId,
        region: options.region,
        tier: options.tier,
        puuid: options.puuid
      },
      signal: options.signal
    })
  }
}
