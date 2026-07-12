export interface ChampionAnalysisMastery {
  championId: number
  championLevel: number
  championPoints: number
  championSeasonMilestone: number
  highestGrade: string
  lastPlayTime: number
  championPointsSinceLastLevel?: number
  championPointsUntilNextLevel?: number
  tokensEarned?: number
}
