import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class RemedyHttpApi {
  constructor(private _http: AxiosInstance) {}

  ackRemedyNotification(mailId: string, options: HttpApiRequestOptions = {}) {
    return this._http.put(`/lol-remedy/v1/ack-remedy-notification/${mailId}`, undefined, {
      signal: options.signal
    })
  }

  getNotifications(options: HttpApiRequestOptions = {}) {
    return this._http.get('/lol-remedy/v1/remedy-notifications', { signal: options.signal })
  }

  getVerbalAbuseRemedyModalEnabled(options: HttpApiRequestOptions = {}) {
    return this._http.get('/lol-remedy/v1/config/is-verbal-abuse-remedy-modal-enabled', {
      signal: options.signal
    })
  }
}
