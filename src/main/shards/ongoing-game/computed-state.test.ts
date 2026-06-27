import { AdditionalResult, QueryStage } from '@shared/shards/ongoing-game'
import { describe, expect, it } from 'vitest'

import { LeagueClientData } from '../league-client/lc-state'
import { ChampSelectHandoffSnapshot } from './champ-select-handoff'
import {
  getLiveChampionSelections,
  getLivePositionAssignments,
  getLiveTeams
} from './computed-state'

const emptyAdditional: AdditionalResult = {
  teams: {},
  selections: {},
  teamParticipantGroups: {},
  spells: {},
  positions: {}
}

const inGameQueryStage: Extract<QueryStage, { phase: 'in-game' }> = {
  phase: 'in-game',
  gameInfo: {
    queueId: 420,
    queueType: 'CLASSIC',
    gameMode: 'CLASSIC',
    gameId: 12345
  }
}

const config = {
  spotlight: {
    deobfuscation: true
  }
}

function createInGameData(): LeagueClientData {
  return {
    gameflow: {
      session: {
        phase: 'InProgress',
        gameData: {
          queue: {
            id: 420,
            type: 'CLASSIC',
            gameMode: 'CLASSIC'
          },
          gameId: 12345,
          playerChampionSelections: [{ puuid: 'real1', championId: 2 }],
          teamOne: [
            {
              puuid: 'real1',
              championId: 2,
              selectedPosition: 'JUNGLE',
              selectedRole: 'JUNGLE.PRIMARY.JUNGLE.TOP'
            }
          ],
          teamTwo: []
        }
      }
    }
  } as unknown as LeagueClientData
}

describe('champ-select handoff state merge', () => {
  it('supplements missing in-game players without overwriting authoritative data', () => {
    const data = createInGameData()
    const champSelectHandoffSnapshot: ChampSelectHandoffSnapshot = {
      gameId: 12345,
      teams: {
        'TEAM-100': ['handoff1'],
        'TEAM-200': ['real1']
      },
      players: {
        handoff1: {
          championId: 1,
          position: 'TOP',
          spell1Id: 4,
          spell2Id: 14
        },
        real1: {
          championId: 99,
          position: 'BOTTOM',
          spell1Id: 7,
          spell2Id: 4
        }
      }
    }

    expect(
      getLiveTeams({
        data,
        settings: { enabled: true, queryInLobbyPhase: true },
        queryStage: inGameQueryStage,
        additional: emptyAdditional,
        config,
        champSelectHandoffSnapshot
      })
    ).toEqual({
      'TEAM-100': ['real1', 'handoff1'],
      'TEAM-200': []
    })

    expect(
      getLiveChampionSelections({
        data,
        queryStage: inGameQueryStage,
        additional: emptyAdditional,
        config,
        champSelectHandoffSnapshot
      })
    ).toEqual({
      real1: 2,
      handoff1: 1
    })

    expect(
      getLivePositionAssignments({
        data,
        queryStage: inGameQueryStage,
        additional: emptyAdditional,
        config,
        champSelectHandoffSnapshot
      })
    ).toEqual({
      real1: {
        position: 'JUNGLE',
        role: {
          current: 'JUNGLE',
          assignmentReason: 'PRIMARY',
          primary: 'JUNGLE',
          secondary: 'TOP',
          fill: 'NONE'
        }
      },
      handoff1: {
        position: 'TOP',
        role: null
      }
    })
  })

  it('does not merge handoff data from a different game', () => {
    const data = createInGameData()
    const champSelectHandoffSnapshot: ChampSelectHandoffSnapshot = {
      gameId: 99999,
      teams: {
        'TEAM-100': ['handoff1']
      },
      players: {
        handoff1: {
          championId: 1,
          position: 'TOP',
          spell1Id: 4,
          spell2Id: 14
        }
      }
    }

    expect(
      getLiveChampionSelections({
        data,
        queryStage: inGameQueryStage,
        additional: emptyAdditional,
        config,
        champSelectHandoffSnapshot
      })
    ).toEqual({
      real1: 2
    })
  })
})
