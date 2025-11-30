export interface MatchHistory {
  accountId: number
  games: Games
  platformId: string
}

export interface Games {
  gameBeginDate: string
  gameCount: number
  gameEndDate: string
  gameIndexBegin: number
  gameIndexEnd: number
  games: Game[]
}

export interface Game {
  endOfGameResult: string
  gameCreation: number
  gameCreationDate: string
  gameDuration: number
  gameId: number
  gameMode: string
  gameType: string
  gameVersion: string
  mapId: number
  participantIdentities: ParticipantIdentity[]
  participants: Participant[]
  platformId: string
  queueId: number
  seasonId: number
  teams: Team[]
  gameModeMutators: string[]
}

export interface Team {
  bans: {
    championId: number
    pickTurn: number
  }[]
  baronKills: number
  dominionVictoryScore: number
  dragonKills: number
  hordeKills: number
  firstBaron: boolean
  firstBlood: boolean
  firstDargon: boolean // LCU 接口中就是如此拼写，不知道是不是笔误
  firstInhibitor: boolean
  firstTower: boolean
  inhibitorKills: number
  riftHeraldKills: number
  teamId: number
  towerKills: number
  vilemawKills: number
  win: string | 'Win' | 'Fail'
}

export interface Participant {
  championId: number
  highestAchievedSeasonTier: string
  participantId: number
  spell1Id: number
  spell2Id: number
  stats: Stats
  teamId: number
  timeline: Timeline
}

export interface Timeline {
  creepsPerMinDeltas: CreepsPerMinDeltas
  csDiffPerMinDeltas: CsDiffPerMinDeltas
  damageTakenDiffPerMinDeltas: CsDiffPerMinDeltas
  damageTakenPerMinDeltas: CreepsPerMinDeltas
  goldPerMinDeltas: CreepsPerMinDeltas
  lane: string
  participantId: number
  role: string
  xpDiffPerMinDeltas: CsDiffPerMinDeltas
  xpPerMinDeltas: CreepsPerMinDeltas
}

export interface CsDiffPerMinDeltas {
  [key: string]: number
}

export interface CreepsPerMinDeltas {
  [key: string]: number
}

export interface Stats {
  assists: number
  causedEarlySurrender: boolean
  champLevel: number
  combatPlayerScore: number
  damageDealtToObjectives: number
  damageDealtToTurrets: number
  damageSelfMitigated: number
  deaths: number
  doubleKills: number
  earlySurrenderAccomplice: boolean
  firstBloodAssist: boolean
  firstBloodKill: boolean
  firstInhibitorAssist: boolean
  firstInhibitorKill: boolean
  firstTowerAssist: boolean
  firstTowerKill: boolean
  gameEndedInEarlySurrender: boolean
  gameEndedInSurrender: boolean
  goldEarned: number
  goldSpent: number
  inhibitorKills: number
  item0: number
  item1: number
  item2: number
  item3: number
  item4: number
  item5: number
  item6: number
  killingSprees: number
  kills: number
  largestCriticalStrike: number
  largestKillingSpree: number
  largestMultiKill: number
  longestTimeSpentLiving: number
  magicDamageDealt: number
  magicDamageDealtToChampions: number
  magicalDamageTaken: number
  neutralMinionsKilled: number
  neutralMinionsKilledEnemyJungle: number
  neutralMinionsKilledTeamJungle: number
  objectivePlayerScore: number
  participantId: number
  pentaKills: number
  perk0: number
  perk0Var1: number
  perk0Var2: number
  perk0Var3: number
  perk1: number
  perk1Var1: number
  perk1Var2: number
  perk1Var3: number
  perk2: number
  perk2Var1: number
  perk2Var2: number
  perk2Var3: number
  perk3: number
  perk3Var1: number
  perk3Var2: number
  perk3Var3: number
  perk4: number
  perk4Var1: number
  perk4Var2: number
  perk4Var3: number
  perk5: number
  perk5Var1: number
  perk5Var2: number
  perk5Var3: number
  perkPrimaryStyle: number
  perkSubStyle: number
  physicalDamageDealt: number
  physicalDamageDealtToChampions: number
  physicalDamageTaken: number
  playerAugment1: number
  playerAugment2: number
  playerAugment3: number
  playerAugment4: number
  playerAugment5: number
  playerAugment6: number
  playerScore0: number
  playerScore1: number
  playerScore2: number
  playerScore3: number
  playerScore4: number
  playerScore5: number
  playerScore6: number
  playerScore7: number
  playerScore8: number
  playerScore9: number
  playerSubteamId: number
  quadraKills: number
  sightWardsBoughtInGame: number
  subteamPlacement: number
  teamEarlySurrendered: boolean
  timeCCingOthers: number
  totalDamageDealt: number
  totalDamageDealtToChampions: number
  totalDamageTaken: number
  totalHeal: number
  totalMinionsKilled: number
  totalPlayerScore: number
  totalScoreRank: number
  totalTimeCrowdControlDealt: number
  totalUnitsHealed: number
  tripleKills: number
  trueDamageDealt: number
  trueDamageDealtToChampions: number
  trueDamageTaken: number
  turretKills: number
  unrealKills: number
  visionScore: number
  visionWardsBoughtInGame: number
  wardsKilled: number
  wardsPlaced: number
  win: boolean
}

export interface ParticipantIdentity {
  participantId: number
  player: Player
}

export interface Player {
  accountId: number
  currentAccountId: number
  currentPlatformId: string
  matchHistoryUri: string
  platformId: string
  profileIcon: number
  summonerId: number
  puuid: string
  gameName: string
  tagLine: string
  summonerName: string
}

// 为什么会有这么多的队列呢？
// 补：现在应该可以通过判断是不是 kPvP
const pveQueues = new Set([
  // 人机模式和新手教程
  31, 32, 33, 34, 35, 36, 52, 800, 801, 810, 820, 830, 831, 832, 840, 841, 842, 850, 851, 852, 860,
  870, 880, 890, 2000, 2010, 2020,

  // 大提莫节，应该是新版的末日人机
  90, 91, 92, 950, 951, 960, 961,

  // 怪兽入侵模式，没打过不知道是不是
  981, 982, 990,

  // 奥德赛系列
  1030, 1031, 1032, 1040, 1041, 1050, 1051, 1060, 1061, 1070, 1071,

  // STRAWBERRY 模式
  1800, 1810, 1820, 1830, 1840, 1850, 1860, 1870, 1880, 1890
])

export function isPveQueue(queueId: number) {
  if (typeof queueId === 'string') {
    return pveQueues.has(Number(queueId))
  }

  return pveQueues.has(queueId)
}

export interface Position {
  x: number
  y: number
}

export type GameEventType = 'CHAMPION_KILL' | 'BUILDING_KILL'

export interface BaseGameEvent {
  type: GameEventType
  timestamp: number
  position: Position
}

export interface ChampionKillEvent extends BaseGameEvent {
  type: 'CHAMPION_KILL'
  participantId: number
  killerId: number
  victimId: number
  assistingParticipantIds: number[]
  skillSlot: number
  teamId: number
  itemId: number
  buildingType: string
  towerType: string
  laneType: string
  monsterType: string
  monsterSubType: string
}

export interface BuildingKillEvent extends BaseGameEvent {
  type: 'BUILDING_KILL'
  participantId: number
  killerId: number
  victimId: number
  assistingParticipantIds: number[]
  buildingType: string
  towerType: string
  laneType: string
  teamId: number
  skillSlot: number
  itemId: number
  monsterType: string
  monsterSubType: string
}

export type GameEvent = ChampionKillEvent | BuildingKillEvent

export interface ParticipantFrame {
  participantId: number
  currentGold: number
  totalGold: number
  level: number
  xp: number
  minionsKilled: number
  jungleMinionsKilled: number
  dominionScore: number
  teamScore: number
  position: Position
}

export type ParticipantFrames = Record<string, ParticipantFrame>

export interface TimelineFrame {
  timestamp: number
  events: GameEvent[]
  participantFrames: ParticipantFrames
}

export interface GameTimeline {
  frames: TimelineFrame[]
}
