import { GameQueue } from '@shared/types/league-client/game-queues'
import { AxiosInstance } from 'axios'

export class GameQueuesHttpApi {
  constructor(private _http: AxiosInstance) {}

  getQueues() {
    return this._http.get<GameQueue[]>('/lol-game-queues/v1/queues')
  }
}
