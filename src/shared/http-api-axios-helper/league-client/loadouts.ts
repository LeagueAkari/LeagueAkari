import { AccountScopeLoadouts } from '@shared/types/league-client/game-data'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

type EmoteType =
  | 'EMOTES_WHEEL_CENTER'
  | 'EMOTES_WHEEL_UPPER'
  | 'EMOTES_WHEEL_RIGHT'
  | 'EMOTES_WHEEL_UPPER_RIGHT'
  | 'EMOTES_WHEEL_UPPER_LEFT'
  | 'EMOTES_WHEEL_LOWER'
  | 'EMOTES_WHEEL_LEFT'
  | 'EMOTES_WHEEL_LOWER_RIGHT'
  | 'EMOTES_WHEEL_LOWER_LEFT'
  | 'EMOTES_START'
  | 'EMOTES_FIRST_BLOOD'
  | 'EMOTES_ACE'
  | 'EMOTES_VICTORY'

/**
 * 下一次的模式开放, 涉及到 STRAWBERRY 估计 API 会有很大变动
 */
export class LoadoutsHttpApi {
  constructor(private _http: AxiosInstance) {}

  setStrawberryDifficulty(
    contentId: string,
    difficulty: number,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.patch(
      `/lol-loadouts/v4/loadouts/${contentId}`,
      {
        loadout: {
          STRAWBERRY_DIFFICULTY: { inventoryType: 'STRAWBERRY_LOADOUT_ITEM', itemId: difficulty }
        }
      },
      { signal: options.signal }
    )
  }

  setEmotes(
    contentId: string,
    emotes: Record<EmoteType, (number & {}) | -1>,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.patch(
      `/lol-loadouts/v4/loadouts/${contentId}`,
      {
        loadout: {
          ...Object.fromEntries(
            Object.entries(emotes).map(([key, value]) => [
              key,
              { inventoryType: 'EMOTE', itemId: value }
            ])
          )
        }
      },
      { signal: options.signal }
    )
  }

  patchLoadout(contentId: string, loadout: any, options: HttpApiRequestOptions = {}) {
    return this._http.patch(
      `/lol-loadouts/v4/loadouts/${contentId}`,
      {
        loadout
      },
      { signal: options.signal }
    )
  }

  getAccountScopeLoadouts(options: HttpApiRequestOptions = {}) {
    return this._http.get<AccountScopeLoadouts[]>('/lol-loadouts/v4/loadouts/scope/account', {
      signal: options.signal
    })
  }
}
