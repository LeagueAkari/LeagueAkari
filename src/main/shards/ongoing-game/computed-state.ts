import { EMPTY_PUUID } from '@shared/constants/common'
import { ChampSelectTeam } from '@shared/types/league-client/champ-select'
import {
  AdditionalResult,
  DraftOptions,
  QueryStage,
  QueryStageDraft
} from '@shared/types/shards/ongoing-game'
import { decryptUuid } from '@shared/utils/puuid-decrypt'
import { ParsedRole, parseSelectedRole } from '@shared/utils/ranked'

import { LeagueClientData } from '../league-client/lc-state'
import { memberMerge } from './member-merge'

type OngoingGameSettingsLike = {
  enabled: boolean
  queryInLobbyPhase: boolean
}

type OngoingGameConfigLike = {
  spotlight: {
    deobfuscation: boolean
  }
}

export type PositionAssignments = Record<
  string,
  {
    position: string
    role: ParsedRole | null
  }
>

function shouldUseDeobfuscatedPuuid(member: ChampSelectTeam, config: OngoingGameConfigLike) {
  return (
    member.nameVisibilityType === 'HIDDEN' &&
    member.obfuscatedPuuid &&
    config.spotlight.deobfuscation
  )
}

function getVisibleChampSelectPuuid(member: ChampSelectTeam, config: OngoingGameConfigLike) {
  if (shouldUseDeobfuscatedPuuid(member, config)) {
    return decryptUuid(member.obfuscatedPuuid!)
  }

  if (!member.puuid || member.puuid === EMPTY_PUUID) {
    return null
  }

  return member.puuid
}

export function getDraftQueryStage(draft: DraftOptions): QueryStageDraft {
  return {
    phase: 'draft',
    gameInfo: {
      queueId: draft.queueId,
      queueType: draft.gameModeKind === 'cherry' ? 'CHERRY' : 'CLASSIC'
    }
  }
}

export function getDraftTeams(draft: DraftOptions) {
  return draft.teams
}

export function getDraftChampionSelections(draft: DraftOptions) {
  return draft.championSelections
}

export function getDraftPositionAssignments(draft: DraftOptions): PositionAssignments {
  if (!draft.positions) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(draft.positions).map(([puuid, assignment]) => [
      puuid,
      {
        position: assignment.selected.toUpperCase(),
        role: null
      }
    ])
  )
}

export function getLiveChampionSelections(args: {
  data: LeagueClientData
  queryStage: QueryStage
  additional: AdditionalResult
  config: OngoingGameConfigLike
}) {
  const { data, queryStage, additional, config } = args

  if (queryStage.phase === 'champ-select') {
    return getChampSelectChampionSelections(data, config)
  }

  if (queryStage.phase === 'in-game') {
    return getInGameChampionSelections(data, additional)
  }

  return {}
}

function getChampSelectChampionSelections(data: LeagueClientData, config: OngoingGameConfigLike) {
  if (!data.champSelect.session) {
    return {}
  }

  const selections: Record<string, number> = {}
  const processMember = (member: ChampSelectTeam) => {
    const puuid = getVisibleChampSelectPuuid(member, config)
    if (puuid) {
      selections[puuid] = member.championId || member.championPickIntent
    }
  }

  data.champSelect.session.myTeam.forEach(processMember)
  data.champSelect.session.theirTeam.forEach(processMember)

  return selections
}

function getInGameChampionSelections(data: LeagueClientData, additional: AdditionalResult) {
  if (!data.gameflow.session) {
    return {}
  }

  const selections: Record<string, number> = {}
  data.gameflow.session.gameData.playerChampionSelections.forEach((member) => {
    if (member.puuid && member.puuid !== EMPTY_PUUID) {
      selections[member.puuid] = member.championId
    }
  })

  data.gameflow.session.gameData.teamOne.forEach((member) => {
    if (member.championId) {
      selections[member.puuid] = member.championId
    }
  })

  data.gameflow.session.gameData.teamTwo.forEach((member) => {
    if (member.championId) {
      selections[member.puuid] = member.championId
    }
  })

  Object.assign(selections, additional.selections)
  return selections
}

export function getLivePositionAssignments(args: {
  data: LeagueClientData
  queryStage: QueryStage
  additional: AdditionalResult
  config: OngoingGameConfigLike
}): PositionAssignments {
  const { data, queryStage, additional, config } = args

  if (queryStage.phase === 'champ-select') {
    return getChampSelectPositionAssignments(data, config)
  }

  if (queryStage.phase === 'in-game') {
    return getInGamePositionAssignments(data, additional)
  }

  return {}
}

function getChampSelectPositionAssignments(
  data: LeagueClientData,
  config: OngoingGameConfigLike
): PositionAssignments {
  if (!data.champSelect.session) {
    return {}
  }

  const assignments: PositionAssignments = {}
  const processMember = (member: ChampSelectTeam) => {
    const puuid = getVisibleChampSelectPuuid(member, config)
    if (puuid) {
      assignments[puuid] = {
        position: member.assignedPosition.toUpperCase(),
        role: null
      }
    }
  }

  data.champSelect.session.myTeam.forEach(processMember)
  data.champSelect.session.theirTeam.forEach(processMember)

  return assignments
}

function getInGamePositionAssignments(
  data: LeagueClientData,
  additional: AdditionalResult
): PositionAssignments {
  if (!data.gameflow.session) {
    return {}
  }

  const assignments: PositionAssignments = {}
  data.gameflow.session.gameData.teamOne.forEach((member) => {
    if (member.puuid && member.puuid !== EMPTY_PUUID) {
      assignments[member.puuid] = {
        position: member.selectedPosition,
        role: parseSelectedRole(member.selectedRole)
      }
    }
  })

  data.gameflow.session.gameData.teamTwo.forEach((member) => {
    if (member.puuid && member.puuid !== EMPTY_PUUID) {
      assignments[member.puuid] = {
        position: member.selectedPosition,
        role: parseSelectedRole(member.selectedRole)
      }
    }
  })

  Object.assign(assignments, additional.positions)
  return assignments
}

export function getLiveTeams(args: {
  data: LeagueClientData
  settings: OngoingGameSettingsLike
  queryStage: QueryStage
  additional: AdditionalResult
  config: OngoingGameConfigLike
}) {
  const { data, settings, queryStage, additional, config } = args

  if (queryStage.phase === 'champ-select') {
    return getChampSelectTeams(data, queryStage, config)
  }

  if (queryStage.phase === 'in-game') {
    return getInGameTeams(data, queryStage, additional)
  }

  if (settings.queryInLobbyPhase && data.lobby.lobby) {
    return getLobbyTeams(data)
  }

  return {}
}

function getChampSelectTeams(
  data: LeagueClientData,
  queryStage: Extract<QueryStage, { phase: 'champ-select' }>,
  config: OngoingGameConfigLike
) {
  if (!data.champSelect.session) {
    return {}
  }

  if (queryStage.gameInfo.queueType === 'CHERRY') {
    return {
      'TEAM-ALL': [...data.champSelect.session.myTeam, ...data.champSelect.session.theirTeam]
        .map((member) => getVisibleChampSelectPuuid(member, config))
        .filter((puuid) => puuid !== null)
    }
  }

  const teams: Record<string, string[]> = {}
  const processMember = (member: ChampSelectTeam) => {
    const puuid = getVisibleChampSelectPuuid(member, config)
    if (!puuid) {
      return
    }

    const teamIdentifier = member.team === 100 || member.team === 1 ? 'TEAM-100' : 'TEAM-200'
    teams[teamIdentifier] ??= []
    teams[teamIdentifier].push(puuid)
  }

  data.champSelect.session.myTeam.forEach(processMember)
  data.champSelect.session.theirTeam.forEach(processMember)

  return teams
}

function getInGameTeams(
  data: LeagueClientData,
  queryStage: Extract<QueryStage, { phase: 'in-game' }>,
  additional: AdditionalResult
) {
  if (!data.gameflow.session || data.gameflow.session.phase === 'GameStart') {
    return {}
  }

  if (queryStage.gameInfo.queueType === 'CHERRY') {
    const realPlayers = data.gameflow.session.gameData.playerChampionSelections.map((c) => c.puuid)

    return {
      'TEAM-ALL': [
        ...data.gameflow.session.gameData.teamOne,
        ...data.gameflow.session.gameData.teamTwo
      ]
        .filter((member) => member.puuid && member.puuid !== EMPTY_PUUID)
        .filter((member) => realPlayers.includes(member.puuid))
        .map((member) => member.puuid)
    }
  }

  const teams: Record<string, string[]> = {
    'TEAM-100': [],
    'TEAM-200': []
  }

  data.gameflow.session.gameData.teamOne
    .filter((member) => member.puuid && member.puuid !== EMPTY_PUUID)
    .forEach((member) => teams['TEAM-100'].push(member.puuid))

  data.gameflow.session.gameData.teamTwo
    .filter((member) => member.puuid && member.puuid !== EMPTY_PUUID)
    .forEach((member) => teams['TEAM-200'].push(member.puuid))

  for (const [teamIdentifier, members] of Object.entries(additional.teams)) {
    teams[teamIdentifier] = teams[teamIdentifier]
      ? memberMerge(teams[teamIdentifier], members)
      : members
  }

  return teams
}

function getLobbyTeams(data: LeagueClientData) {
  const teams: Record<string, string[]> = { LOBBY: [] }

  data.lobby.lobby?.members.forEach((member) => {
    if (member.puuid && member.puuid !== EMPTY_PUUID) {
      teams.LOBBY.push(member.puuid)
    }
  })

  return teams
}

export function getLiveQueryStage(args: {
  data: LeagueClientData
  settings: OngoingGameSettingsLike
}): QueryStage {
  const { data, settings } = args

  if (!settings.enabled) {
    return getUnavailableQueryStage()
  }

  if (data.gameflow.session?.phase === 'ChampSelect' && data.champSelect.session) {
    return getGameflowQueryStage(data, 'champ-select')
  }

  if (isInGamePhase(data.gameflow.session?.phase)) {
    return getGameflowQueryStage(data, 'in-game')
  }

  if (settings.queryInLobbyPhase && data.lobby.lobby) {
    return {
      phase: 'lobby',
      gameInfo: {
        queueId: data.lobby.lobby.gameConfig.queueId,
        queueType: data.lobby.lobby.gameConfig.gameMode
      }
    }
  }

  return getUnavailableQueryStage()
}

function getUnavailableQueryStage(): QueryStage {
  return {
    phase: 'unavailable',
    gameInfo: null
  }
}

function isInGamePhase(phase?: string) {
  return (
    phase === 'GameStart' ||
    phase === 'InProgress' ||
    phase === 'WaitingForStats' ||
    phase === 'PreEndOfGame' ||
    phase === 'EndOfGame' ||
    phase === 'Reconnect'
  )
}

function getGameflowQueryStage(
  data: LeagueClientData,
  phase: 'champ-select' | 'in-game'
): QueryStage {
  return {
    phase,
    gameInfo: {
      queueId: data.gameflow.session!.gameData.queue.id,
      queueType: data.gameflow.session!.gameData.queue.type,
      gameId: data.gameflow.session!.gameData.gameId,
      gameMode: data.gameflow.session!.gameData.queue.gameMode
    }
  }
}

export function getLiveTeamParticipantGroups(args: {
  data: LeagueClientData
  additional: AdditionalResult
}) {
  const { data, additional } = args

  if (!data.gameflow.session) {
    return {}
  }

  const groups = getGameflowTeamParticipantGroups(data)
  mergeAdditionalTeamParticipantGroups(groups, additional)

  return groups
}

function getGameflowTeamParticipantGroups(data: LeagueClientData) {
  const groups: Record<string, string[]> = {}

  for (const member of [
    ...data.gameflow.session!.gameData.teamOne,
    ...data.gameflow.session!.gameData.teamTwo
  ]) {
    if (!member.teamParticipantId) {
      continue
    }

    groups[member.teamParticipantId] ??= []
    groups[member.teamParticipantId].push(member.puuid)
  }

  return groups
}

function mergeAdditionalTeamParticipantGroups(
  groups: Record<string, string[]>,
  additional: AdditionalResult
) {
  for (const [puuid, teamParticipantId] of Object.entries(additional.teamParticipantGroups)) {
    groups[teamParticipantId] ??= []

    if (!groups[teamParticipantId].includes(puuid)) {
      groups[teamParticipantId].push(puuid)
    }
  }
}
