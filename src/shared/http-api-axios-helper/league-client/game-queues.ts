import { GameQueue } from '@shared/types/league-client/game-queues'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class GameQueuesHttpApi {
  constructor(private _http: AxiosInstance) {}

  getQueues(options: HttpApiRequestOptions = {}) {
    return this._http.get<GameQueue[]>('/lol-game-queues/v1/queues', { signal: options.signal })
  }
}
