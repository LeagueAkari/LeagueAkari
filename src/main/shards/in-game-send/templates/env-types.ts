import { GameDataState } from '@main/shards/league-client/lc-state/game-data'
import { OngoingGameSettings, OngoingGameState } from '@main/shards/ongoing-game/state'

/**
 * ================================================================================
 * TemplateEnv - JS 模板的运行时环境
 * ================================================================================
 *
 * 模板脚本通过 `getMessages(env)` 函数接收此对象，可以访问当前对局的所有玩家数据。
 *
 * ## 快速开始
 *
 * ```javascript
 * function getMessages(env) {
 *   // 获取目标玩家的战绩摘要
 *   return env.targetMembers.map(puuid => {
 *     const stats = env.analysis?.players[puuid]?.summary
 *     const name = env.summoner[puuid]?.gameName || '未知'
 *     return `${name} 胜率: ${((stats?.winRate || 0) * 100).toFixed(0)}%`
 *   })
 * }
 *
 * function getMetadata() {
 *   return { version: 20, type: 'ongoing-game' }
 * }
 * ```
 *
 * ## 数据流向
 *
 * 用户触发发送 → 根据 target 参数确定 targetMembers → 模板脚本处理 → 返回消息数组 → 发送到聊天
 *
 * ================================================================================
 */
export interface TemplateEnv {
  // ============================================================================
  // 基础配置
  // ============================================================================

  /**
   * 用户选择的发送目标
   *
   * - `'ally'`: 仅友方玩家
   * - `'enemy'`: 仅敌方玩家
   * - `'all'`: 所有玩家
   *
   * 此字段决定了 `targetMembers` 数组的内容
   */
  target: 'ally' | 'enemy' | 'all'

  /**
   * 当前应用的语言设置
   *
   * @example 'zh-CN' | 'en'
   *
   * 用于模板内的多语言支持，建议根据此字段返回对应语言的消息
   */
  locale: string

  /**
   * 内置工具函数集合
   */
  utils: {
    /**
     * 判断是否为人机对局
     *
     * @param queueId - 队列 ID，可从 `env.queryStage.gameInfo.queueId` 获取
     * @returns 是否为人机对局 (queueId 830/840/850)
     *
     * @example
     * if (env.utils.isBotQueue(env.queryStage.gameInfo.queueId)) {
     *   return [] // 人机对局不发送消息
     * }
     */
    isBotQueue: (queueId: number) => boolean

    /**
     * 判断是否为 PvE 对局（如无尽狂潮 Swarm）
     *
     * @param queueId - 队列 ID
     * @returns 是否为 PvE 对局
     */
    isPveQueue: (queueId: number) => boolean
  }

  // ============================================================================
  // 服务器与账号信息
  // ============================================================================

  /**
   * 当前登录大区的唯一标识符
   *
   * 由 League Akari 项目封装，用于精确区分不同服务器
   *
   * @example
   * - 腾讯服: 'TENCENT_HN1' (艾欧尼亚), 'TENCENT_BGP2' (峡谷之巅)
   * - 国际服: 'NA1', 'EUW1', 'KR'
   */
  sgpServerId: string

  /**
   * 当前登录大区的区域标识
   *
   * @example 'TENCENT', 'NA', 'EUW', 'KR'
   */
  region: string

  /**
   * 腾讯服务器的平台 ID
   *
   * 仅腾讯服有此字段，用于区分具体的服务器（如艾欧尼亚、德玛西亚等）
   *
   * @example 'HN1' (艾欧尼亚), 'HN10' (黑色玫瑰)
   */
  rsoPlatformId: string

  /**
   * 当前登录账号的 puuid
   *
   * puuid 是玩家的全局唯一标识符，格式为 UUID
   *
   * @example 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
   */
  selfPuuid: string

  /**
   * 当前玩家所属队伍的标识符
   *
   * **注意**: 此 teamId 并非 LCU 原生的 teamId，而是 League Akari 的二次封装
   *
   * @example
   * - 英雄选择/游戏中: 'TEAM-100' (蓝方) | 'TEAM-200' (红方)
   * - 斗魂竞技场 (Arena): 'TEAM-ALL' (所有玩家为一组)
   * - 大厅阶段: 'LOBBY'
   *
   * 若无法确定队伍，值为 'UNKNOWN'
   */
  selfTeamId: string

  // ============================================================================
  // 玩家分组
  // ============================================================================

  /**
   * 己方队伍所有成员的 puuid 数组
   *
   * 包含当前玩家自己
   *
   * @example ['puuid1', 'puuid2', 'puuid3', 'puuid4', 'puuid5']
   */
  allyMembers: string[]

  /**
   * 敌方队伍所有成员的 puuid 数组
   *
   * @example ['puuid6', 'puuid7', 'puuid8', 'puuid9', 'puuid10']
   */
  enemyMembers: string[]

  /**
   * 当前对局所有可见玩家的 puuid 数组
   *
   * 等于 `allyMembers` + `enemyMembers`
   */
  allMembers: string[]

  /**
   * 根据 `target` 参数确定的目标玩家 puuid 数组
   *
   * - `target === 'ally'` → `allyMembers`
   * - `target === 'enemy'` → `enemyMembers`
   * - `target === 'all'` → `allMembers`
   *
   * **推荐使用此字段遍历玩家**，而非直接使用 allyMembers/enemyMembers
   */
  targetMembers: string[]

  // ============================================================================
  // 游戏阶段与模式信息
  // ============================================================================

  /**
   * 当前游戏进行阶段及基础信息
   *
   * ```typescript
   * type QueryStage =
   *   | {
   *       phase: 'champ-select'  // 英雄选择阶段
   *       gameInfo: {
   *         queueId: number      // 队列 ID，如 420 (单排), 450 (极地大乱斗)
   *         queueType: string    // 队列类型，如 'RANKED_SOLO_5x5'
   *         gameMode: string     // 游戏模式，如 'CLASSIC', 'ARAM', 'CHERRY'
   *         gameId: number       // 当前对局 ID
   *       }
   *     }
   *   | {
   *       phase: 'in-game'       // 游戏进行中（包括加载、对局、结算）
   *       gameInfo: { ... }      // 同上
   *     }
   *   | {
   *       phase: 'lobby'         // 大厅阶段（需开启 queryInLobbyPhase 设置）
   *       gameInfo: {
   *         queueId: number
   *         queueType: string
   *       }
   *     }
   *   | {
   *       phase: 'unavailable'   // 不可用状态（未在游戏中）
   *       gameInfo: null
   *     }
   * ```
   *
   * @example
   * if (env.queryStage.phase === 'champ-select') {
   *   // 英雄选择阶段，使用召唤师名称
   *   const name = env.summoner[puuid]?.gameName
   * } else if (env.queryStage.phase === 'in-game') {
   *   // 游戏中，使用英雄名称
   *   const champId = env.championSelections[puuid]
   *   const name = env.gameData.champions[champId]?.name
   * }
   */
  queryStage: OngoingGameState['queryStage']

  // ============================================================================
  // 队伍与阵营
  // ============================================================================

  /**
   * 队伍划分映射表
   *
   * - **key**: 队伍标识符 (`'TEAM-100'` | `'TEAM-200'` | `'TEAM-ALL'` | `'LOBBY'`)
   * - **value**: 该队伍所有成员的 puuid 数组
   *
   * **注意**: 不包括匿名玩家（隐藏战绩的玩家）
   *
   * ```typescript
   * type Teams = Record<string, string[]>
   * ```
   *
   * @example
   * {
   *   'TEAM-100': ['puuid1', 'puuid2', 'puuid3', 'puuid4', 'puuid5'],
   *   'TEAM-200': ['puuid6', 'puuid7', 'puuid8', 'puuid9', 'puuid10']
   * }
   *
   * // 斗魂竞技场 (Arena) 模式
   * {
   *   'TEAM-ALL': ['puuid1', 'puuid2', ..., 'puuid8']
   * }
   */
  teams: OngoingGameState['teams']

  /**
   * 预组队分组映射（LCU 权威数据）
   *
   * - **key**: teamParticipantId（游戏内部的组队标识符）
   * - **value**: 该组队所有成员的 puuid 数组
   *
   * 此数据来源于 LCU，是最准确的预组队判断依据
   *
   * ```typescript
   * type TeamParticipantGroups = Record<string, string[]>
   * ```
   *
   * @example
   * {
   *   '1001': ['puuid1', 'puuid2'],      // 双排
   *   '1002': ['puuid3', 'puuid4', 'puuid5']  // 三排
   * }
   */
  teamParticipantGroups: OngoingGameState['teamParticipantGroups']

  /**
   * 预组队编号映射（综合推测结果）
   *
   * - **key**: 玩家 puuid
   * - **value**: 预组队编号（相同编号表示同一队伍）
   *
   * 整合了 `teamParticipantGroups`（权威数据）和战绩推测的结果
   *
   * ```typescript
   * type MergedPremadeTeamMap = Record<string, number>
   * ```
   *
   * @example
   * {
   *   'puuid1': 1,
   *   'puuid2': 1,  // 与 puuid1 是预组队
   *   'puuid3': 2,
   *   'puuid4': 2,
   *   'puuid5': 2   // puuid3, 4, 5 是三排
   * }
   *
   * // 判断两人是否预组队
   * const isPremade = env.mergedPremadeTeamMap[puuid1] === env.mergedPremadeTeamMap[puuid2]
   */
  mergedPremadeTeamMap: OngoingGameState['mergedPremadeTeamMap']

  // ============================================================================
  // 玩家基础信息
  // ============================================================================

  /**
   * 召唤师信息映射表
   *
   * - **key**: 玩家 puuid
   * - **value**: 召唤师详细信息（LCU 格式）
   *
   * ```typescript
   * type Summoner = Record<string, SummonerInfo>
   *
   * interface SummonerInfo {
   *   puuid: string              // 全局唯一标识符
   *   summonerId: number         // 召唤师 ID（服务器内唯一）
   *   accountId: number          // 账号 ID
   *   displayName: string        // 显示名称（旧 ID 系统）
   *   gameName: string           // 游戏名称（新 Riot ID 系统）
   *   tagLine: string            // 标签（如 #1234）
   *   profileIconId: number      // 头像图标 ID
   *   summonerLevel: number      // 召唤师等级
   *   privacy: 'PUBLIC' | 'PRIVATE'  // 隐私设置
   *   // ... 其他字段
   * }
   * ```
   *
   * @example
   * const info = env.summoner[puuid]
   * const name = info?.gameName || info?.displayName || '未知召唤师'
   * const level = info?.summonerLevel || 0
   */
  summoner: OngoingGameState['summoner']

  /**
   * 排位段位信息映射表
   *
   * - **key**: 玩家 puuid
   * - **value**: 排位详细信息（LCU 格式）
   *
   * ```typescript
   * type RankedStats = Record<string, {
   *   queueMap: {
   *     RANKED_SOLO_5x5: RankedEntry    // 单排/双排
   *     RANKED_FLEX_SR: RankedEntry     // 灵活组排
   *     CHERRY: RankedEntry             // 斗魂竞技场
   *     // ... 其他队列
   *   }
   *   highestRankedEntry: RankedEntry   // 最高段位
   *   highestRankedEntrySR: RankedEntry // 召唤师峡谷最高段位
   *   // ...
   * }>
   *
   * interface RankedEntry {
   *   tier: string           // 段位: 'IRON' | 'BRONZE' | ... | 'CHALLENGER'
   *   division: string       // 小段: 'I' | 'II' | 'III' | 'IV'
   *   leaguePoints: number   // 胜点 (LP)
   *   wins: number           // 胜场
   *   losses: number         // 败场
   *   isProvisional: boolean // 是否定位赛中
   *   // ... 其他字段
   * }
   * ```
   *
   * @example
   * const ranked = env.rankedStats[puuid]
   * const soloRank = ranked?.queueMap?.RANKED_SOLO_5x5
   * const tier = soloRank?.tier || 'UNRANKED'  // 'GOLD', 'PLATINUM', etc.
   * const division = soloRank?.division || ''  // 'I', 'II', etc.
   * const lp = soloRank?.leaguePoints || 0
   */
  rankedStats: OngoingGameState['rankedStats']

  /**
   * 本地数据库保存的玩家信息映射表
   *
   * - **key**: 玩家 puuid
   * - **value**: 保存的玩家标记信息
   *
   * 用于显示曾经标记过的玩家（如添加备注、遇见记录等）
   *
   * ```typescript
   * type SavedInfo = Record<string, SavedPlayer>
   *
   * interface SavedPlayer {
   *   puuid: string           // 玩家 puuid
   *   selfPuuid: string       // 标记者的 puuid
   *   region: string          // 地区
   *   rsoPlatformId: string   // 平台 ID
   *   tag: string | null      // 用户添加的标记/备注
   *   updateAt: Date          // 上次更新时间
   *   lastMetAt: Date | null  // 上次匹配到的时间
   * }
   * ```
   *
   * @example
   * const saved = env.savedInfo[puuid]
   * if (saved?.tag) {
   *   message += ` [备注: ${saved.tag}]`
   * }
   * if (saved?.lastMetAt) {
   *   message += ` (曾在 ${saved.lastMetAt} 遇见)`
   * }
   */
  savedInfo: OngoingGameState['savedInfo']

  // ============================================================================
  // 英雄相关信息
  // ============================================================================

  /**
   * 英雄选择映射表
   *
   * - **key**: 玩家 puuid
   * - **value**: 选择的英雄 ID
   *
   * 在英雄选择阶段，此值可能为 0 或 Intent（预选英雄）
   *
   * ```typescript
   * type ChampionSelections = Record<string, number>
   * ```
   *
   * @example
   * const champId = env.championSelections[puuid]
   * const champName = env.gameData.champions[champId]?.name || '未知英雄'
   *
   * // 常见英雄 ID
   * // 1: 黑暗之女 (Annie)
   * // 64: 盲僧 (Lee Sin)
   * // 157: 疾风剑豪 (Yasuo)
   */
  championSelections: OngoingGameState['championSelections']

  /**
   * 英雄熟练度映射表
   *
   * - **key (外层)**: 玩家 puuid
   * - **key (内层)**: 英雄 ID
   * - **value**: 熟练度信息
   *
   * ```typescript
   * type ChampionMastery = Record<string, Record<number, {
   *   championId: number       // 英雄 ID
   *   championLevel: number    // 熟练度等级 (1-7)
   *   championPoints: number   // 熟练度点数
   * }>>
   * ```
   *
   * @example
   * const champId = env.championSelections[puuid]
   * const mastery = env.championMastery[puuid]?.[champId]
   * const level = mastery?.championLevel || 0
   * const points = mastery?.championPoints || 0
   *
   * // 输出: "英雄熟练度 Lv.7 (123456 点)"
   */
  championMastery: OngoingGameState['championMastery']

  /**
   * 位置分配信息映射表
   *
   * - **key**: 玩家 puuid
   * - **value**: 位置分配详情
   *
   * ```typescript
   * type PositionAssignments = Record<string, {
   *   position: string   // 分配的位置: 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY' | ''
   *   role: ParsedRole | null  // 解析后的角色信息（仅游戏中阶段）
   * }>
   *
   * interface ParsedRole {
   *   current: string          // 当前位置
   *   assignmentReason: string // 分配原因: 'PRIMARY' | 'SECONDARY' | 'FILL_PRIMARY' | 'FILL_SECONDARY' | 'AUTOFILL'
   *   primary: string          // 首选位置
   *   secondary: string        // 次选位置
   * }
   * ```
   *
   * @example
   * const pos = env.positionAssignments[puuid]
   * const position = pos?.position || '未知'  // 'TOP', 'JUNGLE', etc.
   * const isAutofill = pos?.role?.assignmentReason === 'AUTOFILL'
   */
  positionAssignments: OngoingGameState['positionAssignments']

  // ============================================================================
  // 战绩与统计数据
  // ============================================================================

  /**
   * 玩家战绩数据映射表
   *
   * - **key**: 玩家 puuid
   * - **value**: 战绩数据（包含来源、参数、具体对局）
   *
   * ```typescript
   * type MatchHistory = Record<string, {
   *   source: 'lcu' | 'sgp'     // 数据来源
   *   params: MatchHistoryQueryParams  // 查询参数
   *   data: LcuOrSgpGameSummary[]      // 对局列表
   * }>
   *
   * type LcuOrSgpGameSummary = {
   *   gameId: number
   *   source: 'lcu' | 'sgp'
   *   data: Game | SgpGameSummaryLol  // 根据 source 不同结构略有差异
   * }
   * ```
   *
   * **推荐使用 `analysis` 而非直接使用 `matchHistory`**，
   * `analysis` 已经对战绩进行了统计分析
   *
   * @example
   * const history = env.matchHistory[puuid]
   * const games = history?.data || []
   * const recentGames = games.slice(0, 10)
   */
  matchHistory: OngoingGameState['matchHistory']

  /**
   * 玩家统计数据（核心数据，强烈推荐使用）
   *
   * 基于 `matchHistory` 和 `gameDetails` 自动计算的综合统计数据。
   * 注意：这是 analysis 的结构，胜负、召唤师技能、队伍侧、详情分析等字段已拆分到独立分组。
   *
   * ```typescript
   * type Analysis = {
   *   players: Record<string, AggregatedAnalysis>   // 单个玩家统计
   *   teams: Record<string, AggregatedTeamAnalysis> // 队伍整体统计
   * } | null
   *
   * interface AggregatedAnalysis {
   *   count: number                                  // 有效对局总数
   *   summary: AggregatedSummaryAnalysis             // KDA、伤害、经济、视野等汇总
   *   details: AggregatedDetailsAnalysis | null      // 依赖 timeline/details 的汇总，无 details 时为 null
   *   detailsCount: number                           // 提供 details 的对局数量
   *   akariScore: AkariScore                         // Akari 评分
   *   map: Record<number, SingleAnalysis>            // 每场对局分析 (key: gameId)
   *   teamSide: AggregatedTeamSideAnalysis           // 蓝/红方场次
   *   winLoss: AggregatedWinLossAnalysisMap          // 胜负统计（all/normal/cherry）
   *   spells: AggregatedSpellsAnalysis               // 召唤师技能统计
   *   positions: AggregatedPositionAnalysis | null   // 位置统计，无法判断时为 null
   *   champions: Record<number, AggregatedChampionAnalysis> // 英雄使用统计 (key: championId)
   *   jungle: AggregatedJungleAnalysis | null        // 打野路径分析，非打野或缺少 details 时为 null
   * }
   *
   * interface AggregatedSummaryAnalysis {
   *   kills: number
   *   deaths: number
   *   assists: number
   *   avgKda: number
   *   kdaCv: number
   *   winRate: number                                // 与 winLoss.all.winRate 等价的汇总胜率
   *   avgKillParticipation: number
   *   avgChampionDamageRatioToTeamMax: number
   *   avgChampionDamagePercentageOfTeam: number
   *   avgDamageTakenRatioToTeamMax: number
   *   avgDamageTakenPercentageOfTeam: number
   *   avgGoldRatioToTeamMax: number
   *   avgGoldPercentageOfTeam: number
   *   avgCsPerMinute: number
   *   avgVisionScore: number
   *   avgDamageGoldEfficiency: number
   *   avgSoloKills: number | null                    // SGP 数据源专有字段
   *   avgEnemyMissingPings: number | null            // SGP 数据源专有字段
   *   avgPings: number | null                        // SGP 数据源专有字段
   * }
   *
   * interface AggregatedWinLossAnalysisMap {
   *   all: AggregatedWinLossAnalysis                 // 全部模式
   *   normal: AggregatedWinLossAnalysis              // 非斗魂模式
   *   cherry: AggregatedCherryWinLossAnalysis        // 斗魂竞技场
   * }
   *
   * interface AggregatedWinLossAnalysis {
   *   count: number
   *   wins: number
   *   losses: number
   *   winRate: number
   *   winningStreak: number
   *   losingStreak: number
   *   activeSessionWins: number
   *   activeSessionLosses: number
   * }
   *
   * interface AggregatedCherryWinLossAnalysis extends AggregatedWinLossAnalysis {
   *   top1s: number
   *   topHalfFinishes: number
   *   top1Rate: number
   *   topHalfRate: number
   *   avgSubteamPlacement: number
   * }
   *
   * interface AggregatedSpellsAnalysis {
   *   flashOnD: number
   *   flashOnF: number
   * }
   *
   * interface AggregatedChampionAnalysis {
   *   championId: number
   *   winLoss: AggregatedWinLossAnalysisMap
   *   jungle: AggregatedJungleAnalysis | null
   * }
   *
   * interface AggregatedTeamAnalysis {
   *   avgWinRate: number
   *   wins: number
   *   losses: number
   *   games: number
   *   kills: number
   *   deaths: number
   *   assists: number
   *   avgKda: number
   *   avgAkariScore: number
   *   akariScoreCv: number
   *   akariScoreBsi: number
   * }
   * ```
   *
   * @example
   * if (!env.analysis) return []
   *
   * return env.targetMembers.map(puuid => {
   *   const analysis = env.analysis.players[puuid]
   *   if (!analysis) return '无数据'
   *
   *   const winLoss = analysis.winLoss.all
   *   const winRate = (winLoss.winRate * 100).toFixed(0)
   *   const kda = analysis.summary.avgKda.toFixed(2)
   *   return `近${analysis.count}场: 胜率${winRate}% KDA${kda}`
   * })
   *
   * // 判断是否连败
   * const isOnLosingStreak = analysis.winLoss.all.losingStreak >= 3
   *
   * // 判断闪现位置
   * const flashPosition = analysis.spells.flashOnD > analysis.spells.flashOnF ? 'D' : 'F'
   */
  analysis: OngoingGameState['analysis']

  /**
   * 对局详情映射表（时间线数据）
   *
   * - **key**: 对局 ID (gameId)
   * - **value**: 对局详细时间线数据
   *
   * 仅加载最近 N 场对局的详情（N 可在 `settings.gameDetailsLoadCount` 中配置）
   *
   * ```typescript
   * type GameDetails = Record<number, LcuOrSgpGameDetails>
   *
   * type LcuOrSgpGameDetails =
   *   | { gameId: number; source: 'lcu'; data: GameTimeline }
   *   | { gameId: number; source: 'sgp'; data: SgpGameDetailsLol }
   * ```
   *
   * @example
   * const history = env.matchHistory[puuid]?.data || []
   * const recentGame = history[0]
   * const details = env.gameDetails[recentGame?.gameId]
   */
  gameDetails: OngoingGameState['gameDetails']

  /**
   * 额外加载的对局映射表
   *
   * - **key**: 对局 ID (gameId)
   * - **value**: 对局摘要数据
   *
   * 用于存储因特殊原因额外加载的对局（如遇到熟人时自动加载的相关历史对局）
   *
   * ```typescript
   * type AdditionalGame = Record<number, LcuOrSgpGameSummary>
   * ```
   */
  additionalGame: OngoingGameState['additionalGame']

  // ============================================================================
  // 游戏静态资源
  // ============================================================================

  /**
   * 游戏静态数据（英雄、物品、符文等）
   *
   * 从客户端加载的游戏资源数据，用于将 ID 转换为可读名称
   *
   * ```typescript
   * interface GameDataState {
   *   // 英雄数据
   *   champions: Record<number, ChampionSimple>
   *   // ChampionSimple: { id, name, alias, squarePortraitPath, roles }
   *   // 例: champions[157] = { id: 157, name: '疾风剑豪', alias: 'Yasuo', ... }
   *
   *   // 召唤师技能
   *   summonerSpells: Record<number, SummonerSpell>
   *   // 例: summonerSpells[4] = { id: 4, name: '闪现', ... }
   *
   *   // 物品数据
   *   items: Record<number, Item>
   *   // 例: items[3006] = { id: 3006, name: '狂战士胫甲', ... }
   *
   *   // 队列信息
   *   queues: Record<number, Queue>
   *   // 例: queues[420] = { id: 420, name: '排位赛 单排/双排', ... }
   *
   *   // 符文数据
   *   perks: Record<number, Perk>
   *   perkstyles: { schemaVersion: number, styles: Record<number, Style> }
   *
   *   // 斗魂竞技场强化符文
   *   augments: Record<number, Augment>
   *
   *   // 地图信息
   *   maps: Record<number, GameMap>
   *
   *   // 便捷方法
   *   championName(id: number): string  // 获取英雄名称，找不到返回 ID 字符串
   * }
   * ```
   *
   * @example
   * // 获取英雄名称
   * const champId = env.championSelections[puuid]
   * const champName = env.gameData.champions[champId]?.name || '未知英雄'
   * // 或使用便捷方法
   * const champName2 = env.gameData.championName(champId)
   *
   * // 获取队列名称
   * const queueName = env.gameData.queues[env.queryStage.gameInfo.queueId]?.name
   *
   * // 获取召唤师技能名称
   * const flashName = env.gameData.summonerSpells[4]?.name  // '闪现'
   */
  gameData: GameDataState

  // ============================================================================
  // 设置项
  // ============================================================================

  /**
   * Ongoing Game 模块的设置项
   *
   * 包含战绩加载、显示等相关配置
   *
   * ```typescript
   * interface OngoingGameSettings {
   *   enabled: boolean                    // 模块是否启用
   *   matchHistoryLoadCount: number       // 战绩加载数量 (默认 50)
   *   gameDetailsLoadCount: number        // 对局详情加载数量 (默认 8)
   *   concurrency: number                 // 并发请求数
   *   matchHistoryTagPreference: 'current' | 'all'  // 战绩查询偏好
   *   orderPlayerBy: 'win-rate' | 'kda' | 'default' | 'akari-score' | 'position' | 'premade-team'
   *   showChampionUsage: 'recent' | 'mastery' | 'none'
   *   queryInLobbyPhase: boolean          // 是否在大厅阶段查询
   *   premadeTeamInferMatchCountThreshold: number  // 预组队推测所需最小场次
   *   // ... 其他设置
   * }
   * ```
   *
   * @example
   * // 检查加载了多少场战绩
   * const loadCount = env.settings.matchHistoryLoadCount
   */
  settings: OngoingGameSettings

  // ============================================================================
  // 附加信息
  // ============================================================================

  /**
   * 额外补充信息
   *
   * 用于存储通过其他途径（如 Spectator API）获取的补充数据
   *
   * ```typescript
   * interface AdditionalResult {
   *   teams: Record<string, string[]>           // 额外的队伍信息
   *   selections: Record<string, number>        // 额外的英雄选择
   *   teamParticipantGroups: Record<string, number>  // 额外的组队信息
   *   spells: Record<string, { spell1Id: number; spell2Id: number }>  // 召唤师技能
   *   positions: Record<string, { position: string; role: ParsedRole | null }>  // 位置
   * }
   * ```
   *
   * 通常不需要直接使用此字段，相关数据会被合并到 `teams`、`championSelections` 等主字段中
   */
  addition: OngoingGameState['additional']
}
