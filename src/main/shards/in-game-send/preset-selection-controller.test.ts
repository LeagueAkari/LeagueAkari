import { SUMMONER_SPELL_SMITE_ID } from '@shared/constants/summoner-spells'
import { describe, expect, it } from 'vitest'

import { InGameSendPresetSelectionController } from './preset-selection-controller'

function createControllerContext() {
  const state = {
    ratingPuuids: [] as string[],
    junglePuuids: [] as string[],
    premadeIndices: [] as number[],
    setRatingPuuids(puuids: string[]) {
      this.ratingPuuids = puuids
    },
    setJunglePuuids(puuids: string[]) {
      this.junglePuuids = puuids
    },
    setPremadeIndices(indices: number[]) {
      this.premadeIndices = indices
    },
    clearPresetSelections() {
      this.ratingPuuids = []
      this.junglePuuids = []
      this.premadeIndices = []
    }
  }

  const context = {
    state,
    ongoingGame: {
      state: {
        teams: {
          'TEAM-100': ['top', 'jungle'],
          'TEAM-200': ['enemy-jungle', 'enemy-mid']
        },
        positionAssignments: {
          top: {
            position: 'TOP'
          },
          jungle: {
            position: 'JUNGLE'
          },
          'enemy-mid': {
            position: 'MIDDLE'
          }
        },
        additional: {
          spells: {
            'enemy-jungle': {
              spell1Id: SUMMONER_SPELL_SMITE_ID,
              spell2Id: 4
            }
          }
        },
        mergedPremadeTeamMap: {}
      }
    },
    mobxUtils: {
      reaction(selector: () => unknown, effect: (value: unknown) => void) {
        effect(selector())
      }
    }
  } as any

  return {
    state,
    controller: new InGameSendPresetSelectionController(context)
  }
}

describe('InGameSendPresetSelectionController', () => {
  it('defaults jungle preset selection to both teams junglers', () => {
    const { controller, state } = createControllerContext()

    controller.start()

    expect(state.ratingPuuids).toEqual(['top', 'jungle', 'enemy-jungle', 'enemy-mid'])
    expect(state.junglePuuids).toEqual(['jungle', 'enemy-jungle'])
  })
})
