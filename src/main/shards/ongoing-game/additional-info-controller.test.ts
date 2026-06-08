import { EMPTY_PUUID } from '@shared/constants/common'
import { describe, expect, it } from 'vitest'

import { extractTeamMembers } from './additional-info-controller'

describe('extractTeamMembers', () => {
  it('extracts classic teams and filters empty puuids from team lists', () => {
    expect(
      extractTeamMembers(
        'CLASSIC',
        [
          {
            puuid: 'p1',
            championId: 1,
            teamParticipantId: 11,
            selectedPosition: 'TOP',
            selectedRole: 'TOP.PRIMARY.TOP.JUNGLE'
          },
          {
            puuid: EMPTY_PUUID,
            championId: 2,
            teamParticipantId: 12,
            selectedPosition: 'JUNGLE',
            selectedRole: 'JUNGLE.PRIMARY.JUNGLE.TOP'
          }
        ],
        [
          {
            puuid: 'p2',
            championId: 3,
            teamParticipantId: 21,
            selectedPosition: 'MIDDLE',
            selectedRole: 'MIDDLE.PRIMARY.MIDDLE.BOTTOM'
          }
        ],
        [
          { puuid: 'p1', spell1Id: 4, spell2Id: 14 },
          { puuid: 'p2', spell1Id: 7, spell2Id: 4 }
        ]
      )
    ).toEqual({
      teams: {
        'TEAM-100': ['p1'],
        'TEAM-200': ['p2']
      },
      selections: {
        p1: 1,
        p2: 3
      },
      teamParticipantGroups: {
        p1: 11,
        p2: 21
      },
      spells: {
        p1: { spell1Id: 4, spell2Id: 14 },
        p2: { spell1Id: 7, spell2Id: 4 }
      },
      positions: {
        p1: {
          position: 'TOP',
          role: {
            current: 'TOP',
            assignmentReason: 'PRIMARY',
            primary: 'TOP',
            secondary: 'JUNGLE',
            fill: 'NONE'
          }
        },
        p2: {
          position: 'MIDDLE',
          role: {
            current: 'MIDDLE',
            assignmentReason: 'PRIMARY',
            primary: 'MIDDLE',
            secondary: 'BOTTOM',
            fill: 'NONE'
          }
        }
      }
    })
  })

  it('extracts cherry members into one all-player team', () => {
    expect(
      extractTeamMembers(
        'CHERRY',
        [
          {
            puuid: 'p1',
            championId: 10,
            teamParticipantId: 1,
            selectedPosition: '',
            selectedRole: 'TOP.PRIMARY.TOP.JUNGLE'
          }
        ],
        [
          {
            puuid: 'p2',
            championId: 20,
            teamParticipantId: 2,
            selectedPosition: '',
            selectedRole: 'BOTTOM.SECONDARY.TOP.BOTTOM'
          }
        ],
        [
          { puuid: 'p1', spell1Id: 32, spell2Id: 4 },
          { puuid: 'p2', spell1Id: 21, spell2Id: 4 }
        ]
      )
    ).toMatchObject({
      teams: {
        'TEAM-ALL': ['p1', 'p2']
      },
      selections: {
        p1: 10,
        p2: 20
      },
      teamParticipantGroups: {
        p1: 1,
        p2: 2
      },
      spells: {
        p1: { spell1Id: 32, spell2Id: 4 },
        p2: { spell1Id: 21, spell2Id: 4 }
      }
    })
  })
})
