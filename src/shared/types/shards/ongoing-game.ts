export type AdditionalResult = {
  teams: Record<string, string[]>
  selections: Record<string, number>
  teamParticipantGroups: Record<string, number>
  spells: Record<string, { spell1Id: number; spell2Id: number }>
}

type QueryStageGameInfo = {
  queueId: number
  queueType: string
  gameMode: string
  gameId: number
}

export type QueryStage =
  | {
      phase: 'champ-select'
      gameInfo: QueryStageGameInfo
    }
  | {
      phase: 'in-game'
      gameInfo: QueryStageGameInfo
    }
  | {
      phase: 'lobby'
      gameInfo: {
        queueId: number
        queueType: string
      }
    }
  | {
      phase: 'unavailable'
      gameInfo: null
    }
