import { EMPTY_PUUID } from '@shared/constants/common'
import { AdditionalResult } from '@shared/shards/ongoing-game'
import { isAbortError } from '@shared/utils/queue-keeper'
import { ParsedRole, parseSelectedRole } from '@shared/utils/ranked'
import { isAxiosError } from 'axios'
import { comparer } from 'mobx'

import { ONGOING_GAME_LOADING_PRIORITY, type OngoingGameMainContext } from './context'
import { memberMerge } from './member-merge'

export type TeamPropsToBeExtracted = {
  puuid: string
  championId: number
  teamParticipantId: number
  selectedPosition: string
  selectedRole: string
}

type SummonerSpellSelection = {
  puuid: string
  spell1Id: number
  spell2Id: number
}

type AdditionalInfoQueryResult = {
  teamOne: TeamPropsToBeExtracted[]
  teamTwo: TeamPropsToBeExtracted[]
  spells: SummonerSpellSelection[]
  gameMode: string
}

export function extractTeamMembers(
  gameMode: string,
  teamOne: TeamPropsToBeExtracted[],
  teamTwo: TeamPropsToBeExtracted[],
  spells: SummonerSpellSelection[]
): AdditionalResult {
  const all = [...teamOne, ...teamTwo].filter((p) => p.puuid && p.puuid !== EMPTY_PUUID)

  if (gameMode === 'CHERRY') {
    return {
      teams: {
        'TEAM-ALL': all.map((p) => p.puuid)
      },
      selections: all.reduce(
        (acc, p) => {
          acc[p.puuid] = p.championId
          return acc
        },
        {} as Record<string, number>
      ),
      teamParticipantGroups: all.reduce(
        (acc, p) => {
          acc[p.puuid] = p.teamParticipantId
          return acc
        },
        {} as Record<string, number>
      ),
      spells: spells.reduce(
        (acc, p) => {
          acc[p.puuid] = { spell1Id: p.spell1Id, spell2Id: p.spell2Id }
          return acc
        },
        {} as Record<string, { spell1Id: number; spell2Id: number }>
      ),
      positions: all.reduce(
        (acc, p) => {
          acc[p.puuid] = {
            position: p.selectedPosition,
            role: parseSelectedRole(p.selectedRole)
          }
          return acc
        },
        {} as Record<string, { position: string; role: ParsedRole | null }>
      )
    }
  }

  return {
    teams: {
      'TEAM-100': teamOne.map((p) => p.puuid).filter((p) => p && p !== EMPTY_PUUID),
      'TEAM-200': teamTwo.map((p) => p.puuid).filter((p) => p && p !== EMPTY_PUUID)
    },
    selections: all.reduce(
      (acc, p) => {
        acc[p.puuid] = p.championId
        return acc
      },
      {} as Record<string, number>
    ),
    teamParticipantGroups: all.reduce(
      (acc, p) => {
        if (!p.teamParticipantId) {
          return acc
        }

        acc[p.puuid] = p.teamParticipantId
        return acc
      },
      {} as Record<string, number>
    ),
    spells: spells.reduce(
      (acc, p) => {
        acc[p.puuid] = { spell1Id: p.spell1Id, spell2Id: p.spell2Id }
        return acc
      },
      {} as Record<string, { spell1Id: number; spell2Id: number }>
    ),
    positions: all.reduce(
      (acc, p) => {
        acc[p.puuid] = { position: p.selectedPosition, role: parseSelectedRole(p.selectedRole) }
        return acc
      },
      {} as Record<string, { position: string; role: ParsedRole | null }>
    )
  } as AdditionalResult
}

export class OngoingGameAdditionalInfoController {
  constructor(private readonly _context: OngoingGameMainContext) {}

  watch() {
    const { leagueClient, mobxUtils, state } = this._context

    mobxUtils.reaction(
      () => ({
        queryStage: state.queryStage,
        selfPuuid: leagueClient.data.summoner.me?.puuid,
        draft: state.draft
      }),
      () => {
        this.update()
      },
      { delay: 300, equals: comparer.structural, fireImmediately: true }
    )
  }

  update() {
    const { leagueClient, queueKeeper, remoteConfig, state } = this._context

    if (
      state.draft ||
      !state.queryStage.gameInfo ||
      state.queryStage.phase !== 'in-game' ||
      !leagueClient.data.summoner.me?.puuid
    ) {
      queueKeeper.cancelByTags(['gsm-gameflow'], 'or')
      state.clearAdditional()
      return
    }

    queueKeeper.cancelByTags(['gsm-gameflow'], 'or')

    const puuid = leagueClient.data.summoner.me.puuid

    const tasks: (() => Promise<AdditionalInfoQueryResult | null>)[] = []

    if (remoteConfig.state.ongoingGameConfig.spotlight.gsmByPuuid) {
      tasks.push(() => this._getGsmGameMembers(puuid))
    }

    Promise.allSettled(tasks.map((t) => t())).then((results) => {
      if (state.draft || state.queryStage.phase !== 'in-game') {
        return
      }

      const mergedTeams = {} as Record<string, string[]>
      const mergedSelections = {} as Record<string, number>
      const mergedTeamParticipantGroups = {} as Record<string, number>
      const mergedSpells = {} as Record<
        string,
        {
          spell1Id: number
          spell2Id: number
        }
      >
      const mergedPositions = {} as Record<string, { position: string; role: ParsedRole | null }>

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const { teamOne, teamTwo, gameMode, spells } = result.value
          const { teams, selections, teamParticipantGroups, positions } = extractTeamMembers(
            gameMode,
            teamOne,
            teamTwo,
            spells
          )

          for (const [tI, m] of Object.entries(teams)) {
            if (mergedTeams[tI]) {
              mergedTeams[tI] = memberMerge(mergedTeams[tI], m)
            } else {
              mergedTeams[tI] = m
            }
          }

          Object.assign(mergedSelections, selections)
          Object.assign(mergedTeamParticipantGroups, teamParticipantGroups)
          Object.assign(mergedSpells, spells)
          Object.assign(mergedPositions, positions)
        }
      }

      state.setAdditional({
        teams: mergedTeams,
        selections: mergedSelections,
        teamParticipantGroups: mergedTeamParticipantGroups,
        spells: mergedSpells,
        positions: mergedPositions
      })
    })
  }

  private async _getGsmGameMembers(puuid: string): Promise<AdditionalInfoQueryResult | null> {
    const { logger, queueKeeper, sgp } = this._context

    try {
      if (queueKeeper.hasTask('gsm-gameflow')) {
        logger.debug('Game members already in queue', puuid)
        return null
      }

      const {
        data: {
          game: { teamOne, teamTwo, gameMode, playerChampionSelections }
        }
      } = await queueKeeper.add(
        'misc',
        `gsm-gameflow:${puuid}`,
        () => sgp.api.gsm.getByPuuid(puuid),
        {
          priority: ONGOING_GAME_LOADING_PRIORITY.ADDITIONAL_INFO,
          tags: [puuid, 'gsm-gameflow']
        }
      )

      logger.info('additional team info by gsm game')

      return { teamOne, teamTwo, gameMode, spells: playerChampionSelections }
    } catch (error) {
      if (isAbortError(error)) {
        logger.info('Abort error getting game members', error)
        return null
      }

      if (isAxiosError(error) && error.response?.status === 404) {
        return null
      }

      logger.warn('Error getting game members', error)
      return null
    }
  }
}
