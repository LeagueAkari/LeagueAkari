import { comparer } from 'mobx'

import type { InGameSendMainContext } from './context'

export class InGameSendPresetSelectionController {
  constructor(private readonly _context: InGameSendMainContext) {}

  start() {
    const { ongoingGame, mobxUtils } = this._context

    mobxUtils.reaction(
      () => ongoingGame.state.teams,
      (teams) => {
        const all = Object.values(teams).flat()
        this.setRatingPuuids(all)
        this.setJunglePuuids(all)
      },
      { equals: comparer.structural, fireImmediately: true }
    )

    mobxUtils.reaction(
      () => ongoingGame.state.mergedPremadeTeamMap,
      (map) => {
        const indices = [...new Set(Object.values(map))]
        this.setPremadeIndices(indices)
      },
      { equals: comparer.structural, fireImmediately: true }
    )
  }

  setRatingPuuids(puuids: string[]) {
    this._context.state.setRatingPuuids(this._filterCurrentPuuids(puuids))
  }

  setJunglePuuids(puuids: string[]) {
    this._context.state.setJunglePuuids(this._filterCurrentPuuids(puuids))
  }

  setPremadeIndices(indices: number[]) {
    this._context.state.setPremadeIndices(this._filterCurrentPremadeIndices(indices))
  }

  clearPresetSelections() {
    this._context.state.clearPresetSelections()
  }

  private _filterCurrentPuuids(puuids: string[]) {
    const currentPuuids = new Set(Object.values(this._context.ongoingGame.state.teams).flat())

    return [...new Set(puuids)].filter((puuid) => currentPuuids.has(puuid))
  }

  private _filterCurrentPremadeIndices(indices: number[]) {
    const currentIndices = new Set(
      Object.values(this._context.ongoingGame.state.mergedPremadeTeamMap)
    )

    return [...new Set(indices)].filter(
      (index) => Number.isInteger(index) && currentIndices.has(index)
    )
  }
}
