import { GameStats, PlayerList } from '@shared/types/game-client'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

// https://static.developer.riotgames.com/docs/lol/liveclientdata_sample.json
export class GameClientHttpApiAxiosHelper {
  constructor(private _http: AxiosInstance) {}

  getLiveClientDataPlayerList(options: HttpApiRequestOptions = {}) {
    return this._http.get<PlayerList[]>('/liveclientdata/playerlist', { signal: options.signal })
  }

  getActivePlayer(options: HttpApiRequestOptions = {}) {
    return this._http.get('/liveclientdata/activeplayer', { signal: options.signal })
  }

  getAllGameData(options: HttpApiRequestOptions = {}) {
    return this._http.get('/liveclientdata/allgamedata', { signal: options.signal })
  }

  getActivePlayerAbilities(options: HttpApiRequestOptions = {}) {
    return this._http.get('/liveclientdata/activeplayerabilities', { signal: options.signal })
  }

  getActivePlayerName(options: HttpApiRequestOptions = {}) {
    return this._http.get('/liveclientdata/activeplayername', { signal: options.signal })
  }

  getActivePlayerRunes(options: HttpApiRequestOptions = {}) {
    return this._http.get('/liveclientdata/activeplayerrunes', { signal: options.signal })
  }

  getActivePlayerSummonerSpells(options: HttpApiRequestOptions = {}) {
    return this._http.get('/liveclientdata/playersummonerspells', { signal: options.signal })
  }

  getEventData(options: HttpApiRequestOptions = {}) {
    return this._http.get('/liveclientdata/eventdata', { signal: options.signal })
  }

  getGameStats(options: HttpApiRequestOptions = {}) {
    return this._http.get<GameStats>('/liveclientdata/gamestats', { signal: options.signal })
  }

  getPlayerItems(options: HttpApiRequestOptions = {}) {
    return this._http.get('/liveclientdata/playeritems', { signal: options.signal })
  }

  getPlayerMainRunes(options: HttpApiRequestOptions = {}) {
    return this._http.get('/liveclientdata/playermainrunes', { signal: options.signal })
  }

  getPlayerScores(options: HttpApiRequestOptions = {}) {
    return this._http.get('/liveclientdata/playerscores', { signal: options.signal })
  }

  getSummonerSpells(options: HttpApiRequestOptions = {}) {
    return this._http.get('/liveclientdata/playersummonerspells', { signal: options.signal })
  }
}
