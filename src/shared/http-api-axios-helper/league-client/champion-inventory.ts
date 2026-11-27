import {
  ChampionDetail,
  ChampionMinimal,
  Wallet
} from '@shared/types/league-client/champion-inventory'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

/**
 * 英雄资产（已拥有 / 周免 / 所有权）与钱包（蓝色精粹）相关接口
 */
export class ChampionInventoryHttpApi {
  constructor(private _http: AxiosInstance) {}

  /**
   * 当前账号的英雄清单（含 `owned` 与 `freeToPlay`），同时提供「已拥有」和「本周周免」信息
   */
  getChampionInventory(summonerId: number, options: HttpApiRequestOptions = {}) {
    return this._http.get<ChampionMinimal[]>(
      `/lol-champions/v1/inventories/${summonerId}/champions-minimal`,
      { signal: options.signal }
    )
  }

  /**
   * 仅已拥有英雄（无需 summonerId）
   */
  getOwnedChampionsMinimal(options: HttpApiRequestOptions = {}) {
    return this._http.get<ChampionMinimal[]>('/lol-champions/v1/owned-champions-minimal', {
      signal: options.signal
    })
  }

  /**
   * 单个英雄的详情（含 `ownership.owned`）
   */
  getChampionDetail(summonerId: number, championId: number, options: HttpApiRequestOptions = {}) {
    return this._http.get<ChampionDetail>(
      `/lol-champions/v1/inventories/${summonerId}/champions/${championId}`,
      { signal: options.signal }
    )
  }

  /**
   * 钱包（全部货币）
   */
  getWallet(options: HttpApiRequestOptions = {}) {
    return this._http.get<Wallet>('/lol-inventory/v1/wallet', { signal: options.signal })
  }

  /**
   * 指定货币类型的钱包余额，例如 `lol_blue_essence`、`RP`
   */
  getWalletByCurrency(currencyType: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<Wallet>(`/lol-inventory/v1/wallet/${currencyType}`, {
      signal: options.signal
    })
  }
}
