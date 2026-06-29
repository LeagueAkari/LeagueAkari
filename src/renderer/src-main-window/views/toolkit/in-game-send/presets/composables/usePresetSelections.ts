import {
  PREMADE_TEAMS,
  PREMADE_TEAM_COLORS,
  PREMADE_TEAM_COLORS_LIGHT
} from '@renderer-shared/components/ongoing-game-panel/constants'
import { getTeamIndicatorColorClass } from '@renderer-shared/components/ongoing-game-panel/utils/theme'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import i18next from 'i18next'
import { useTranslation } from 'i18next-vue'
import { type ComputedRef, computed } from 'vue'

import type {
  InGameSendPlayer,
  InGameSendTeam,
  PremadeBucket,
  PremadeColors,
  PremadeTeamView
} from '../types'

export interface PlayerSelectionPresetContext {
  teams: ComputedRef<InGameSendTeam[]>
  totalCount: ComputedRef<number>
  selectedCount: ComputedRef<number>
  selectedInTeam: (teamIdentifier: string) => number
  isTeamAllSelected: (teamIdentifier: string) => boolean
  isTeamIndeterminate: (teamIdentifier: string) => boolean
  isPlayerSelected: (puuid: string) => boolean
  setTeamSelected: (teamIdentifier: string, selected: boolean) => void
  setPlayerSelected: (puuid: string, selected: boolean) => void
  setAllSelected: (selected: boolean) => void
}

export interface PremadeSelectionPresetContext {
  totalCount: ComputedRef<number>
  teams: ComputedRef<PremadeTeamView[]>
  selectedGroupCount: ComputedRef<number>
  totalGroupCount: ComputedRef<number>
  colors: ComputedRef<PremadeColors>
  isBucketSelected: (groupIndex: number) => boolean
  setBucketSelected: (groupIndex: number, selected: boolean) => void
  setAllSelected: (selected: boolean) => void
  isTeamAllSelected: (teamIdentifier: string) => boolean
  isTeamIndeterminate: (teamIdentifier: string) => boolean
  setTeamSelected: (teamIdentifier: string, selected: boolean) => void
}

function getTeamIdentifierSortValue(teamIdentifier: string) {
  if (teamIdentifier === 'TEAM-100') return 100
  if (teamIdentifier === 'TEAM-200') return 200

  const cherrySubteam = teamIdentifier.match(/^CHERRY-(\d+)$/)
  if (cherrySubteam) {
    return 1000 + Number(cherrySubteam[1])
  }

  return Number.MAX_SAFE_INTEGER
}

function compareTeamIdentifiers(
  teamIdentifierA: string,
  teamIdentifierB: string,
  selfTeamIdentifier: string | null
) {
  if (selfTeamIdentifier) {
    if (teamIdentifierA === selfTeamIdentifier) return -1
    if (teamIdentifierB === selfTeamIdentifier) return 1
  }

  const sortA = getTeamIdentifierSortValue(teamIdentifierA)
  const sortB = getTeamIdentifierSortValue(teamIdentifierB)

  if (sortA !== sortB) {
    return sortA - sortB
  }

  return teamIdentifierA.localeCompare(teamIdentifierB)
}

export function useInGameSendTeams() {
  const { t } = useTranslation()
  const ongoingGameStore = useOngoingGameStore()
  const leagueClientStore = useLeagueClientStore()

  function getTeamName(teamIdentifier: string) {
    const commonTeamKey = `teams.${teamIdentifier}`

    if (i18next.exists(commonTeamKey, { ns: 'common' })) {
      return t(commonTeamKey, { ns: 'common' })
    }

    return teamIdentifier
  }

  function getTeamLabels(teamIdentifier: string, selfTeamIdentifier: string | null) {
    const teamName = getTeamName(teamIdentifier)

    if (!selfTeamIdentifier) {
      return {
        label: teamName,
        primaryLabel: teamName
      }
    }

    const primaryLabel =
      teamIdentifier === selfTeamIdentifier
        ? t('toolkit.inGameSend.presets.teams.friendly', { ns: 'renderer' })
        : t('toolkit.inGameSend.presets.teams.enemy', { ns: 'renderer' })

    return {
      label: t('toolkit.inGameSend.presets.teams.labelWithName', {
        ns: 'renderer',
        side: primaryLabel,
        team: teamName
      }),
      primaryLabel,
      secondaryLabel: teamName
    }
  }

  const teams = computed<InGameSendTeam[]>(() => {
    const selfPuuid = leagueClientStore.summoner.me?.puuid
    const ongoingGameTeams = ongoingGameStore.teams
    const selfTeamEntry = selfPuuid
      ? Object.entries(ongoingGameTeams).find(([, puuids]) => puuids.includes(selfPuuid))
      : null
    const selfTeamIdentifier = selfTeamEntry?.[0] ?? null
    const championSelections = ongoingGameStore.championSelections

    const buildPlayer = (puuid: string): InGameSendPlayer => {
      const summoner = ongoingGameStore.summoner[puuid]
      const hasChampionSelection = Object.prototype.hasOwnProperty.call(championSelections, puuid)
      const championId = hasChampionSelection ? championSelections[puuid] : -1
      const premadeGroup = ongoingGameStore.mergedPremadeTeamMap[puuid] || undefined

      return {
        puuid,
        championId,
        hasChampionSelection,
        profileIconId: summoner?.profileIconId || 29,
        gameName: summoner?.gameName || summoner?.displayName || puuid.slice(0, 6),
        tagLine: summoner?.tagLine || '',
        premadeGroup
      }
    }

    return Object.entries(ongoingGameTeams)
      .toSorted(([teamIdentifierA], [teamIdentifierB]) => {
        return compareTeamIdentifiers(teamIdentifierA, teamIdentifierB, selfTeamIdentifier)
      })
      .map(([teamIdentifier, puuids]) => {
        const labels = getTeamLabels(teamIdentifier, selfTeamIdentifier)

        return {
          teamIdentifier,
          ...labels,
          indicatorColorClass: getTeamIndicatorColorClass(teamIdentifier),
          players: puuids.map(buildPlayer)
        }
      })
  })

  const teamsWithPlayers = computed(() => teams.value.filter((team) => team.players.length > 0))
  const allPuuids = computed(() =>
    teamsWithPlayers.value.flatMap((team) => team.players.map((player) => player.puuid))
  )

  return {
    isOngoingGameDraft: computed(() => Boolean(ongoingGameStore.draft)),
    teamsWithPlayers,
    allPuuids,
    totalCount: computed(() => allPuuids.value.length)
  }
}

interface UsePlayerSelectionOptions {
  teamsWithPlayers: ComputedRef<InGameSendTeam[]>
  allPuuids: ComputedRef<string[]>
  totalCount: ComputedRef<number>
  selectedPuuids: ComputedRef<string[]>
  setSelectedPuuids: (puuids: string[]) => void | Promise<void>
}

export function usePlayerSelection({
  teamsWithPlayers,
  allPuuids,
  totalCount,
  selectedPuuids,
  setSelectedPuuids
}: UsePlayerSelectionOptions): PlayerSelectionPresetContext {
  const selectedPlayerPuuidSet = computed(() => new Set(selectedPuuids.value))

  function normalizeSelectedPuuids(puuids: Iterable<string>) {
    const selected = new Set(puuids)
    return allPuuids.value.filter((puuid) => selected.has(puuid))
  }

  function commitSelectedPuuids(puuids: Iterable<string>) {
    void setSelectedPuuids(normalizeSelectedPuuids(puuids))
  }

  const selectedCount = computed(() => {
    const selected = selectedPlayerPuuidSet.value
    return allPuuids.value.reduce((acc, puuid) => acc + (selected.has(puuid) ? 1 : 0), 0)
  })

  function teamOf(teamIdentifier: string) {
    return teamsWithPlayers.value.find((team) => team.teamIdentifier === teamIdentifier)
  }

  function selectedInTeam(teamIdentifier: string) {
    const team = teamOf(teamIdentifier)
    if (!team) return 0

    const selected = selectedPlayerPuuidSet.value

    return team.players.reduce((acc, player) => acc + (selected.has(player.puuid) ? 1 : 0), 0)
  }

  function isTeamAllSelected(teamIdentifier: string) {
    const team = teamOf(teamIdentifier)
    if (!team || team.players.length === 0) {
      return false
    }

    const selected = selectedPlayerPuuidSet.value
    return team.players.every((player) => selected.has(player.puuid))
  }

  function isTeamIndeterminate(teamIdentifier: string) {
    const team = teamOf(teamIdentifier)
    if (!team) return false

    const teamSelectedCount = selectedInTeam(teamIdentifier)

    return teamSelectedCount > 0 && teamSelectedCount < team.players.length
  }

  function isPlayerSelected(puuid: string) {
    return selectedPlayerPuuidSet.value.has(puuid)
  }

  function setPlayerSelected(puuid: string, selected: boolean) {
    const next = new Set(selectedPlayerPuuidSet.value)

    if (selected) {
      next.add(puuid)
    } else {
      next.delete(puuid)
    }

    commitSelectedPuuids(next)
  }

  function setTeamSelected(teamIdentifier: string, selected: boolean) {
    const team = teamOf(teamIdentifier)
    if (!team) return

    const next = new Set(selectedPlayerPuuidSet.value)
    for (const player of team.players) {
      if (selected) {
        next.add(player.puuid)
      } else {
        next.delete(player.puuid)
      }
    }

    commitSelectedPuuids(next)
  }

  function setAllSelected(selected: boolean) {
    commitSelectedPuuids(selected ? allPuuids.value : [])
  }

  return {
    teams: teamsWithPlayers,
    totalCount,
    selectedCount,
    selectedInTeam,
    isTeamAllSelected,
    isTeamIndeterminate,
    isPlayerSelected,
    setTeamSelected,
    setPlayerSelected,
    setAllSelected
  }
}

interface UsePremadeSelectionOptions {
  teamsWithPlayers: ComputedRef<InGameSendTeam[]>
  totalCount: ComputedRef<number>
  selectedIndices: ComputedRef<number[]>
  setSelectedIndices: (indices: number[]) => void | Promise<void>
}

export function usePremadeSelection({
  teamsWithPlayers,
  totalCount,
  selectedIndices,
  setSelectedIndices
}: UsePremadeSelectionOptions): PremadeSelectionPresetContext {
  const appCommonStore = useAppCommonStore()

  const colors = computed<PremadeColors>(() => {
    return (
      appCommonStore.colorTheme === 'dark' ? PREMADE_TEAM_COLORS : PREMADE_TEAM_COLORS_LIGHT
    ) as PremadeColors
  })

  const teams = computed<PremadeTeamView[]>(() => {
    return teamsWithPlayers.value.map((team) => {
      const byGroup = new Map<number, InGameSendPlayer[]>()
      for (const player of team.players) {
        if (player.premadeGroup == null) continue

        const players = byGroup.get(player.premadeGroup) ?? []
        players.push(player)
        byGroup.set(player.premadeGroup, players)
      }

      const groups: PremadeBucket[] = []
      for (const [groupIndex, players] of [...byGroup.entries()].sort((a, b) => a[0] - b[0])) {
        if (players.length < 2) continue

        groups.push({
          key: `${team.teamIdentifier}:g:${groupIndex}`,
          groupIndex,
          groupLetter: PREMADE_TEAMS[groupIndex - 1],
          players
        })
      }

      return { team, groups }
    })
  })

  const allGroupIndices = computed(() =>
    teams.value.flatMap((teamView) => teamView.groups.map((bucket) => bucket.groupIndex))
  )
  const totalGroupCount = computed(() => allGroupIndices.value.length)
  const selectedIndexSet = computed(() => new Set(selectedIndices.value))

  function normalizeSelectedIndices(indices: Iterable<number>) {
    const selected = new Set(indices)
    return allGroupIndices.value.filter((index) => selected.has(index))
  }

  function commitSelectedIndices(indices: Iterable<number>) {
    void setSelectedIndices(normalizeSelectedIndices(indices))
  }

  const selectedGroupCount = computed(() => {
    const selected = selectedIndexSet.value
    return allGroupIndices.value.reduce((acc, index) => acc + (selected.has(index) ? 1 : 0), 0)
  })

  function isBucketSelected(groupIndex: number) {
    return selectedIndexSet.value.has(groupIndex)
  }

  function setBucketSelected(groupIndex: number, selected: boolean) {
    const next = new Set(selectedIndexSet.value)

    if (selected) {
      next.add(groupIndex)
    } else {
      next.delete(groupIndex)
    }

    commitSelectedIndices(next)
  }

  function setAllSelected(selected: boolean) {
    commitSelectedIndices(selected ? allGroupIndices.value : [])
  }

  function indicesOfTeam(teamIdentifier: string) {
    const teamView = teams.value.find((item) => item.team.teamIdentifier === teamIdentifier)
    return teamView ? teamView.groups.map((group) => group.groupIndex) : []
  }

  function isTeamAllSelected(teamIdentifier: string) {
    const indices = indicesOfTeam(teamIdentifier)
    const selected = selectedIndexSet.value

    return indices.length > 0 && indices.every((index) => selected.has(index))
  }

  function isTeamIndeterminate(teamIdentifier: string) {
    const indices = indicesOfTeam(teamIdentifier)
    const selected = selectedIndexSet.value
    const teamSelectedCount = indices.reduce((acc, index) => acc + (selected.has(index) ? 1 : 0), 0)

    return teamSelectedCount > 0 && teamSelectedCount < indices.length
  }

  function setTeamSelected(teamIdentifier: string, selected: boolean) {
    const next = new Set(selectedIndexSet.value)
    for (const index of indicesOfTeam(teamIdentifier)) {
      if (selected) {
        next.add(index)
      } else {
        next.delete(index)
      }
    }

    commitSelectedIndices(next)
  }

  return {
    totalCount,
    teams,
    selectedGroupCount,
    totalGroupCount,
    colors,
    isBucketSelected,
    setBucketSelected,
    setAllSelected,
    isTeamAllSelected,
    isTeamIndeterminate,
    setTeamSelected
  }
}
