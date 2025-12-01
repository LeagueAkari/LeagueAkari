// LOL Match History Types

export interface SgpMatchHistoryLol {
  games: SgpGameSummaryLol[]
}

export interface SgpGameSummaryLol {
  metadata: SgpGameMetadataLol
  json: SgpGameSummaryJsonLol
}

export interface SgpGameSummaryJsonLol {
  endOfGameResult: string
  gameCreation: number
  gameDuration: number
  gameEndTimestamp: number
  gameModeMutators: string[]
  gameId: number
  gameMode: string
  gameName: string
  gameStartTimestamp: number
  gameType: string
  gameVersion: string
  mapId: number
  participants: SgpParticipantLol[]
  platformId: string
  queueId: number
  seasonId: number
  teams: Team[]
  tournamentCode: string
}

export interface Team {
  bans: Ban[]
  objectives: Objectives
  teamId: number
  win: boolean
}

export interface Objectives {
  baron: Baron
  champion: Baron
  dragon: Baron
  horde: Baron
  inhibitor: Baron
  riftHerald: Baron
  tower: Baron
  atakhan: Baron
}

interface Baron {
  first: boolean
  kills: number
}

export interface Ban {
  championId: number
  pickTurn: number
}

export interface SgpParticipantLol {
  PlayerScore0: number
  PlayerScore1: number
  PlayerScore2: number
  PlayerScore3: number
  PlayerScore4: number
  PlayerScore5: number
  PlayerScore6: number
  PlayerScore7: number
  PlayerScore8: number
  PlayerScore9: number
  PlayerScore10: number
  PlayerScore11: number

  // Ping 数据
  allInPings: number
  assistMePings: number
  basicPings: number
  commandPings: number
  dangerPings: number
  enemyMissingPings: number
  enemyVisionPings: number
  getBackPings: number
  holdPings: number
  needVisionPings: number
  onMyWayPings: number
  pushPings: number
  retreatPings: number
  visionClearedPings: number

  // 基础统计
  assists: number
  baronKills: number
  champExperience: number
  champLevel: number
  championId: number
  championName: string
  championTransform: number
  consumablesPurchased: number
  deaths: number
  detectorWardsPlaced: number
  doubleKills: number
  dragonKills: number
  eligibleForProgression: boolean

  // 布尔值字段
  firstBloodAssist: boolean
  firstBloodKill: boolean
  firstTowerAssist: boolean
  firstTowerKill: boolean
  gameEndedInEarlySurrender: boolean
  gameEndedInSurrender: boolean
  teamEarlySurrendered: boolean
  win: boolean

  // 金币相关
  goldEarned: number
  goldSpent: number

  // 伤害统计
  damageDealtToBuildings: number
  damageDealtToEpicMonsters: number
  damageDealtToObjectives: number
  damageDealtToTurrets: number
  damageSelfMitigated: number
  largestCriticalStrike: number
  magicDamageDealt: number
  magicDamageDealtToChampions: number
  magicDamageTaken: number
  physicalDamageDealt: number
  physicalDamageDealtToChampions: number
  physicalDamageTaken: number
  totalDamageDealt: number
  totalDamageDealtToChampions: number
  totalDamageShieldedOnTeammates: number
  totalDamageTaken: number
  trueDamageDealt: number
  trueDamageDealtToChampions: number
  trueDamageTaken: number

  // 建筑相关
  inhibitorKills: number
  inhibitorTakedowns: number
  inhibitorsLost: number
  nexusKills: number
  nexusLost: number
  nexusTakedowns: number
  turretKills: number
  turretTakedowns: number
  turretsLost: number

  // 位置和角色
  individualPosition: string
  lane: string
  role: string
  teamPosition: string

  // 装备
  item0: number
  item1: number
  item2: number
  item3: number
  item4: number
  item5: number
  item6: number
  itemsPurchased: number

  // 击杀统计
  kills: number
  killingSprees: number
  largestKillingSpree: number
  largestMultiKill: number
  pentaKills: number
  quadraKills: number
  tripleKills: number
  unrealKills: number

  // 小兵和野怪
  neutralMinionsKilled: number
  totalAllyJungleMinionsKilled: number
  totalEnemyJungleMinionsKilled: number
  totalMinionsKilled: number

  // 目标相关
  objectivesStolen: number
  objectivesStolenAssists: number

  // 玩家信息
  participantId: number
  placement: number
  playerSubteamId: number
  profileIcon: number
  puuid: string
  riotIdGameName: string
  riotIdTagline: string
  subteamPlacement: number
  summonerId: number
  summonerLevel: number
  summonerName: string
  teamId: number

  // 强化符文（特殊模式）
  playerAugment1: number
  playerAugment2: number
  playerAugment3: number
  playerAugment4: number
  playerAugment5: number
  playerAugment6: number

  // 守卫相关
  sightWardsBoughtInGame: number
  visionScore: number
  visionWardsBoughtInGame: number
  wardsKilled: number
  wardsPlaced: number

  // 召唤师技能
  spell1Casts: number
  spell1Id: number
  spell2Casts: number
  spell2Id: number
  spell3Casts: number
  spell4Casts: number
  summoner1Casts: number
  summoner2Casts: number

  // 时间相关
  longestTimeSpentLiving: number
  timeCCingOthers: number
  timePlayed: number
  totalTimeCCDealt: number
  totalTimeSpentDead: number

  // 治疗相关
  totalHeal: number
  totalHealsOnTeammates: number
  totalUnitsHealed: number

  // 复杂对象
  challenges?: Challenges
  missions: SgpMissions
  perks: Perks
}

export interface Perks {
  statPerks: SgpStatPerks
  styles: Style[]
}

interface Style {
  description: string
  selections: SgpSelection[]
  style: number
}

export interface SgpSelection {
  perk: number
  var1: number
  var2: number
  var3: number
}

export interface SgpStatPerks {
  defense: number
  flex: number
  offense: number
}

export interface SgpMissions {
  Missions_ChampionsKilled: number
  Missions_CreepScore: number
  Missions_GoldFromStructuresDestroyed: number
  Missions_GoldFromTurretPlatesTaken: number
  Missions_HealingFromLevelObjects: number
  Missions_MinionsKilled: number
  Missions_TurretPlatesDestroyed: number
  PlayerScore0: number
  PlayerScore1: number
  PlayerScore10: number
  PlayerScore11: number
  PlayerScore2: number
  PlayerScore3: number
  PlayerScore4: number
  PlayerScore5: number
  PlayerScore6: number
  PlayerScore7: number
  PlayerScore8: number
  PlayerScore9: number
}

interface Challenges {
  '12AssistStreakCount'?: number
  HealFromMapSources?: number
  InfernalScalePickup?: number
  SWARM_DefeatAatrox?: number
  SWARM_DefeatBriar?: number
  SWARM_DefeatMiniBosses?: number
  SWARM_EvolveWeapon?: number
  SWARM_Have3Passives?: number
  SWARM_KillEnemy?: number
  SWARM_PickupGold?: number
  SWARM_ReachLevel50?: number
  SWARM_Survive15Min?: number
  SWARM_WinWith5EvolvedWeapons?: number
  abilityUses?: number
  acesBefore15Minutes?: number
  alliedJungleMonsterKills?: number
  baronTakedowns?: number
  baronBuffGoldAdvantageOverThreshold?: number
  blastConeOppositeOpponentCount?: number
  bountyGold?: number
  buffsStolen?: number
  completeSupportQuestInTime?: number
  controlWardsPlaced?: number
  damagePerMinute?: number
  damageTakenOnTeamPercentage?: number
  dancedWithRiftHerald?: number
  deathsByEnemyChamps?: number
  dodgeSkillShotsSmallWindow?: number
  doubleAces?: number
  dragonTakedowns?: number
  earliestBaron?: number
  earliestDragonTakedown?: number
  earlyLaningPhaseGoldExpAdvantage?: number
  effectiveHealAndShielding?: number
  elderDragonKillsWithOpposingSoul?: number
  elderDragonMultikills?: number
  enemyChampionImmobilizations?: number
  enemyJungleMonsterKills?: number
  epicMonsterKillsNearEnemyJungler?: number
  epicMonsterKillsWithin30SecondsOfSpawn?: number
  epicMonsterSteals?: number
  epicMonsterStolenWithoutSmite?: number
  firstTurretKilled?: number
  firstTurretKilledTime?: number
  fistBumpParticipation?: number
  flawlessAces?: number
  fullTeamTakedown?: number
  gameLength?: number
  getTakedownsInAllLanesEarlyJungleAsLaner?: number
  goldPerMinute?: number
  hadOpenNexus?: number
  highestChampionDamage?: number
  highestCrowdControlScore?: number
  immobilizeAndKillWithAlly?: number
  initialBuffCount?: number
  initialCrabCount?: number
  jungleCsBefore10Minutes?: number
  junglerTakedownsNearDamagedEpicMonster?: number
  kTurretsDestroyedBeforePlatesFall?: number
  kda?: number
  killAfterHiddenWithAlly?: number
  killParticipation?: number
  killedChampTookFullTeamDamageSurvived?: number
  killingSprees?: number
  killsNearEnemyTurret?: number
  killsOnOtherLanesEarlyJungleAsLaner?: number
  killsOnRecentlyHealedByAramPack?: number
  killsUnderOwnTurret?: number
  killsWithHelpFromEpicMonster?: number
  knockEnemyIntoTeamAndKill?: number
  landSkillShotsEarlyGame?: number
  laneMinionsFirst10Minutes?: number
  laningPhaseGoldExpAdvantage?: number
  legendaryCount?: number
  legendaryItemUsed?: number
  lostAnInhibitor?: number
  maxCsAdvantageOnLaneOpponent?: number
  maxKillDeficit?: number
  maxLevelLeadLaneOpponent?: number
  mejaisFullStackInTime?: number
  moreEnemyJungleThanOpponent?: number
  multiKillOneSpell?: number
  multiTurretRiftHeraldCount?: number
  multikills?: number
  multikillsAfterAggressiveFlash?: number
  outerTurretExecutesBefore10Minutes?: number
  outnumberedKills?: number
  outnumberedNexusKill?: number
  perfectDragonSoulsTaken?: number
  perfectGame?: number
  pickKillWithAlly?: number
  playedChampSelectPosition?: number
  poroExplosions?: number
  quickCleanse?: number
  quickFirstTurret?: number
  quickSoloKills?: number
  riftHeraldTakedowns?: number
  saveAllyFromDeath?: number
  scuttleCrabKills?: number
  shortestTimeToAceFromFirstTakedown?: number
  skillshotsDodged?: number
  skillshotsHit?: number
  snowballsHit?: number
  soloBaronKills?: number
  soloKills?: number
  soloTurretsLategame?: number
  stealthWardsPlaced?: number
  survivedSingleDigitHpCount?: number
  survivedThreeImmobilizesInFight?: number
  takedownOnFirstTurret?: number
  takedowns?: number
  takedownsAfterGainingLevelAdvantage?: number
  takedownsBeforeJungleMinionSpawn?: number
  takedownsFirstXMinutes?: number
  takedownsInAlcove?: number
  takedownsInEnemyFountain?: number
  teamBaronKills?: number
  teamDamagePercentage?: number
  teamElderDragonKills?: number
  teamRiftHeraldKills?: number
  tookLargeDamageSurvived?: number
  turretPlatesTaken?: number
  turretTakedowns?: number
  turretsTakenWithRiftHerald?: number
  twentyMinionsIn3SecondsCount?: number
  twoWardsOneSweeperCount?: number
  unseenRecalls?: number
  visionScoreAdvantageLaneOpponent?: number
  visionScorePerMinute?: number
  voidMonsterKill?: number
  wardTakedowns?: number
  wardTakedownsBefore20M?: number
  wardsGuarded?: number
}

export interface SgpGameMetadataLol {
  product: string
  tags: string[]
  participants: string[]
  timestamp: string
  data_version: string
  info_type: string
  match_id: string
  private: boolean
}

// Game Details

interface Position {
  x: number
  y: number
}

interface Metadata {
  product: string
  tags: string[]
  participants: string[]
  timestamp: string
  data_version: string
  info_type: string
  match_id: string
  private: boolean
}

export interface ChampionStats {
  abilityHaste: number
  abilityPower: number
  armor: number
  armorPen: number
  armorPenPercent: number
  attackDamage: number
  attackSpeed: number
  bonusArmorPenPercent: number
  bonusMagicPenPercent: number
  ccReduction: number
  cooldownReduction: number
  health: number
  healthMax: number
  healthRegen: number
  lifesteal: number
  magicPen: number
  magicPenPercent: number
  magicResist: number
  movementSpeed: number
  omnivamp: number
  physicalVamp: number
  power: number
  powerMax: number
  powerRegen: number
  spellVamp: number
}

export interface DamageStats {
  magicDamageDone: number
  magicDamageDoneToChampions: number
  magicDamageTaken: number
  physicalDamageDone: number
  physicalDamageDoneToChampions: number
  physicalDamageTaken: number
  totalDamageDone: number
  totalDamageDoneToChampions: number
  totalDamageTaken: number
  trueDamageDone: number
  trueDamageDoneToChampions: number
  trueDamageTaken: number
}

export type DamageDetailType = 'OTHER' | 'TOWER' | 'MINION'

export interface DamageDetail {
  basic: boolean
  magicDamage: number
  name: string
  participantId: number
  physicalDamage: number
  spellName: string
  spellSlot: number
  trueDamage: number
  type: DamageDetailType
}

export interface DetailedParticipantFrame {
  participantId: number
  currentGold: number
  totalGold: number
  goldPerSecond: number
  level: number
  xp: number
  minionsKilled: number
  jungleMinionsKilled: number
  position: Position
  timeEnemySpentControlled: number
  championStats: ChampionStats
  damageStats: DamageStats
}

export type DetailedParticipantFrames = Record<string, DetailedParticipantFrame>

export type DetailedGameEventType =
  | 'PAUSE_END'
  | 'LEVEL_UP'
  | 'SKILL_LEVEL_UP'
  | 'ITEM_PURCHASED'
  | 'ITEM_SOLD'
  | 'ITEM_DESTROYED'
  | 'ITEM_UNDO'
  | 'CHAMPION_KILL'
  | 'CHAMPION_SPECIAL_KILL'
  | 'BUILDING_KILL'
  | 'GAME_END'
  | 'TURRET_PLATE_DESTROYED'

export interface BaseDetailedGameEvent {
  type: DetailedGameEventType
  timestamp: number
  realTimestamp?: number
}

export interface PauseEndEvent extends BaseDetailedGameEvent {
  type: 'PAUSE_END'
  realTimestamp: number
}

export interface DetailedLevelUpEvent extends BaseDetailedGameEvent {
  type: 'LEVEL_UP'
  participantId: number
  level: number
}

export type LevelUpType = 'NORMAL' | 'EVOLVE'

export interface DetailedSkillLevelUpEvent extends BaseDetailedGameEvent {
  type: 'SKILL_LEVEL_UP'
  participantId: number
  skillSlot: number
  levelUpType: LevelUpType
}

export interface DetailedItemPurchasedEvent extends BaseDetailedGameEvent {
  type: 'ITEM_PURCHASED'
  participantId: number
  itemId: number
}

export interface DetailedItemSoldEvent extends BaseDetailedGameEvent {
  type: 'ITEM_SOLD'
  participantId: number
  itemId: number
}

export interface DetailedItemDestroyedEvent extends BaseDetailedGameEvent {
  type: 'ITEM_DESTROYED'
  participantId: number
  itemId: number
}

export interface DetailedItemUndoEvent extends BaseDetailedGameEvent {
  type: 'ITEM_UNDO'
  participantId: number
  beforeId: number
  afterId: number
  goldGain: number
}

export interface DetailedChampionKillEvent extends BaseDetailedGameEvent {
  type: 'CHAMPION_KILL'
  killerId: number
  victimId: number
  assistingParticipantIds: number[]
  position: Position
  bounty: number
  shutdownBounty: number
  killStreakLength: number
  victimDamageDealt: DamageDetail[]
  victimDamageReceived: DamageDetail[]
}

export type SpecialKillType = 'KILL_FIRST_BLOOD' | 'KILL_MULTI' | 'KILL_ACE'

export interface ChampionSpecialKillEvent extends BaseDetailedGameEvent {
  type: 'CHAMPION_SPECIAL_KILL'
  killerId: number
  position: Position
  killType: SpecialKillType
  multiKillLength?: number
}

export type BuildingType = 'TOWER_BUILDING' | 'INHIBITOR_BUILDING'

export type TowerType = 'OUTER_TURRET' | 'INNER_TURRET' | 'NEXUS_TURRET'

export type LaneType = 'MID_LANE'

export interface DetailedBuildingKillEvent extends BaseDetailedGameEvent {
  type: 'BUILDING_KILL'
  killerId: number
  assistingParticipantIds: number[]
  position: Position
  bounty: number
  buildingType: BuildingType
  towerType?: TowerType
  laneType?: LaneType
  teamId: number
}

export interface GameEndEvent extends BaseDetailedGameEvent {
  type: 'GAME_END'
  gameId: number
  winningTeam: number
  realTimestamp: number
}

export interface DetailedTurretPlateDestroyedEvent extends BaseDetailedGameEvent {
  type: 'TURRET_PLATE_DESTROYED'
  killerId: number
  laneType: LaneType
  position: Position
  teamId: number
}

export type DetailedGameEvent =
  | PauseEndEvent
  | DetailedLevelUpEvent
  | DetailedSkillLevelUpEvent
  | DetailedItemPurchasedEvent
  | DetailedItemSoldEvent
  | DetailedItemDestroyedEvent
  | DetailedItemUndoEvent
  | DetailedChampionKillEvent
  | ChampionSpecialKillEvent
  | DetailedBuildingKillEvent
  | GameEndEvent
  | DetailedTurretPlateDestroyedEvent

export interface DetailedTimelineFrame {
  timestamp: number
  events: DetailedGameEvent[]
  participantFrames: DetailedParticipantFrames
}

export type EndOfGameResult = string

export interface GameDetailsJson {
  endOfGameResult: EndOfGameResult
  frameInterval: number
  frames: DetailedTimelineFrame[]
}

export interface SgpGameDetailsLol {
  metadata: Metadata
  json: GameDetailsJson
}

// TFT Match History Types

export interface SgpMatchHistoryTft {
  games: SgpGameTft[]
}

export interface SgpGameTft {
  metadata: SgpGameMetadataLol
  json: SgpGameTftJson
}

export interface SgpGameTftJson {
  endOfGameResult: string
  gameCreation: number
  gameId: number
  game_datetime: string
  game_id: number
  game_length: number
  game_version: string
  mapId: number
  participants: SgpParticipantTft[]
  queueId: number
  queue_id: number
  tft_game_type: string
  tft_set_core_name: string
  tft_set_number: number
}

interface SgpParticipantTft {
  augments: string[]
  companion: Companion
  gold_left: number
  last_round: number
  level: number
  missions: SgpMissionsTft
  placement: number
  players_eliminated: number
  puuid: string
  time_eliminated: number
  total_damage_to_players: number
  traits: Trait[]
  units: Unit[]
}

interface Unit {
  character_id: string
  itemNames: string[]
  name: string
  rarity: number
  tier: number
}

interface Trait {
  name: string
  num_units: number
  style: number
  tier_current: number
  tier_total: number
}

interface SgpMissionsTft {
  Assists: number
  DamageDealt: number
  DamageDealtToObjectives: number
  DamageDealtToTurrets: number
  DamageTaken: number
  Deaths: number
  DoubleKills: number
  GoldEarned: number
  GoldSpent: number
  InhibitorsDestroyed: number
  KillingSprees: number
  Kills: number
  LargestKillingSpree: number
  LargestMultiKill: number
  MagicDamageDealt: number
  MagicDamageDealtToChampions: number
  MagicDamageTaken: number
  NeutralMinionsKilledTeamJungle: number
  PentaKills: number
  PhysicalDamageDealt: number
  PhysicalDamageDealtToChampions: number
  PhysicalDamageTaken: number
  PlayerScore0: number
  PlayerScore1: number
  PlayerScore10: number
  PlayerScore11: number
  PlayerScore2: number
  PlayerScore3: number
  PlayerScore4: number
  PlayerScore5: number
  PlayerScore6: number
  PlayerScore9: number
  QuadraKills: number
  Spell1Casts: number
  Spell2Casts: number
  Spell3Casts: number
  Spell4Casts: number
  SummonerSpell1Casts: number
  TimeCCOthers: number
  TotalDamageDealtToChampions: number
  TotalMinionsKilled: number
  TripleKills: number
  TrueDamageDealt: number
  TrueDamageDealtToChampions: number
  TrueDamageTaken: number
  UnrealKills: number
  VisionScore: number
  WardsKilled: number
}

interface Companion {
  content_ID: string
  item_ID: number
  skin_ID: number
  species: string
}
