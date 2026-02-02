export interface AllPlayerData {
  puuid: string
  levelPoints: LevelPoints
  totalPoints: TotalPoints
  categoryPoints: CategoryPoints
  playerChallenges: PlayerChallenge[]
  preferences: Preferences
  apexLaderUpdateTime: number
}

export interface CategoryPoints {
  COLLECTION: TotalPoints
  IMAGINATION: TotalPoints
  EXPERTISE: TotalPoints
  TEAMWORK: TotalPoints
  VETERANCY: TotalPoints
}

export interface TotalPoints {
  level: Level
  current: number
  max: number
  percentile?: number
}

export enum Level {
  Bronze = 'BRONZE',
  Challenger = 'CHALLENGER',
  Diamond = 'DIAMOND',
  Gold = 'GOLD',
  Grandmaster = 'GRANDMASTER',
  Iron = 'IRON',
  Master = 'MASTER',
  None = 'NONE',
  Platinum = 'PLATINUM',
  Silver = 'SILVER'
}

export interface LevelPoints {
  NONE: number
  IRON: number
  BRONZE: number
  SILVER: number
  GOLD: number
  PLATINUM: number
  DIAMOND: number
  MASTER: number
  GRANDMASTER: number
  CHALLENGER: number
}

export interface PlayerChallenge {
  id: number
  category: Category
  legacy: boolean
  percentile: number
  initValue: number
  currentLevel: Level
  currentValue: number
  currentThreshold: number
  currentLevelAchievedTime?: number
  nextLevel: Level
  nextThreshold: number
  friendsAtLevels: FriendsAtLevel[]
  idListType?: IDListType
  completedIds?: number[]
  availableIds?: number[]
  position?: number
  playersInLevel?: number
}

export enum Category {
  Collection = 'COLLECTION',
  Expertise = 'EXPERTISE',
  Imagination = 'IMAGINATION',
  Legacy = 'LEGACY',
  None = 'NONE',
  Teamwork = 'TEAMWORK',
  Veterancy = 'VETERANCY'
}

export interface FriendsAtLevel {
  level: Level
  friends: string[]
}

export enum IDListType {
  Champion = 'CHAMPION',
  ChampionSkin = 'CHAMPION_SKIN',
  Item = 'ITEM'
}

export interface Preferences {
  bannerAccent: string
  title: string
  challengeIds: number[]
  crestBorder: string
  prestigeCrestBorderLevel: number
}
