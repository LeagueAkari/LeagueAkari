import {
  Augment,
  ChallengesJson,
  ChampDetails,
  ChampionSimple,
  GameMap,
  GameMapAsset,
  GameModeMutator,
  Item,
  LootMap,
  Perk,
  Perkstyles,
  Queue,
  StrawberryHub,
  SummonerSpell
} from '@shared/types/league-client/game-data'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class GameDataHttpApi {
  constructor(private _http: AxiosInstance) {}

  getSummonerSpells(options: HttpApiRequestOptions = {}) {
    return this._http.get<SummonerSpell[]>('/lol-game-data/assets/v1/summoner-spells.json', {
      signal: options.signal
    })
  }

  getPerkstyles(options: HttpApiRequestOptions = {}) {
    return this._http.get<Perkstyles>('/lol-game-data/assets/v1/perkstyles.json', {
      signal: options.signal
    })
  }

  getItems(options: HttpApiRequestOptions = {}) {
    return this._http.get<Item[]>('/lol-game-data/assets/v1/items.json', { signal: options.signal })
  }

  getChampionSummary(options: HttpApiRequestOptions = {}) {
    return this._http.get<ChampionSimple[]>('/lol-game-data/assets/v1/champion-summary.json', {
      signal: options.signal
    })
  }

  getGameModeMutators(options: HttpApiRequestOptions = {}) {
    return this._http.get<GameModeMutator[]>('/lol-game-data/assets/v1/game-mode-mutators.json', {
      signal: options.signal
    })
  }

  getMaps(options: HttpApiRequestOptions = {}) {
    return this._http.get<GameMap[]>('/lol-game-data/assets/v1/maps.json', {
      signal: options.signal
    })
  }

  getPerks(options: HttpApiRequestOptions = {}) {
    return this._http.get<Perk[]>('/lol-game-data/assets/v1/perks.json', { signal: options.signal })
  }

  getQueues(options: HttpApiRequestOptions = {}) {
    return this._http.get<Queue[]>('/lol-game-data/assets/v1/queues.json', {
      signal: options.signal
    })
  }

  getMapAssets(options: HttpApiRequestOptions = {}) {
    return this._http.get<GameMapAsset>('/lol-game-data/assets/v1/map-assets/map-assets.json', {
      signal: options.signal
    })
  }

  getChampDetails(champId: number, options: HttpApiRequestOptions = {}) {
    return this._http.get<ChampDetails>(`/lol-game-data/assets/v1/champions/${champId}.json`, {
      signal: options.signal
    })
  }

  getAugments(options: HttpApiRequestOptions = {}) {
    return this._http.get<Augment[]>('/lol-game-data/assets/v1/cherry-augments.json', {
      signal: options.signal
    })
  }

  getStrawberryHub(options: HttpApiRequestOptions = {}) {
    return this._http.get<StrawberryHub[]>('/lol-game-data/assets/v1/strawberry-hub.json', {
      signal: options.signal
    })
  }

  getLoots(options: HttpApiRequestOptions = {}) {
    return this._http.get<LootMap>('/lol-game-data/assets/v1/loots.json', {
      signal: options.signal
    })
  }

  getChallenges(options: HttpApiRequestOptions = {}) {
    return this._http.get<ChallengesJson>('/lol-game-data/assets/v1/challenges.json', {
      signal: options.signal
    })
  }
}
