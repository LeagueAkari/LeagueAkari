import {
  LootContextMenu,
  LootCraftResponse,
  LootRecipe,
  PlayerLootMap
} from '@shared/types/league-client/loot'
import { AxiosInstance } from 'axios'

interface MassCraftDto {
  recipeName: string
  lootNames: string[]
  repeat: number
}

export class LootHttpApi {
  constructor(private _http: AxiosInstance) {}

  getLootMap() {
    return this._http.get<PlayerLootMap>('/lol-loot/v1/player-loot-map')
  }

  craftLoot(recipeName: string, lootNames: string[], repeat = 1) {
    return this._http.post<LootCraftResponse>(
      `/lol-loot/v1/recipes/${recipeName}/craft?repeat=${repeat}`,
      lootNames
    )
  }

  craftMass(data: MassCraftDto[]) {
    return this._http.post<LootCraftResponse>(`/lol-loot/v1/craft/mass`, data)
  }

  getContextMenu(lootId: string) {
    return this._http.get<LootContextMenu[]>(`/lol-loot/v1/player-loot/${lootId}/context-menu`)
  }

  getInitialItemRecipe(lootId: string) {
    return this._http.get<LootRecipe[]>(`/lol-loot/v1/recipes/initial-item/${lootId}`)
  }

  redeemLoot(lootName: string) {
    return this._http.post<LootCraftResponse>(`/lol-loot/v1/player-loot/${lootName}/redeem`)
  }
}
