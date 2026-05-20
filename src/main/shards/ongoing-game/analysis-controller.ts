import { AggregatedAnalysis, analyzeGames } from '@shared/data-adapter/analysis/player'
import { AggregatedTeamAnalysis, analyzePlayers } from '@shared/data-adapter/analysis/team'
import { toIdentities } from '@shared/data-adapter/match-history/identities'
import {
  calculateTogetherTimes,
  mergeOverlappingSets,
  removeSubsets
} from '@shared/utils/team-up-calc'
import { comparer } from 'mobx'

import type { OngoingGameMainContext } from './context'

export class OngoingGameAnalysisController {
  constructor(private readonly _context: OngoingGameMainContext) {}

  watch() {
    const { mobxUtils, settings, state } = this._context

    mobxUtils.reaction(
      () => ({
        summaryKeys: Object.entries(state.matchHistory)
          .map(
            ([puuid, mh]) => `${puuid}:${mh.data.map((g) => `${g.source}:${g.gameId}`).join(',')}`
          )
          .toSorted(),
        teamKeys: Object.entries(state.teams)
          .map(([teamIdentifier, puuids]) => `${teamIdentifier}:${puuids.join(',')}`)
          .toSorted(),
        detailsKeys: Object.values(state.gameDetails)
          .map((detail) => `${detail.source}:${detail.gameId}`)
          .toSorted()
      }),
      () => {
        state.setAnalysis(this._computeAnalysis())
        state.setInferredPremadeTeams(this._inferPremadeTeams())
      },
      { delay: 300, equals: comparer.structural }
    )

    mobxUtils.reaction(
      () => ({
        summaryKeys: new Set(
          Object.values(state.matchHistory)
            .map((mh) => mh.data.map((g) => g.gameId))
            .flat()
        )
          .values()
          .toArray()
          .toSorted(),
        threshold: settings.premadeTeamInferMatchCountThreshold
      }),
      () => {
        state.setInferredPremadeTeams(this._inferPremadeTeams())
      },
      { delay: 300, equals: comparer.shallow }
    )
  }

  private _computeAnalysis() {
    const { logger, state } = this._context

    if (!state.teams) {
      return null
    }

    try {
      const playerAnalyses: Record<string, AggregatedAnalysis> = {}

      for (const [puuid, matchHistory] of Object.entries(state.matchHistory)) {
        if (!matchHistory) {
          continue
        }

        const pairs = matchHistory.data.map((summary) => ({
          gameId: summary.gameId,
          summary: summary,
          details: state.gameDetails[summary.gameId]
        }))

        const analysis = analyzeGames(pairs, puuid, {
          previous: state.analysis?.players[puuid]
        })

        if (analysis) {
          playerAnalyses[puuid] = analysis
        }
      }

      const teamAnalyses: Record<string, AggregatedTeamAnalysis> = {}

      for (const [teamIdentifier, puuids] of Object.entries(state.teams)) {
        const teamPlayerAnalyses = puuids.map((p) => playerAnalyses[p]).filter(Boolean)
        const teamAnalysis = analyzePlayers(teamPlayerAnalyses)

        if (teamAnalysis) {
          teamAnalyses[teamIdentifier] = teamAnalysis
        }
      }

      return {
        players: playerAnalyses,
        teams: teamAnalyses
      }
    } catch (error) {
      logger.warn('Error calculating match history', error)
      return null
    }
  }

  private _inferPremadeTeams() {
    const { settings, state } = this._context

    if (!Object.keys(state.matchHistory).length) {
      return []
    }

    const matchesByTeams = Object.values(state.matchHistory)
      .map((m) => {
        return m.data.map((d) => {
          const groupedByTeamId = toIdentities(d).reduce(
            (acc, i) => {
              if (!acc[i.teamId]) {
                acc[i.teamId] = []
              }
              acc[i.teamId].push(i.puuid)
              return acc
            },
            {} as Record<number, string[]>
          )

          return Object.values(groupedByTeamId)
            .filter((c) => c.length > 1)
            .map((g) => ({
              players: g,
              id: d.gameId.toString()
            }))
        })
      })
      .flat(2)

    const deduplicatedMap = new Map<string, { players: string[]; id: string }>(
      matchesByTeams.map((m) => [m.id, m])
    )

    const calculated = calculateTogetherTimes(
      Array.from(deduplicatedMap.values()),
      Object.values(state.teams).flat(),
      settings.premadeTeamInferMatchCountThreshold
    )

    const simplified = removeSubsets(calculated, (t) => t.players)
    const mergedOverlappingSets = mergeOverlappingSets(simplified.map((t) => t.players))

    return mergedOverlappingSets as string[][]
  }
}
