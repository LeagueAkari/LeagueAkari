import {
  LootContextMenu,
  LootCraftResponse,
  LootRecipe,
  PlayerLootMap
} from '@shared/types/league-client/loot'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

interface MassCraftDto {
  recipeName: string
  lootNames: string[]
  repeat: number
}

export class LootHttpApi {
  constructor(private _http: AxiosInstance) {}

  getLootMap(options: HttpApiRequestOptions = {}) {
    return this._http.get<PlayerLootMap>('/lol-loot/v1/player-loot-map', { signal: options.signal })
  }

  craftLoot(
    recipeName: string,
    lootNames: string[],
    repeat = 1,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.post<LootCraftResponse>(
      `/lol-loot/v1/recipes/${recipeName}/craft?repeat=${repeat}`,
      lootNames,
      { signal: options.signal }
    )
  }

  craftMass(data: MassCraftDto[], options: HttpApiRequestOptions = {}) {
    return this._http.post<LootCraftResponse>(`/lol-loot/v1/craft/mass`, data, {
      signal: options.signal
    })
  }

  getContextMenu(lootId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<LootContextMenu[]>(`/lol-loot/v1/player-loot/${lootId}/context-menu`, {
      signal: options.signal
    })
  }

  getInitialItemRecipe(lootId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<LootRecipe[]>(`/lol-loot/v1/recipes/initial-item/${lootId}`, {
      signal: options.signal
    })
  }

  redeemLoot(lootName: string, options: HttpApiRequestOptions = {}) {
    return this._http.post<LootCraftResponse>(
      `/lol-loot/v1/player-loot/${lootName}/redeem`,
      undefined,
      { signal: options.signal }
    )
  }
}
