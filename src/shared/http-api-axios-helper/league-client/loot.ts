import { LootCraftResponse, PlayerLootMap } from '@shared/types/league-client/loot'
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
}
