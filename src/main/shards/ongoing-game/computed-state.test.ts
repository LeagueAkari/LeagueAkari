import { AdditionalResult, QueryStage } from '@shared/shards/ongoing-game'
import { describe, expect, it, vi } from 'vitest'

import { LeagueClientData } from '../league-client/lc-state'
import { ChampSelectHandoffSnapshot } from './champ-select-handoff'
import {
  getDraftPositionAssignments,
  getLiveChampionSelections,
  getLivePositionAssignments,
  getLiveTeams
} from './computed-state'

vi.mock('@resources/magic/magic.darwin-arm64.node?asset&asarUnpack', () => ({
  default: 'magic.darwin-arm64.node'
}))
vi.mock('@resources/magic/magic.win32-x64.node?asset&asarUnpack', () => ({
  default: 'magic.win32-x64.node'
}))

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

const champSelectQueryStage: Extract<QueryStage, { phase: 'champ-select' }> = {
  phase: 'champ-select',
  gameInfo: {
    queueId: 420,
    queueType: 'CLASSIC',
    gameMode: 'CLASSIC',
    gameId: 12345
  }
}

const deobfuscationEnabled = true

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
              selectedRole: 'JUNGLE.AUTOFILL.JUNGLE.TOP'
            }
          ],
          teamTwo: []
        }
      }
    }
  } as unknown as LeagueClientData
}

function createChampSelectData(): LeagueClientData {
  return {
    champSelect: {
      session: {
        myTeam: [
          {
            puuid: 'autofilled',
            nameVisibilityType: 'VISIBLE',
            obfuscatedPuuid: '',
            team: 100,
            championId: 1,
            championPickIntent: 0,
            assignedPosition: 'utility',
            isAutofilled: true,
            spell1Id: 4,
            spell2Id: 14
          },
          {
            puuid: 'primary',
            nameVisibilityType: 'VISIBLE',
            obfuscatedPuuid: '',
            team: 100,
            championId: 2,
            championPickIntent: 0,
            assignedPosition: 'top',
            isAutofilled: false,
            spell1Id: 4,
            spell2Id: 12
          }
        ],
        theirTeam: []
      }
    }
  } as unknown as LeagueClientData
}

describe('champ-select position assignments', () => {
  it('preserves the LCU autofill indicator', () => {
    expect(
      getLivePositionAssignments({
        data: createChampSelectData(),
        queryStage: champSelectQueryStage,
        additional: emptyAdditional,
        deobfuscationEnabled
      })
    ).toEqual({
      autofilled: {
        position: 'UTILITY',
        role: null,
        isAutofilled: true
      },
      primary: {
        position: 'TOP',
        role: null,
        isAutofilled: false
      }
    })
  })
})

describe('draft position assignments', () => {
  it('defaults autofill to false when the source has no assignment reason', () => {
    expect(
      getDraftPositionAssignments({
        gameModeKind: 'normal',
        queueId: 420,
        puuid: 'p1',
        teams: { 'TEAM-100': ['p1'] },
        championSelections: { p1: 1 },
        positions: {
          p1: {
            selected: 'top',
            primary: 'top',
            secondary: 'jungle'
          }
        }
      })
    ).toEqual({
      p1: {
        position: 'TOP',
        role: null,
        isAutofilled: false
      }
    })
  })
})

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
        deobfuscationEnabled,
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
        deobfuscationEnabled,
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
        deobfuscationEnabled,
        champSelectHandoffSnapshot
      })
    ).toEqual({
      real1: {
        position: 'JUNGLE',
        role: {
          current: 'JUNGLE',
          assignmentReason: 'AUTOFILL',
          primary: 'JUNGLE',
          secondary: 'TOP',
          fill: 'NONE'
        },
        isAutofilled: true
      },
      handoff1: {
        position: 'TOP',
        role: null,
        isAutofilled: false
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
        deobfuscationEnabled,
        champSelectHandoffSnapshot
      })
    ).toEqual({
      real1: 2
    })
  })
})
