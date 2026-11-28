/**
 * 与英雄资产（已拥有 / 周免 / 所有权）、钱包（蓝色精粹）与购买相关的类型定义。
 */

/**
 * `/lol-champions/v1/inventories/:summonerId/champions-minimal` 返回的单个英雄
 *
 * 该接口同时承载了「已拥有」与「本周周免」两项信息：
 * - `owned`：当前账号是否已拥有该英雄
 * - `freeToPlay`：当前账号本周是否可免费使用（周免）
 *
 * 不同端点对归属的描述字段不同，这里同时兼容 `owned` 与 `ownership.owned`。
 */
export interface ChampionMinimal {
  id: number
  name: string
  alias: string
  squarePortraitPath: string
  roles: string[]

  owned?: boolean
  freeToPlay?: boolean
  freeToPlayForQueue?: boolean
  active?: boolean

  /** 部分端点（如单英雄详情）以 ownership 描述归属 */
  ownership?: ChampionOwnership

  masteryLevel?: number
  masteryPoints?: number
  disabledQueues?: number[]
}

export interface ChampionOwnership {
  owned?: boolean
  freeToPlayReward?: boolean
  ownershipType?: string
  rented?: boolean
  [key: string]: any
}

/**
 * `/lol-champions/v1/inventories/:summonerId/champions/:championId`
 */
export interface ChampionDetail {
  id: number
  name: string
  alias: string
  title?: string
  active: boolean
  ownership: ChampionOwnership
  [key: string]: any
}

/**
 * 钱包接口返回的对象。
 *
 * `/lol-inventory/v1/wallet` 返回全部货币；`/lol-inventory/v1/wallet/:currencyType`
 * 返回以货币名称为 key 的对象，例如 `{ "lol_blue_essence": 12345 }`、`{ "RP": 100 }`。
 */
export interface Wallet {
  [currency: string]: number
}

/**
 * 可购买项中携带的价格信息
 */
export interface PurchaseItemPrice {
  /** 货币类型，蓝色精粹为 `IP`（部分版本为 `BE`），点券为 `RP` */
  currencyType: string
  price: number
  [key: string]: any
}

export interface PurchaseOption {
  priceDetails?: { price?: PurchaseItemPrice }[]
  [key: string]: any
}

/**
 * `/lol-purchase-widget/v1/purchasable-item`
 */
export interface PurchasableItem {
  itemId?: number
  inventoryType?: string
  purchasable?: boolean
  purchaseOptions?: PurchaseOption[]
  validationErrors?: any[]
  [key: string]: any
}

/**
 * `/lol-purchase-widget/v2/purchaseItems` 的请求体
 */
export interface PurchaseItemsPayload {
  items: {
    itemKey: { inventoryType: string; itemId: number }
    purchaseCurrencyInfo: { currencyType: string; price: number }
    quantity: number
  }[]
}
