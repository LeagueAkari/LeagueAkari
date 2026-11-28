import {
  PurchasableItem,
  PurchaseItemsPayload
} from '@shared/types/league-client/champion-inventory'
import { GiftableFriend, StoreCatalogItem } from '@shared/types/league-client/store'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

/** 蓝色精粹（历史命名 IP，部分版本为 BE） */
export const BLUE_ESSENCE_CURRENCY = 'IP'
/** 点券 */
export const RP_CURRENCY = 'RP'

export class StoreHttpApi {
  constructor(private _http: AxiosInstance) {}

  getGiftableFriends(options: HttpApiRequestOptions = {}) {
    return this._http.get<GiftableFriend[]>('/lol-store/v1/giftablefriends', {
      signal: options.signal
    })
  }

  /**
   * 商城目录（全部库存类型）。
   *
   * 英雄价格的条目满足 `inventoryType === 'CHAMPION'`，其 `itemId` 即英雄 id，
   * 蓝色精粹价格位于 `prices` 中 `currency === 'IP'` 的项。
   */
  getCatalog(options: HttpApiRequestOptions = {}) {
    return this._http.get<StoreCatalogItem[] | Record<string, StoreCatalogItem[]>>(
      '/lol-store/v1/catalog',
      { signal: options.signal }
    )
  }

  /**
   * 查询单个商品的可购买信息（含各货币价格）
   */
  getPurchasableItem(
    inventoryType: string,
    itemId: number,
    options: HttpApiRequestOptions = {}
  ) {
    return this._http.get<PurchasableItem>('/lol-purchase-widget/v1/purchasable-item', {
      params: { inventoryType, itemId },
      signal: options.signal
    })
  }

  /**
   * 通过官方购买组件购买商品（支持批量）。
   *
   * 购买英雄时须显式指定 `currencyType` 与 `price`，以避免误用其他货币。
   */
  purchaseItems(payload: PurchaseItemsPayload, options: HttpApiRequestOptions = {}) {
    return this._http.post<any>('/lol-purchase-widget/v2/purchaseItems', payload, {
      signal: options.signal
    })
  }

  /**
   * 购买单个英雄（使用指定货币，默认蓝色精粹）
   */
  purchaseChampion(
    championId: number,
    price: number,
    currencyType: string = BLUE_ESSENCE_CURRENCY,
    options: HttpApiRequestOptions = {}
  ) {
    return this.purchaseItems(
      {
        items: [
          {
            itemKey: { inventoryType: 'CHAMPION', itemId: championId },
            purchaseCurrencyInfo: { currencyType, price },
            quantity: 1
          }
        ]
      },
      options
    )
  }
}
