import { comparer } from 'mobx'

import type { InGameSendMainContext } from './context'

export class InGameSendPresetSelectionController {
  constructor(private readonly _context: InGameSendMainContext) {}

  start() {
    const { state, ongoingGame, mobxUtils } = this._context

    mobxUtils.reaction(
      () => ongoingGame.state.teams,
      (teams) => {
        const all = Object.values(teams).flat()
        state.setRatingPuuids(all)
        state.setJunglePuuids(all)
      },
      { equals: comparer.structural, fireImmediately: true }
    )

    mobxUtils.reaction(
      () => ongoingGame.state.mergedPremadeTeamMap,
      (map) => {
        const indices = [...new Set(Object.values(map))]
        state.setPremadeIndices(indices)
      },
      { equals: comparer.structural, fireImmediately: true }
    )
  }
}
