import { useInstance } from '@renderer-shared/shards'
import { ExtraAssetsRenderer } from '@renderer-shared/shards/extra-assets'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { ChampionSimple } from '@shared/types/league-client/game-data'
import { computed, reactive, ref } from 'vue'

const NAMESPACE = 'aram-tools-week-free'

/** 官方名单至少应有这么多条时才视为有效，避免旧版本/异常数据造成的失真 */
const MIN_PLAUSIBLE_COUNT = 20

interface AramWeekFreeState {
  /** 最近一次从官方数据源解析出的名单，同时充当离线缓存 */
  remoteIds: number[]
  lastSyncedAt: number | null
}

const state = reactive<AramWeekFreeState>({
  remoteIds: [],
  lastSyncedAt: null
})

const isFromRemote = ref(false)
const isSyncing = ref(false)
const lastError = ref<string | null>(null)

let initPromise: Promise<void> | null = null
let autoSyncStarted = false

/**
 * 本周大乱斗免费英雄内置名单（官方页面快照，共 52 位）。
 *
 * `id` 为英雄 id，`name` 为称号（如「卡牌大师」），`title` 为英雄名（如「崔斯特」），
 * `alias` 为英文别名。匹配时依次尝试 id、alias、称号与英雄名，兼容不同数据源。
 */
interface AramFreeSeed {
  id: number
  name: string
  title: string
  alias: string
}

const ARAM_FREE_ROSTER: AramFreeSeed[] = [
  { id: 4, name: '卡牌大师', title: '崔斯特', alias: 'TwistedFate' },
  { id: 6, name: '无畏战车', title: '厄加特', alias: 'Urgot' },
  { id: 13, name: '符文法师', title: '瑞兹', alias: 'Ryze' },
  { id: 17, name: '迅捷斥候', title: '提莫', alias: 'Teemo' },
  { id: 22, name: '寒冰射手', title: '艾希', alias: 'Ashe' },
  { id: 23, name: '蛮族之王', title: '泰达米尔', alias: 'Tryndamere' },
  { id: 25, name: '堕落天使', title: '莫甘娜', alias: 'Morgana' },
  { id: 27, name: '炼金术士', title: '辛吉德', alias: 'Singed' },
  { id: 28, name: '痛苦之拥', title: '伊芙琳', alias: 'Evelynn' },
  { id: 32, name: '殇之木乃伊', title: '阿木木', alias: 'Amumu' },
  { id: 36, name: '祖安狂人', title: '蒙多医生', alias: 'DrMundo' },
  { id: 37, name: '琴瑟仙女', title: '娑娜', alias: 'Sona' },
  { id: 41, name: '海洋之灾', title: '普朗克', alias: 'Gangplank' },
  { id: 42, name: '英勇投弹手', title: '库奇', alias: 'Corki' },
  { id: 50, name: '诺克萨斯统领', title: '斯维因', alias: 'Swain' },
  { id: 54, name: '熔岩巨兽', title: '墨菲特', alias: 'Malphite' },
  { id: 72, name: '上古领主', title: '斯卡纳', alias: 'Skarner' },
  { id: 79, name: '酒桶', title: '古拉加斯', alias: 'Gragas' },
  { id: 81, name: '探险家', title: '伊泽瑞尔', alias: 'Ezreal' },
  { id: 82, name: '铁铠冥魂', title: '莫德凯撒', alias: 'Mordekaiser' },
  { id: 84, name: '离群之刺', title: '阿卡丽', alias: 'Akali' },
  { id: 86, name: '德玛西亚之力', title: '盖伦', alias: 'Garen' },
  { id: 98, name: '暮光之眼', title: '慎', alias: 'Shen' },
  { id: 99, name: '光辉女郎', title: '拉克丝', alias: 'Lux' },
  { id: 102, name: '龙血武姬', title: '希瓦娜', alias: 'Shyvana' },
  { id: 114, name: '无双剑姬', title: '菲奥娜', alias: 'Fiora' },
  { id: 126, name: '未来守护者', title: '杰斯', alias: 'Jayce' },
  { id: 131, name: '皎月女神', title: '黛安娜', alias: 'Diana' },
  { id: 134, name: '暗黑元首', title: '辛德拉', alias: 'Syndra' },
  { id: 136, name: '铸星龙王', title: '奥瑞利安·索尔', alias: 'AurelionSol' },
  { id: 141, name: '影流之镰', title: '凯隐', alias: 'Kayn' },
  { id: 142, name: '暮光星灵', title: '佐伊', alias: 'Zoe' },
  { id: 143, name: '荆棘之兴', title: '婕拉', alias: 'Zyra' },
  { id: 150, name: '迷失之牙', title: '纳尔', alias: 'Gnar' },
  { id: 201, name: '弗雷尔卓德之心', title: '布隆', alias: 'Braum' },
  { id: 202, name: '戏命师', title: '烬', alias: 'Jhin' },
  { id: 203, name: '永猎双子', title: '千珏', alias: 'Kindred' },
  { id: 222, name: '暴走萝莉', title: '金克丝', alias: 'Jinx' },
  { id: 223, name: '河流之王', title: '塔姆', alias: 'TahmKench' },
  { id: 235, name: '涤魂圣枪', title: '赛娜', alias: 'Senna' },
  { id: 245, name: '时间刺客', title: '艾克', alias: 'Ekko' },
  { id: 254, name: '皮城执法官', title: '蔚', alias: 'Vi' },
  { id: 267, name: '唤潮鲛姬', title: '娜美', alias: 'Nami' },
  { id: 268, name: '沙漠皇帝', title: '阿兹尔', alias: 'Azir' },
  { id: 420, name: '海兽祭司', title: '俄洛伊', alias: 'Illaoi' },
  { id: 517, name: '解脱者', title: '塞拉斯', alias: 'Sylas' },
  { id: 518, name: '万花通灵', title: '妮蔻', alias: 'Neeko' },
  { id: 711, name: '愁云使者', title: '薇古丝', alias: 'Vex' },
  { id: 893, name: '双界灵兔', title: '阿萝拉', alias: 'Aurora' },
  { id: 895, name: '不羁之悦', title: '尼菈', alias: 'Nilah' },
  { id: 901, name: '炽炎雏龙', title: '斯莫德', alias: 'Smolder' },
  { id: 904, name: '不落魔锋', title: '亚恒', alias: 'Zaahen' }
]

/** 将内置名单匹配到当前英雄列表中的实际 id */
function resolveBuiltinIds(champions: ChampionSimple[]): number[] {
  const ids = new Set<number>()

  for (const seed of ARAM_FREE_ROSTER) {
    const byId = champions.find((champion) => champion.id === seed.id)
    if (byId) {
      ids.add(byId.id)
      continue
    }

    const alias = seed.alias.toLowerCase()
    const byAlias = champions.find((champion) => champion.alias?.toLowerCase() === alias)
    if (byAlias) {
      ids.add(byAlias.id)
      continue
    }

    const names = [seed.name, seed.title]
    const byName = champions.find((champion) => names.includes(champion.name))
    if (byName) {
      ids.add(byName.id)
    }
  }

  return [...ids]
}

function isPlausible(ids: number[]): boolean {
  return ids.length >= MIN_PLAUSIBLE_COUNT
}

/**
 * 大乱斗免费英雄名单管理。
 *
 * 页面加载时自动请求官方数据源；成功后持久化到本地并用于打标，
 * 失败时回退到上一次成功缓存，再退回到内置的 52 人名单。
 * 该名单与购物车的「手动勾选」完全独立，勾选英雄不会影响周免标签。
 */
export function useAramWeekFree() {
  const settingUtils = useInstance(SettingUtilsRenderer)
  const extraAssets = useInstance(ExtraAssetsRenderer)

  if (!initPromise) {
    initPromise = (async () => {
      await settingUtils.savedPropVue(NAMESPACE, state, 'remoteIds', {
        watchOptions: { deep: true }
      })
      await settingUtils.savedPropVue(NAMESPACE, state, 'lastSyncedAt')

      // 旧版本可能写入过不完整的数据（例如仅 1 条），这里直接丢弃
      if (!isPlausible(state.remoteIds)) {
        state.remoteIds = []
      }

      isFromRemote.value = state.remoteIds.length > 0
    })()
  }

  const hasRemote = computed(() => state.remoteIds.length > 0)
  const lastSyncedAt = computed(() => state.lastSyncedAt)

  /**
   * 计算最终生效的周免 id 集合：
   * 官方名单 / 本地缓存优先，缺失时使用内置的 52 人名单兜底。
   */
  const buildIds = (champions: ChampionSimple[]): Set<number> => {
    const base = state.remoteIds.length ? state.remoteIds : resolveBuiltinIds(champions)
    return new Set(base)
  }

  const applyResult = (ids: number[], champions: ChampionSimple[]): boolean => {
    const available = new Set(champions.map((champion) => champion.id))
    const valid = [...new Set(ids)].filter((id) => available.has(id))

    if (!isPlausible(valid)) {
      return false
    }

    state.remoteIds = valid
    state.lastSyncedAt = Date.now()
    isFromRemote.value = true
    return true
  }

  /** 请求主进程拉取官方大乱斗免费英雄名单 */
  const sync = async (champions: ChampionSimple[]): Promise<boolean> => {
    if (isSyncing.value || !champions.length) {
      return false
    }

    isSyncing.value = true
    lastError.value = null

    try {
      const ids = await extraAssets.refreshAramFreeChampions()

      if (ids && ids.length && applyResult(ids, champions)) {
        return true
      }

      lastError.value = 'request-failed'
      return false
    } catch (error: any) {
      lastError.value = error?.message ?? 'unknown-error'
      return false
    } finally {
      isSyncing.value = false
    }
  }

  /** 页面加载后自动执行一次同步（每个应用会话仅一次） */
  const ensureLoaded = async (champions: ChampionSimple[]) => {
    if (!champions.length) {
      return
    }

    if (initPromise) {
      await initPromise
    }

    if (autoSyncStarted) {
      return
    }

    autoSyncStarted = true
    await sync(champions)
  }

  return {
    state,
    hasRemote,
    isFromRemote,
    isSyncing,
    lastError,
    lastSyncedAt,
    buildIds,
    ensureLoaded,
    sync
  }
}
