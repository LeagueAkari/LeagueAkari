import { SUMMONER_SPELL_SMITE_ID } from '@shared/constants/summoner-spells'
import { comparer } from 'mobx'

import type { InGameSendMainContext } from './context'

type PresetSelectionTeams = Record<string, string[]>
type PresetSelectionPositionAssignments = Record<string, { position: string | null }>
type PresetSelectionSpells = Record<string, { spell1Id: number; spell2Id: number }>

export class InGameSendPresetSelectionController {
  constructor(private readonly _context: InGameSendMainContext) {}

  start() {
    const { ongoingGame, mobxUtils } = this._context

    mobxUtils.reaction(
      () => ({
        teams: ongoingGame.state.teams,
        positionAssignments: ongoingGame.state.positionAssignments,
        spells: ongoingGame.state.additional.spells
      }),
      ({ teams, positionAssignments, spells }) => {
        const all = Object.values(teams).flat()
        this.setRatingPuuids(all)
        this.setJunglePuuids(this._defaultJunglePuuids(teams, positionAssignments, spells))
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

  private _defaultJunglePuuids(
    teams: PresetSelectionTeams,
    positionAssignments: PresetSelectionPositionAssignments,
    spells: PresetSelectionSpells
  ) {
    return Object.values(teams)
      .flat()
      .filter((puuid) => this._isJunglerPuuid(puuid, positionAssignments, spells))
  }

  private _isJunglerPuuid(
    puuid: string,
    positionAssignments: PresetSelectionPositionAssignments,
    spells: PresetSelectionSpells
  ) {
    const assignedPosition = positionAssignments[puuid]?.position
    if (assignedPosition?.toUpperCase() === 'JUNGLE') {
      return true
    }

    const playerSpells = spells[puuid]
    return (
      playerSpells?.spell1Id === SUMMONER_SPELL_SMITE_ID ||
      playerSpells?.spell2Id === SUMMONER_SPELL_SMITE_ID
    )
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
