export interface GiftableFriend {
  friendsSince: string
  nick: string
  oldFriends: boolean
  summonerId: number
}

/**
 * `/lol-store/v1/catalog` 条目中的价格。
 *
 * `currency` 为货币标识，蓝色精粹为 `IP`（部分版本为 `BE`），点券为 `RP`。
 */
export interface StoreCatalogPrice {
  currency: string
  cost: number
  [key: string]: any
}

/**
 * `/lol-store/v1/catalog` 中的单个目录条目。
 *
 * 英雄价格的条目满足 `inventoryType === 'CHAMPION'`，其 `itemId` 即英雄 id。
 */
export interface StoreCatalogItem {
  itemId: number
  inventoryType: string
  prices?: StoreCatalogPrice[]
  active?: boolean
  [key: string]: any
}
