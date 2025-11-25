import { Participant } from '@shared/types/league-client/match-history'
import { SgpParticipantLol } from '@shared/types/sgp/match-history'
import { type VNodeChild, computed, toValue } from 'vue'

import { useMatchCard } from '../context'
import { formatSeconds } from './time'

/**
 * 数据字段中文翻译对象
 */
export const STAT_KEY_TRANSLATIONS: Record<string, string> = {
  // Combat Stats - 战斗数据
  kills: '击杀',
  deaths: '死亡',
  assists: '助攻',
  doubleKills: '双杀',
  tripleKills: '三杀',
  quadraKills: '四杀',
  pentaKills: '五杀',
  unrealKills: '超神',
  killingSprees: '连杀',
  largestKillingSpree: '最大连杀',
  largestMultiKill: '最大多杀',
  longestTimeSpentLiving: '最长存活时间',
  largestCriticalStrike: '最大暴击伤害',

  // Damage - 伤害数据
  totalDamageDealtToChampions: '对英雄总伤害',
  physicalDamageDealtToChampions: '对英雄物理伤害',
  magicDamageDealtToChampions: '对英雄魔法伤害',
  trueDamageDealtToChampions: '对英雄真实伤害',
  totalDamageDealt: '总伤害输出',
  physicalDamageDealt: '物理伤害输出',
  magicDamageDealt: '魔法伤害输出',
  trueDamageDealt: '真实伤害输出',
  damageDealtToObjectives: '对战略点伤害',
  damageDealtToTurrets: '对防御塔伤害',
  damageDealtToBuildings: '对建筑物伤害',
  damageDealtToEpicMonsters: '对史诗野怪伤害',
  totalDamageTaken: '承受总伤害',
  physicalDamageTaken: '承受物理伤害',
  magicDamageTaken: '承受魔法伤害',
  magicalDamageTaken: '承受魔法伤害',
  trueDamageTaken: '承受真实伤害',
  damageSelfMitigated: '自我缓和的伤害',
  totalDamageShieldedOnTeammates: '为队友提供护盾量',

  // CC - 控制
  timeCCingOthers: '控制他人时长',
  totalTimeCCDealt: '总控制时长',
  totalTimeCrowdControlDealt: '总控制时长',
  enemyChampionImmobilizations: '定身敌方英雄次数',
  immobilizeAndKillWithAlly: '定身并与队友击杀',
  knockEnemyIntoTeamAndKill: '将敌方拉入己方并击杀',
  survivedThreeImmobilizesInFight: '三次定身后仍存活',
  highestCrowdControlScore: '最高控制得分',

  // Vision - 视野
  visionScore: '视野得分',
  wardsPlaced: '插眼数',
  wardsKilled: '排眼数',
  sightWardsBoughtInGame: '购买假眼数',
  visionWardsBoughtInGame: '购买真眼数',
  detectorWardsPlaced: '放置侦查守卫',
  visionScorePerMinute: '每分钟视野得分',
  visionScoreAdvantageLaneOpponent: '对线对手视野得分优势',
  wardTakedowns: '摧毁守卫数',
  wardTakedownsBefore20M: '二十分钟前排眼数',
  wardsGuarded: '守卫保护数',
  twoWardsOneSweeperCount: '一次扫描清除两个眼',
  controlWardsPlaced: '放置控制守卫',
  stealthWardsPlaced: '放置隐形守卫',

  // Buildings - 建筑
  turretKills: '防御塔击杀',
  turretTakedowns: '防御塔摧毁',
  soloTurretsLategame: '后期单带拆塔',
  turretsLost: '失去防御塔',
  firstTowerKill: '首个防御塔摧毁',
  firstTowerAssist: '首个防御塔助攻',
  firstTurretKilled: '首个防御塔',
  firstTurretKilledTime: '首个防御塔时间',
  turretPlatesTaken: '塔皮摧毁数',
  kTurretsDestroyedBeforePlatesFall: '塔皮掉落前摧毁防御塔',
  outerTurretExecutesBefore10Minutes: '十分钟前外塔击杀',
  quickFirstTurret: '快速首塔',
  takedownOnFirstTurret: '首塔击杀参与',
  turretsTakenWithRiftHerald: '峡谷先锋摧毁防御塔',
  multiTurretRiftHeraldCount: '先锋多塔摧毁',
  inhibitorKills: '水晶击杀',
  inhibitorTakedowns: '水晶摧毁',
  inhibitorsLost: '失去水晶',
  firstInhibitorKill: '首个水晶击杀',
  firstInhibitorAssist: '首个水晶助攻',
  lostAnInhibitor: '失去水晶',
  nexusKills: '主水晶击杀',
  nexusLost: '失去主水晶',
  nexusTakedowns: '主水晶摧毁',
  hadOpenNexus: '主水晶暴露',
  outnumberedNexusKill: '人数劣势主水晶摧毁',
  objectivesStolen: '战略点偷取',
  objectivesStolenAssists: '战略点偷取助攻',

  // Economy - 经济
  goldEarned: '获得金币',
  goldSpent: '花费金币',
  totalMinionsKilled: '补刀数',
  neutralMinionsKilled: '野怪击杀',
  neutralMinionsKilledEnemyJungle: '敌方野区野怪',
  neutralMinionsKilledTeamJungle: '己方野区野怪',
  totalAllyJungleMinionsKilled: '己方野区野怪总数',
  totalEnemyJungleMinionsKilled: '敌方野区野怪总数',
  consumablesPurchased: '购买消耗品',
  itemsPurchased: '购买装备',
  earlyLaningPhaseGoldExpAdvantage: '早期对线阶段金币经验优势',
  laningPhaseGoldExpAdvantage: '对线阶段金币经验优势',
  maxCsAdvantageOnLaneOpponent: '对线对手最大补刀优势',

  // Healing - 治疗
  totalHeal: '总治疗量',
  totalUnitsHealed: '治疗单位数',
  totalHealsOnTeammates: '队友治疗量',

  // Pings - 信号
  allInPings: '开团信号',
  assistMePings: '请求协助信号',
  basicPings: '基础信号',
  commandPings: '命令信号',
  dangerPings: '危险信号',
  enemyMissingPings: '敌人消失信号',
  enemyVisionPings: '敌方视野信号',
  getBackPings: '后退信号',
  holdPings: '等待信号',
  needVisionPings: '需要视野信号',
  onMyWayPings: '正在路上信号',
  pushPings: '推进信号',
  retreatPings: '撤退信号',
  visionClearedPings: '视野清除信号',

  // Combat Advanced - 战斗进阶
  soloKills: '单杀',
  quickSoloKills: '快速单杀',
  takedowns: '击杀参与',
  outnumberedKills: '以少打多击杀',
  multikills: '多杀',
  multikillsAfterAggressiveFlash: '进攻性闪现多杀',
  multiKillOneSpell: '单技能多杀',
  killAfterHiddenWithAlly: '与队友藏身后击杀',
  pickKillWithAlly: '与队友抓人',
  killsWithHelpFromEpicMonster: '史诗野怪增益击杀',
  takedownsBeforeJungleMinionSpawn: '野怪刷新前击杀',
  takedownsFirstXMinutes: '前X分钟击杀',
  takedownsAfterGainingLevelAdvantage: '等级优势击杀',
  takedownsInAlcove: '凹室击杀',
  takedownsInEnemyFountain: '敌方泉水击杀',
  killsOnOtherLanesEarlyJungleAsLaner: '线上英雄早期支援击杀',
  getTakedownsInAllLanesEarlyJungleAsLaner: '早期全线支援',
  killsOnRecentlyHealedByAramPack: '击杀刚拾取治疗包的敌人',

  // Objectives - 战略点
  baronTakedowns: '参与大龙击杀',
  dragonTakedowns: '参与小龙击杀',
  riftHeraldTakedowns: '参与峡谷先锋击杀',
  teamBaronKills: '团队大龙击杀',
  teamElderDragonKills: '团队远古龙击杀',
  teamRiftHeraldKills: '团队先锋击杀',
  soloBaronKills: '单杀大龙',
  baronBuffGoldAdvantageOverThreshold: '大龙Buff金币优势',
  earliestBaron: '最早大龙时间',
  elderDragonKillsWithOpposingSoul: '敌方有龙魂时的远古龙',
  elderDragonMultikills: '远古龙增益多杀',
  perfectDragonSoulsTaken: '完美龙魂',
  epicMonsterSteals: '偷取史诗野怪',
  epicMonsterStolenWithoutSmite: '无惩戒偷取史诗野怪',
  epicMonsterKillsNearEnemyJungler: '敌方打野附近击杀史诗野怪',
  epicMonsterKillsWithin30SecondsOfSpawn: '刷新30秒内击杀史诗野怪',
  junglerTakedownsNearDamagedEpicMonster: '打野在受伤史诗野怪附近击杀',
  voidMonsterKill: '虚空野怪击杀',
  alliedJungleMonsterKills: '己方野怪击杀',
  enemyJungleMonsterKills: '敌方野怪击杀',
  scuttleCrabKills: '河蟹击杀',
  buffsStolen: '偷取 BUFF',
  jungleCsBefore10Minutes: '十分钟前野区补刀',
  initialBuffCount: '初始 BUFF 数量',
  initialCrabCount: '初始河蟹数量',
  moreEnemyJungleThanOpponent: '反野数量领先',

  // Statistics - 统计
  kda: 'KDA',
  killParticipation: '击杀参与率',
  damagePerMinute: '每分钟伤害',
  goldPerMinute: '每分钟金币',
  damageTakenOnTeamPercentage: '团队承伤占比',
  teamDamagePercentage: '团队伤害占比',

  // Abilities - 技能
  abilityUses: '技能使用次数',
  spell1Casts: 'Q技能施放',
  spell2Casts: 'W技能施放',
  spell3Casts: 'E技能施放',
  spell4Casts: 'R技能施放',
  summoner1Casts: '召唤师技能1施放',
  summoner2Casts: '召唤师技能2施放',

  // Survival Skills - 生存技巧
  deathsByEnemyChamps: '被敌方英雄击杀',
  survivedSingleDigitHpCount: '个位数生命存活',
  tookLargeDamageSurvived: '承受大量伤害存活',
  killedChampTookFullTeamDamageSurvived: '击杀后承受全队伤害存活',
  saveAllyFromDeath: '救队友于死亡',
  skillshotsDodged: '躲避技巧技能',
  skillshotsHit: '命中技巧技能',
  snowballsHit: '命中雪球',
  dodgeSkillShotsSmallWindow: '短时间内躲避技巧技能',
  landSkillShotsEarlyGame: '早期命中技巧技能',
  blastConeOppositeOpponentCount: '爆炸果实击退敌人',
  quickCleanse: '控制秒解',
  dancedWithRiftHerald: '与先锋共舞',
  fistBumpParticipation: '碰拳参与',

  // Teamfight - 团战
  flawlessAces: '完美团灭',
  doubleAces: '双重团灭',
  acesBefore15Minutes: '十五分钟前团灭敌方',
  fullTeamTakedown: '全队参与击杀',
  shortestTimeToAceFromFirstTakedown: '首杀到团灭最短时间',
  '12AssistStreakCount': '12连助攻',
  teleportTakedowns: '传送参与击杀',

  // Misc - 其他
  champLevel: '英雄等级',
  champExperience: '英雄经验',
  timePlayed: '游玩时长',
  totalTimeSpentDead: '死亡时长',
  firstBloodKill: '一血',
  firstBloodAssist: '一血助攻',
  baronKills: '大龙击杀',
  dragonKills: '小龙击杀',
  killsNearEnemyTurret: '敌方塔下击杀',
  killsUnderOwnTurret: '己方塔下击杀',
  unseenRecalls: '未被发现回城',
  effectiveHealAndShielding: '有效治疗和护盾',
  bountyGold: '赏金金币',
  laneMinionsFirst10Minutes: '前十分钟线上补刀',
  twentyMinionsIn3SecondsCount: '三秒内二十补刀',
  legendaryCount: '超神次数',
  perfectGame: '完美游戏',
  maxKillDeficit: '最大击杀劣势',
  maxLevelLeadLaneOpponent: '对线对手最大等级领先',
  completeSupportQuestInTime: '按时完成辅助任务',
  mejaisFullStackInTime: '按时满层杀人书',
  HealFromMapSources: '地图资源治疗',
  gameLength: '游戏总时长',
  playedChampSelectPosition: '选择的英雄位置',
  hadAfkTeammate: '队友挂机',
  highestChampionDamage: '最高英雄伤害',

  // Game State - 游戏状态
  gameEndedInEarlySurrender: '重开投降',
  gameEndedInSurrender: '游戏以投降结束',
  causedEarlySurrender: '导致提前投降',
  earlySurrenderAccomplice: '提前投降同谋',
  teamEarlySurrendered: '队伍提前投降'
}

/**
 * 数据分组中文翻译对象
 */
export const GROUP_TRANSLATIONS: Record<string, string> = {
  'combat-stats': '战斗数据',
  damage: '伤害数据',
  cc: '控制',
  vision: '视野',
  buildings: '建筑',
  economy: '经济',
  healing: '治疗',
  pings: '信号',
  'combat-advanced': '战斗进阶',
  objectives: '目标',
  statistics: '统计',
  abilities: '技能',
  'survival-skills': '生存技巧',
  teamfight: '团战',
  misc: '其他',
  ignored: '忽略'
}

export type RenderGroupOptions = {
  key:
    | keyof SgpParticipantLol
    | keyof Participant['stats']
    | keyof SgpParticipantLol['challenges']
    | (string & {})

  /** 是否忽略这个字段 */
  hide?: boolean

  /** 各自渲染方式：数字、文本、自定义 */
  render?:
    | 'float'
    | 'integer'
    | 'text'
    | 'k2'
    | 'boolean'
    | 'game-time'
    | 'percentage'
    | 'auto'
    | ((value: any) => VNodeChild)
}

export type RenderGroup = {
  group: string
  items: RenderGroupOptions[]
}

export const RENDER_GROUPS: RenderGroup[] = [
  {
    group: 'combat-stats',
    items: [
      { key: 'kills', render: 'integer' }, // lcu + sgp
      { key: 'deaths', render: 'integer' }, // lcu + sgp
      { key: 'assists', render: 'integer' }, // lcu + sgp
      { key: 'doubleKills', render: 'integer' }, // lcu + sgp
      { key: 'tripleKills', render: 'integer' }, // lcu + sgp
      { key: 'quadraKills', render: 'integer' }, // lcu + sgp
      { key: 'pentaKills', render: 'integer' }, // lcu + sgp
      { key: 'unrealKills', render: 'integer' }, // lcu + sgp
      { key: 'killingSprees', render: 'integer' }, // lcu + sgp
      { key: 'largestKillingSpree', render: 'integer' }, // lcu + sgp
      { key: 'largestMultiKill', render: 'integer' }, // lcu + sgp
      { key: 'longestTimeSpentLiving', render: 'integer' }, // lcu + sgp
      { key: 'largestCriticalStrike', render: 'integer' } // lcu + sgp
    ]
  },
  {
    group: 'damage',
    items: [
      // Damage to Champions
      { key: 'totalDamageDealtToChampions', render: 'k2' }, // lcu + sgp
      { key: 'physicalDamageDealtToChampions', render: 'k2' }, // lcu + sgp
      { key: 'magicDamageDealtToChampions', render: 'k2' }, // lcu + sgp
      { key: 'trueDamageDealtToChampions', render: 'k2' }, // lcu + sgp
      // Total Damage Dealt
      { key: 'totalDamageDealt', render: 'k2' }, // lcu + sgp
      { key: 'physicalDamageDealt', render: 'k2' }, // lcu + sgp
      { key: 'magicDamageDealt', render: 'k2' }, // lcu + sgp
      { key: 'trueDamageDealt', render: 'k2' }, // lcu + sgp
      // Damage to Structures
      { key: 'damageDealtToObjectives', render: 'k2' }, // lcu + sgp
      { key: 'damageDealtToTurrets', render: 'k2' }, // lcu + sgp
      { key: 'damageDealtToBuildings', render: 'k2' }, // sgp only
      { key: 'damageDealtToEpicMonsters', render: 'k2' }, // sgp only
      // Damage Taken
      { key: 'totalDamageTaken', render: 'k2' }, // lcu + sgp
      { key: 'physicalDamageTaken', render: 'k2' }, // lcu + sgp
      { key: 'magicDamageTaken', render: 'k2' }, // sgp only
      { key: 'magicalDamageTaken', render: 'k2' }, // lcu only
      { key: 'trueDamageTaken', render: 'k2' }, // lcu + sgp
      { key: 'damageSelfMitigated', render: 'k2' }, // lcu + sgp
      // Damage Related (Support/Shield)
      { key: 'totalDamageShieldedOnTeammates', render: 'k2' } // sgp only
    ]
  },
  {
    group: 'cc',
    items: [
      { key: 'timeCCingOthers', render: 'integer' }, // lcu + sgp
      { key: 'totalTimeCCDealt', render: 'integer' }, // sgp only
      { key: 'totalTimeCrowdControlDealt', render: 'integer' }, // lcu only (renamed from totalTimeCCDealt)
      { key: 'enemyChampionImmobilizations', render: 'integer' }, // sgp challenges
      { key: 'immobilizeAndKillWithAlly', render: 'integer' }, // sgp challenges
      { key: 'knockEnemyIntoTeamAndKill', render: 'integer' }, // sgp challenges
      { key: 'survivedThreeImmobilizesInFight', render: 'integer' }, // sgp challenges
      { key: 'highestCrowdControlScore', render: 'integer' } // sgp challenges
    ]
  },
  {
    group: 'vision',
    items: [
      { key: 'visionScore', render: 'integer' }, // lcu + sgp
      { key: 'wardsPlaced', render: 'integer' }, // lcu + sgp
      { key: 'wardsKilled', render: 'integer' }, // lcu + sgp
      { key: 'sightWardsBoughtInGame', render: 'integer' }, // lcu + sgp
      { key: 'visionWardsBoughtInGame', render: 'integer' }, // lcu + sgp
      { key: 'detectorWardsPlaced', render: 'integer' }, // sgp only
      { key: 'visionScorePerMinute', render: 'integer' }, // sgp challenges
      { key: 'wardTakedowns', render: 'integer' }, // sgp challenges
      { key: 'wardTakedownsBefore20M', render: 'integer' }, // sgp challenges
      { key: 'wardsGuarded', render: 'integer' }, // sgp challenges
      { key: 'twoWardsOneSweeperCount', render: 'integer' }, // sgp challenges
      { key: 'controlWardsPlaced', render: 'integer' }, // sgp challenges
      { key: 'stealthWardsPlaced', render: 'integer' }, // sgp challenges
      { key: 'visionScoreAdvantageLaneOpponent', render: 'float' } // sgp challenges
    ]
  },
  {
    group: 'buildings',
    items: [
      // Turrets
      { key: 'turretKills', render: 'integer' }, // lcu + sgp
      { key: 'turretTakedowns', render: 'integer' }, // sgp only
      { key: 'soloTurretsLategame', render: 'integer' }, // sgp challenges
      { key: 'turretsLost', render: 'integer' }, // sgp only
      { key: 'firstTowerKill', render: 'boolean' }, // lcu + sgp
      { key: 'firstTowerAssist', render: 'boolean' }, // lcu + sgp
      { key: 'firstTurretKilled', render: 'integer' }, // sgp challenges
      { key: 'firstTurretKilledTime', render: 'game-time' }, // sgp challenges
      { key: 'turretPlatesTaken', render: 'integer' }, // sgp challenges
      { key: 'kTurretsDestroyedBeforePlatesFall', render: 'integer' }, // sgp challenges
      { key: 'outerTurretExecutesBefore10Minutes', render: 'integer' }, // sgp challenges
      { key: 'quickFirstTurret', render: 'integer' }, // sgp challenges
      { key: 'takedownOnFirstTurret', render: 'integer' }, // sgp challenges
      { key: 'turretsTakenWithRiftHerald', render: 'integer' }, // sgp challenges
      { key: 'multiTurretRiftHeraldCount', render: 'integer' }, // sgp challenges
      // Inhibitors
      { key: 'inhibitorKills', render: 'integer' }, // lcu + sgp
      { key: 'inhibitorTakedowns', render: 'integer' }, // sgp only
      { key: 'inhibitorsLost', render: 'integer' }, // sgp only
      { key: 'firstInhibitorKill', render: 'boolean' }, // lcu only
      { key: 'firstInhibitorAssist', render: 'boolean' }, // lcu only
      { key: 'lostAnInhibitor', render: 'integer' }, // sgp challenges
      // Nexus
      { key: 'nexusKills', render: 'integer' }, // sgp only
      { key: 'nexusLost', render: 'integer' }, // sgp only
      { key: 'nexusTakedowns', render: 'integer' }, // sgp only
      { key: 'hadOpenNexus', render: 'boolean' }, // sgp challenges
      { key: 'outnumberedNexusKill', render: 'integer' }, // sgp challenges
      // Objectives
      { key: 'objectivesStolen', render: 'integer' }, // sgp only
      { key: 'objectivesStolenAssists', render: 'integer' } // sgp only
    ]
  },
  {
    group: 'economy',
    items: [
      { key: 'goldEarned', render: 'k2' }, // lcu + sgp
      { key: 'goldSpent', render: 'k2' }, // lcu + sgp
      { key: 'totalMinionsKilled', render: 'integer' }, // lcu + sgp
      { key: 'neutralMinionsKilled', render: 'integer' }, // lcu + sgp
      { key: 'neutralMinionsKilledEnemyJungle', render: 'integer' }, // lcu only
      { key: 'neutralMinionsKilledTeamJungle', render: 'integer' }, // lcu only
      { key: 'totalAllyJungleMinionsKilled', render: 'integer' }, // sgp only
      { key: 'totalEnemyJungleMinionsKilled', render: 'integer' }, // sgp only
      { key: 'consumablesPurchased', render: 'integer' }, // sgp only
      { key: 'itemsPurchased', render: 'integer' }, // sgp only
      { key: 'earlyLaningPhaseGoldExpAdvantage', render: 'integer' }, // sgp challenges
      { key: 'laningPhaseGoldExpAdvantage', render: 'integer' }, // sgp challenges
      { key: 'maxCsAdvantageOnLaneOpponent', render: 'integer' } // sgp challenges
    ]
  },
  {
    group: 'healing',
    items: [
      { key: 'totalHeal', render: 'k2' }, // lcu + sgp
      { key: 'totalUnitsHealed', render: 'integer' }, // lcu + sgp
      { key: 'totalHealsOnTeammates', render: 'k2' } // sgp only
    ]
  },
  {
    group: 'pings',
    items: [
      { key: 'allInPings', render: 'integer' }, // sgp only
      { key: 'assistMePings', render: 'integer' }, // sgp only
      { key: 'basicPings', render: 'integer' }, // sgp only
      { key: 'commandPings', render: 'integer' }, // sgp only
      { key: 'dangerPings', render: 'integer' }, // sgp only
      { key: 'enemyMissingPings', render: 'integer' }, // sgp only
      { key: 'enemyVisionPings', render: 'integer' }, // sgp only
      { key: 'getBackPings', render: 'integer' }, // sgp only
      { key: 'holdPings', render: 'integer' }, // sgp only
      { key: 'needVisionPings', render: 'integer' }, // sgp only
      { key: 'onMyWayPings', render: 'integer' }, // sgp only
      { key: 'pushPings', render: 'integer' }, // sgp only
      { key: 'retreatPings', render: 'integer' }, // sgp only
      { key: 'visionClearedPings', render: 'integer' } // sgp only
    ]
  },
  {
    group: 'combat-advanced',
    items: [
      { key: 'soloKills', render: 'integer' }, // sgp challenges
      { key: 'quickSoloKills', render: 'integer' }, // sgp challenges
      { key: 'takedowns', render: 'integer' }, // sgp challenges
      { key: 'outnumberedKills', render: 'integer' }, // sgp challenges
      { key: 'multikills', render: 'integer' }, // sgp challenges
      { key: 'multikillsAfterAggressiveFlash', render: 'integer' }, // sgp challenges
      { key: 'multiKillOneSpell', render: 'integer' }, // sgp challenges
      { key: 'killAfterHiddenWithAlly', render: 'integer' }, // sgp challenges
      { key: 'pickKillWithAlly', render: 'integer' }, // sgp challenges
      { key: 'killsWithHelpFromEpicMonster', render: 'integer' }, // sgp challenges
      { key: 'takedownsBeforeJungleMinionSpawn', render: 'integer' }, // sgp challenges
      { key: 'takedownsFirstXMinutes', render: 'integer' }, // sgp challenges
      { key: 'takedownsAfterGainingLevelAdvantage', render: 'integer' }, // sgp challenges
      { key: 'takedownsInAlcove', render: 'integer' }, // sgp challenges
      { key: 'takedownsInEnemyFountain', render: 'integer' }, // sgp challenges
      { key: 'killsOnOtherLanesEarlyJungleAsLaner', render: 'integer' }, // sgp challenges
      { key: 'getTakedownsInAllLanesEarlyJungleAsLaner', render: 'integer' }, // sgp challenges
      { key: 'killsOnRecentlyHealedByAramPack', render: 'integer' } // sgp challenges
    ]
  },
  {
    group: 'objectives',
    items: [
      // Epic Monsters
      { key: 'baronTakedowns', render: 'integer' }, // sgp challenges
      { key: 'baronBuffGoldAdvantageOverThreshold', render: 'integer' }, // sgp challenges
      { key: 'earliestBaron', render: 'game-time' }, // sgp challenges
      { key: 'dragonTakedowns', render: 'integer' }, // sgp challenges
      { key: 'riftHeraldTakedowns', render: 'integer' }, // sgp challenges
      { key: 'teamBaronKills', render: 'integer' }, // sgp challenges
      { key: 'teamElderDragonKills', render: 'integer' }, // sgp challenges
      { key: 'teamRiftHeraldKills', render: 'integer' }, // sgp challenges
      { key: 'soloBaronKills', render: 'integer' }, // sgp challenges
      { key: 'elderDragonKillsWithOpposingSoul', render: 'integer' }, // sgp challenges
      { key: 'elderDragonMultikills', render: 'integer' }, // sgp challenges
      { key: 'perfectDragonSoulsTaken', render: 'integer' }, // sgp challenges
      { key: 'epicMonsterSteals', render: 'integer' }, // sgp challenges
      { key: 'epicMonsterStolenWithoutSmite', render: 'integer' }, // sgp challenges
      { key: 'epicMonsterKillsNearEnemyJungler', render: 'integer' }, // sgp challenges
      { key: 'epicMonsterKillsWithin30SecondsOfSpawn', render: 'integer' }, // sgp challenges
      { key: 'junglerTakedownsNearDamagedEpicMonster', render: 'integer' }, // sgp challenges
      { key: 'voidMonsterKill', render: 'integer' }, // sgp challenges
      // Jungle
      { key: 'alliedJungleMonsterKills', render: 'integer' }, // sgp challenges
      { key: 'enemyJungleMonsterKills', render: 'integer' }, // sgp challenges
      { key: 'scuttleCrabKills', render: 'integer' }, // sgp challenges
      { key: 'buffsStolen', render: 'integer' }, // sgp challenges
      { key: 'jungleCsBefore10Minutes', render: 'integer' }, // sgp challenges
      { key: 'initialBuffCount', render: 'integer' }, // sgp challenges
      { key: 'initialCrabCount', render: 'integer' }, // sgp challenges
      { key: 'moreEnemyJungleThanOpponent', render: 'integer' } // sgp challenges
    ]
  },
  {
    group: 'statistics',
    items: [
      { key: 'kda', render: 'float' }, // sgp challenges
      { key: 'killParticipation', render: 'percentage' }, // sgp challenges
      { key: 'damagePerMinute', render: 'k2' }, // sgp challenges
      { key: 'goldPerMinute', render: 'k2' }, // sgp challenges
      { key: 'damageTakenOnTeamPercentage', render: 'integer' }, // sgp challenges
      { key: 'teamDamagePercentage', render: 'integer' } // sgp challenges
    ]
  },
  {
    group: 'abilities',
    items: [
      { key: 'abilityUses', render: 'integer' }, // sgp challenges
      { key: 'spell1Casts', render: 'integer' }, // sgp only
      { key: 'spell2Casts', render: 'integer' }, // sgp only
      { key: 'spell3Casts', render: 'integer' }, // sgp only
      { key: 'spell4Casts', render: 'integer' }, // sgp only
      { key: 'summoner1Casts', render: 'integer' }, // sgp only
      { key: 'summoner2Casts', render: 'integer' } // sgp only
    ]
  },
  {
    group: 'survival-skills',
    items: [
      // Survival
      { key: 'deathsByEnemyChamps', render: 'integer' }, // sgp challenges
      { key: 'survivedSingleDigitHpCount', render: 'integer' }, // sgp challenges
      { key: 'tookLargeDamageSurvived', render: 'integer' }, // sgp challenges
      { key: 'killedChampTookFullTeamDamageSurvived', render: 'integer' }, // sgp challenges
      { key: 'saveAllyFromDeath', render: 'integer' }, // sgp challenges
      // Skills
      { key: 'skillshotsDodged', render: 'integer' }, // sgp challenges
      { key: 'skillshotsHit', render: 'integer' }, // sgp challenges
      { key: 'snowballsHit', render: 'integer' }, // sgp challenges
      { key: 'dodgeSkillShotsSmallWindow', render: 'integer' }, // sgp challenges
      { key: 'landSkillShotsEarlyGame', render: 'integer' }, // sgp challenges
      { key: 'blastConeOppositeOpponentCount', render: 'integer' }, // sgp challenges
      { key: 'quickCleanse', render: 'integer' }, // sgp challenges
      { key: 'dancedWithRiftHerald', render: 'integer' }, // sgp challenges
      { key: 'fistBumpParticipation', render: 'integer' } // sgp challenges
    ]
  },
  {
    group: 'teamfight',
    items: [
      { key: 'flawlessAces', render: 'integer' }, // sgp challenges
      { key: 'doubleAces', render: 'integer' }, // sgp challenges
      { key: 'acesBefore15Minutes', render: 'integer' }, // sgp challenges
      { key: 'fullTeamTakedown', render: 'integer' }, // sgp challenges
      { key: 'shortestTimeToAceFromFirstTakedown', render: 'integer' }, // sgp challenges
      { key: '12AssistStreakCount', render: 'integer' }, // sgp challenges
      { key: 'teleportTakedowns', render: 'integer' } // sgp challenges
    ]
  },
  {
    group: 'game-state',
    items: [
      { key: 'gameEndedInEarlySurrender', render: 'boolean' },
      { key: 'gameEndedInSurrender', render: 'boolean' },
      { key: 'causedEarlySurrender', render: 'boolean', hide: true }, // 疑似已经弃用
      { key: 'earlySurrenderAccomplice', render: 'boolean', hide: true }, // 疑似已经弃用
      { key: 'teamEarlySurrendered', render: 'boolean' }
    ]
  },
  {
    group: 'misc',
    items: [
      { key: 'champLevel', render: 'integer' }, // lcu + sgp
      { key: 'champExperience', render: 'k2' }, // sgp only
      { key: 'timePlayed', render: 'integer' }, // sgp only
      { key: 'totalTimeSpentDead', render: 'integer' }, // sgp only
      { key: 'firstBloodKill', render: 'boolean' }, // lcu + sgp
      { key: 'firstBloodAssist', render: 'boolean' }, // lcu + sgp
      { key: 'baronKills', render: 'integer' }, // lcu + sgp
      { key: 'dragonKills', render: 'integer' }, // sgp only
      { key: 'killsNearEnemyTurret', render: 'integer' }, // sgp challenges
      { key: 'killsUnderOwnTurret', render: 'integer' }, // sgp challenges
      { key: 'unseenRecalls', render: 'integer' }, // sgp challenges
      { key: 'effectiveHealAndShielding', render: 'k2' }, // sgp challenges
      { key: 'bountyGold', render: 'integer' }, // sgp challenges
      { key: 'laneMinionsFirst10Minutes', render: 'integer' }, // sgp challenges
      { key: 'twentyMinionsIn3SecondsCount', render: 'integer' }, // sgp challenges
      { key: 'legendaryCount', render: 'integer' }, // sgp challenges
      { key: 'perfectGame', render: 'integer' }, // sgp challenges
      { key: 'maxKillDeficit', render: 'integer' }, // sgp challenges
      { key: 'maxLevelLeadLaneOpponent', render: 'integer' }, // sgp challenges
      { key: 'completeSupportQuestInTime', render: 'integer' }, // sgp challenges
      { key: 'mejaisFullStackInTime', render: 'integer' }, // sgp challenges
      { key: 'HealFromMapSources', render: 'k2' }, // sgp challenges
      { key: 'gameLength', render: 'game-time' }, // sgp challenges
      { key: 'hadAfkTeammate', render: 'boolean' }, // sgp challenges
      { key: 'highestChampionDamage', render: 'boolean' }, // sgp challenges
      { key: 'playedChampSelectPosition', render: 'integer', hide: true } // sgp challenges (metadata)
    ]
  },
  {
    group: 'ignored',
    items: [
      // @ts-ignore
      { key: 'identity', hide: true }, // 虚拟字段，用于分组
      // Metadata / Identifiers
      { key: 'championId', hide: true },
      { key: 'championName', hide: true },
      { key: 'championTransform', hide: true },
      { key: 'participantId', hide: true },
      { key: 'teamId', hide: true },
      { key: 'puuid', hide: true },
      { key: 'summonerId', hide: true },
      { key: 'summonerName', hide: true },
      { key: 'summonerLevel', hide: true },
      { key: 'profileIcon', hide: true },
      { key: 'riotIdGameName', hide: true },
      { key: 'riotIdTagline', hide: true },
      { key: 'lane', hide: true },
      { key: 'role', hide: true },
      { key: 'teamPosition', hide: true },
      { key: 'individualPosition', hide: true },
      { key: 'placement', hide: true },
      { key: 'subteamPlacement', hide: true },
      { key: 'playerSubteamId', hide: true },
      // Items
      { key: 'item0', hide: true },
      { key: 'item1', hide: true },
      { key: 'item2', hide: true },
      { key: 'item3', hide: true },
      { key: 'item4', hide: true },
      { key: 'item5', hide: true },
      { key: 'item6', hide: true },
      // Augments
      { key: 'playerAugment1', hide: true },
      { key: 'playerAugment2', hide: true },
      { key: 'playerAugment3', hide: true },
      { key: 'playerAugment4', hide: true },
      { key: 'playerAugment5', hide: true },
      { key: 'playerAugment6', hide: true },
      // Runes
      { key: 'perks', hide: true }, // sgp only
      { key: 'perk0', hide: true },
      { key: 'perk0Var1', hide: true },
      { key: 'perk0Var2', hide: true },
      { key: 'perk0Var3', hide: true },
      { key: 'perk1', hide: true },
      { key: 'perk1Var1', hide: true },
      { key: 'perk1Var2', hide: true },
      { key: 'perk1Var3', hide: true },
      { key: 'perk2', hide: true },
      { key: 'perk2Var1', hide: true },
      { key: 'perk2Var2', hide: true },
      { key: 'perk2Var3', hide: true },
      { key: 'perk3', hide: true },
      { key: 'perk3Var1', hide: true },
      { key: 'perk3Var2', hide: true },
      { key: 'perk3Var3', hide: true },
      { key: 'perk4', hide: true },
      { key: 'perk4Var1', hide: true },
      { key: 'perk4Var2', hide: true },
      { key: 'perk4Var3', hide: true },
      { key: 'perk5', hide: true },
      { key: 'perk5Var1', hide: true },
      { key: 'perk5Var2', hide: true },
      { key: 'perk5Var3', hide: true },
      { key: 'perkPrimaryStyle', hide: true },
      { key: 'perkSubStyle', hide: true },
      // Score Fields
      { key: 'PlayerScore0', hide: true },
      { key: 'PlayerScore1', hide: true },
      { key: 'PlayerScore2', hide: true },
      { key: 'PlayerScore3', hide: true },
      { key: 'PlayerScore4', hide: true },
      { key: 'PlayerScore5', hide: true },
      { key: 'PlayerScore6', hide: true },
      { key: 'PlayerScore7', hide: true },
      { key: 'PlayerScore8', hide: true },
      { key: 'PlayerScore9', hide: true },
      { key: 'PlayerScore10', hide: true },
      { key: 'PlayerScore11', hide: true },
      { key: 'playerScore0', hide: true },
      { key: 'playerScore1', hide: true },
      { key: 'playerScore2', hide: true },
      { key: 'playerScore3', hide: true },
      { key: 'playerScore4', hide: true },
      { key: 'playerScore5', hide: true },
      { key: 'playerScore6', hide: true },
      { key: 'playerScore7', hide: true },
      { key: 'playerScore8', hide: true },
      { key: 'playerScore9', hide: true },
      { key: 'combatPlayerScore', hide: true },
      { key: 'objectivePlayerScore', hide: true },
      { key: 'totalPlayerScore', hide: true },
      { key: 'totalScoreRank', hide: true },
      // Game State
      { key: 'win', hide: true },
      { key: 'eligibleForProgression', hide: true },
      // Special Game Modes
      { key: 'InfernalScalePickup', hide: true },
      { key: 'SWARM_DefeatAatrox', hide: true },
      { key: 'SWARM_DefeatBriar', hide: true },
      { key: 'SWARM_DefeatMiniBosses', hide: true },
      { key: 'SWARM_EvolveWeapon', hide: true },
      { key: 'SWARM_Have3Passives', hide: true },
      { key: 'SWARM_KillEnemy', hide: true },
      { key: 'SWARM_PickupGold', hide: true },
      { key: 'SWARM_ReachLevel50', hide: true },
      { key: 'SWARM_Survive15Min', hide: true },
      { key: 'SWARM_WinWith5EvolvedWeapons', hide: true },
      { key: 'poroExplosions', hide: true },
      // Summoner Spell IDs
      { key: 'spell1Id', hide: true },
      { key: 'spell2Id', hide: true },
      { key: 'legendaryItemUsed', hide: true } // sgp challenges (array)
    ]
  }
]

export const MAPPED_RENDER_GROUP_OPTIONS = RENDER_GROUPS.reduce(
  (acc, group) => {
    group.items.forEach((item: RenderGroupOptions) => {
      acc[item.key] = {
        key: item.key,
        render: item.render,
        hide: item.hide,
        group: group.group
      }
    })
    return acc
  },
  {} as Record<string, RenderGroupOptions & { group: string }>
)

/**
 * 这个部分需要额外提供原始数据，以便渲染完整版本
 */
export function useRawDetails() {
  const { summary } = useMatchCard()

  return computed(() => {
    const { source, data } = toValue(summary)

    if (source === 'sgp') {
      const isCherryMode = data.json.gameMode === 'CHERRY'

      return data.json.participants
        .toSorted((a, b) => {
          if (isCherryMode) {
            return a.subteamPlacement - b.subteamPlacement
          }

          return a.teamId - b.teamId
        })
        .map((p) => {
          const { challenges, missions, ...rest } = p

          return {
            ...rest,
            ...challenges,
            championId: p.championId,
            identity: {
              puuid: p.puuid,
              gameName: p.riotIdGameName,
              tagLine: p.riotIdTagline,
              teamIdentifier: isCherryMode ? `CHERRY-${p.playerSubteamId}` : `TEAM-${p.teamId}`
            }
          }
        })
    }

    const isCherryMode = data.gameMode === 'CHERRY'

    return data.participants
      .map((p) => {
        const identity = data.participantIdentities.find((i) => i.participantId === p.participantId)
        if (!identity) return null

        return {
          ...p.stats,
          championId: p.championId,
          identity: {
            puuid: identity.player.puuid,
            gameName: identity.player.gameName,
            tagLine: identity.player.tagLine,
            teamIdentifier: isCherryMode ? `CHERRY-${p.teamId}` : `TEAM-${p.teamId}`
          }
        }
      })
      .filter((p) => p !== null)
  })
}

export function useValueRenderer() {
  return {
    float: (value: number) => {
      if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
        return <span class="dark:text-white/50 text-black/50">N/A</span>
      }

      if (value === 0) {
        return <span class="dark:text-white/50 text-black/50">0</span>
      }

      return <span title={value.toFixed(2)}>{value.toFixed(2)}</span>
    },
    integer: (value: number) => {
      if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
        return <span class="dark:text-white/50 text-black/50">N/A</span>
      }

      if (value === 0) {
        return <span class="dark:text-white/50 text-black/50">0</span>
      }

      return <span title={value.toString()}>{Math.floor(value).toLocaleString()}</span>
    },
    text: (value: string | number) => {
      if (value === null || value === undefined || value === '') {
        return <span class="dark:text-white/50 text-black/50">N/A</span>
      }
      return value.toString()
    },
    k2: (value: number) => {
      if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
        return <span class="dark:text-white/50 text-black/50">N/A</span>
      }

      if (value === 0) {
        return <span class="dark:text-white/50 text-black/50">0</span>
      }

      return (
        <span title={value.toString()}>
          {`${(value / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 })} k`}
        </span>
      )
    },
    'game-time': (value: number) => {
      if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
        return <span class="dark:text-white/50 text-black/50">N/A</span>
      }

      if (value === 0) {
        return <span class="dark:text-white/50 text-black/50">0</span>
      }

      return <span title={value.toString()}>{formatSeconds(value)}</span>
    },
    boolean: (value: boolean) => {
      if (
        value === null ||
        value === undefined ||
        (typeof value !== 'boolean' && typeof value !== 'number')
      ) {
        return <span class="dark:text-white/50 text-black/50">N/A</span>
      }
      return value ? '是' : '否'
    },
    percentage: (value: number) => {
      if (value === null || value === undefined || typeof value !== 'number' || isNaN(value)) {
        return <span class="dark:text-white/50 text-black/50">N/A</span>
      }
      return <span title={`${value * 100}%`}>{`${(value * 100).toFixed(2)}%`}</span>
    },
    auto: (value: any) => {
      if (value === null || value === undefined || isNaN(value)) {
        return <span class="dark:text-white/50 text-black/50">N/A</span>
      }

      if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          return <span title={value.toString()}>{value}</span>
        } else {
          return <span title={value.toFixed(2)}>{value.toFixed(2)}</span>
        }
      }

      if (typeof value === 'string') {
        return <span title={value}>{value}</span>
      }

      return <span class="dark:text-white/50 text-black/50">N/A?</span>
    }
  }
}
