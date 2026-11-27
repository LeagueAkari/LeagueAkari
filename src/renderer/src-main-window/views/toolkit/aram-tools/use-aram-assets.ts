import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { ChampionMinimal, Wallet } from '@shared/types/league-client/champion-inventory'
import { ChampionSimple } from '@shared/types/league-client/game-data'
import { StoreCatalogItem } from '@shared/types/league-client/store'
import { ref, shallowRef } from 'vue'

const BLUE_ESSENCE_KEYS = ['lol_blue_essence', 'ip', 'be']
const RP_KEYS = ['rp']

/** 蓝色精粹在商城目录价格中的货币标识 */
const BLUE_ESSENCE_CURRENCY = 'IP'

function pickNumber(source: Wallet | undefined, keys: string[]): number | null {
  if (!source) {
    return null
  }

  for (const key of Object.keys(source)) {
    if (keys.includes(key.toLowerCase()) && typeof source[key] === 'number') {
      return source[key]
    }
  }

  return null
}

/**
 * 兼容两种响应形态：钱包映射对象（整体钱包）或裸数字（按单货币查询）
 */
function toNumber(data: unknown, keys: string[]): number | null {
  if (typeof data === 'number') {
    return data
  }

  if (data && typeof data === 'object') {
    return pickNumber(data as Wallet, keys)
  }

  return null
}

/**
 * `/lol-store/v1/catalog` 可能返回条目数组，也可能返回以库存类型为 key、值为条目数组的映射，
 * 这里统一归一化为条目数组。
 */
function normalizeCatalog(data: unknown): StoreCatalogItem[] {
  if (Array.isArray(data)) {
    return data as StoreCatalogItem[]
  }

  if (data && typeof data === 'object') {
    return Object.values(data as Record<string, StoreCatalogItem[]>).flatMap((items) =>
      Array.isArray(items) ? items : []
    )
  }

  return []
}

/** 从商城目录条目中提取蓝色精粹（货币标识 `IP`）价格 */
function blueEssencePriceOf(item: StoreCatalogItem): number | null {
  const price = item.prices?.find(
    (p) => String(p?.currency).toUpperCase() === BLUE_ESSENCE_CURRENCY
  )

  return typeof price?.cost === 'number' ? price.cost : null
}

/**
 * 是否永久拥有该英雄。
 *
 * 兼容 `owned` 与 `ownership.owned` 两种归属描述，并排除周免、租借 / 试用等
 * 非永久状态，使统计结果尽量与客户端的「我的英雄」一致。
 */
function isPermanentlyOwned(champion: ChampionMinimal): boolean {
  if (champion.ownership?.rented === true) {
    return false
  }

  return champion.ownership?.owned === true || champion.owned === true
}

/**
 * LCU 资产同步：全英雄列表、已拥有 / 周免英雄、蓝色精粹与点券余额、英雄蓝色精粹价格
 */
export function useAramAssets() {
  const lc = useInstance(LeagueClientRenderer)
  const lcs = useLeagueClientStore()

  const champions = shallowRef<ChampionSimple[]>([])
  const ownedIds = ref<Set<number>>(new Set())
  const freeIds = ref<Set<number>>(new Set())
  const blueEssence = ref(0)
  const rp = ref(0)
  const priceMap = ref<Map<number, number | null>>(new Map())

  const isRefreshing = ref(false)
  const isPriceLoading = ref(false)

  const fetchWallet = async () => {
    // 优先使用整体钱包（一次拿到全部货币）
    try {
      const { data } = await lc.api.championInventory.getWallet()
      const be = toNumber(data, BLUE_ESSENCE_KEYS)
      const rpValue = toNumber(data, RP_KEYS)
      if (be !== null || rpValue !== null) {
        blueEssence.value = be ?? 0
        rp.value = rpValue ?? 0
        return
      }
    } catch {
      // 忽略，回退到按单货币查询
    }

    try {
      const { data } = await lc.api.championInventory.getWalletByCurrency('lol_blue_essence')
      blueEssence.value = toNumber(data, BLUE_ESSENCE_KEYS) ?? 0
    } catch {
      blueEssence.value = 0
    }

    try {
      const { data } = await lc.api.championInventory.getWalletByCurrency('RP')
      rp.value = toNumber(data, RP_KEYS) ?? 0
    } catch {
      rp.value = 0
    }
  }

  const refresh = async () => {
    if (isRefreshing.value) {
      return
    }

    isRefreshing.value = true

    try {
      if (!champions.value.length) {
        const { data: summary } = await lc.api.gameData.getChampionSummary()
        // 过滤掉无效与特殊模式英雄（如无尽狂潮、训练假人），只保留常规英雄
        champions.value = (summary ?? []).filter(
          (champion) => champion.id > 0 && champion.id < 1000
        )
      }

      // 统一使用 owned-champions-minimal，避免 /lol-champions/v1/inventories/:summonerId/champions-minimal 的 404
      const { data } = await lc.api.championInventory.getOwnedChampionsMinimal()
      const inventory = data ?? []

      ownedIds.value = new Set(
        inventory.filter(isPermanentlyOwned).map((champion) => champion.id)
      )
      freeIds.value = new Set(
        inventory.filter((champion) => champion.freeToPlay === true).map((champion) => champion.id)
      )

      await fetchWallet()
    } finally {
      isRefreshing.value = false
    }
  }

  let catalogLoaded = false

  /**
   * 拉取商城目录并解析全部英雄的蓝色精粹价格。
   *
   * 英雄价格的条目满足 `inventoryType === 'CHAMPION'`，其 `itemId` 即英雄 id。
   */
  const loadChampionPrices = async () => {
    const { data } = await lc.api.store.getCatalog()
    const next = new Map(priceMap.value)

    for (const item of normalizeCatalog(data)) {
      if (item?.inventoryType !== 'CHAMPION' || typeof item.itemId !== 'number') {
        continue
      }

      const price = blueEssencePriceOf(item)
      if (price !== null) {
        next.set(item.itemId, price)
      }
    }

    priceMap.value = next
  }

  /**
   * 按需拉取英雄的蓝色精粹价格。
   *
   * 首次请求即一次性拉取商城目录并缓存整表价格，后续直接命中缓存；
   * 拉取失败时不置位缓存标记，以便连接恢复后重试。
   */
  const ensurePrices = async (ids: number[]) => {
    if (!lcs.isConnected || catalogLoaded) {
      return
    }

    const missing = [...new Set(ids)].filter((id) => !priceMap.value.has(id))
    if (!missing.length) {
      return
    }

    isPriceLoading.value = true

    try {
      await loadChampionPrices()
      catalogLoaded = true
    } catch {
      // 忽略，稍后重试
    } finally {
      isPriceLoading.value = false
    }
  }

  const getPrice = (championId: number) => priceMap.value.get(championId)

  return {
    champions,
    ownedIds,
    freeIds,
    blueEssence,
    rp,
    priceMap,
    isRefreshing,
    isPriceLoading,
    refresh,
    ensurePrices,
    getPrice
  }
}
