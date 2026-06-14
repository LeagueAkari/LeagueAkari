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
  selectedInTeam: (teamId: string) => number
  isTeamAllSelected: (teamId: string) => boolean
  isTeamIndeterminate: (teamId: string) => boolean
  isPlayerSelected: (puuid: string) => boolean
  setTeamSelected: (teamId: string, selected: boolean) => void
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
  isTeamAllSelected: (teamId: string) => boolean
  isTeamIndeterminate: (teamId: string) => boolean
  setTeamSelected: (teamId: string, selected: boolean) => void
}

function getTeamSortValue(teamId: string) {
  if (teamId === 'TEAM-100') return 100
  if (teamId === 'TEAM-200') return 200

  const cherrySubteam = teamId.match(/^CHERRY-(\d+)$/)
  if (cherrySubteam) {
    return 1000 + Number(cherrySubteam[1])
  }

  return Number.MAX_SAFE_INTEGER
}

function compareTeamIds(teamIdA: string, teamIdB: string, selfTeamId: string | null) {
  if (selfTeamId) {
    if (teamIdA === selfTeamId) return -1
    if (teamIdB === selfTeamId) return 1
  }

  const sortA = getTeamSortValue(teamIdA)
  const sortB = getTeamSortValue(teamIdB)

  if (sortA !== sortB) {
    return sortA - sortB
  }

  return teamIdA.localeCompare(teamIdB)
}

export function useInGameSendTeams() {
  const { t } = useTranslation()
  const ongoingGameStore = useOngoingGameStore()
  const leagueClientStore = useLeagueClientStore()

  function getTeamName(teamId: string) {
    const commonTeamKey = `teams.${teamId}`

    if (i18next.exists(commonTeamKey, { ns: 'common' })) {
      return t(commonTeamKey, { ns: 'common' })
    }

    return teamId
  }

  function getTeamLabels(teamId: string, selfTeamId: string | null) {
    const teamName = getTeamName(teamId)

    if (!selfTeamId) {
      return {
        label: teamName,
        primaryLabel: teamName
      }
    }

    const primaryLabel =
      teamId === selfTeamId
        ? t('InGameSend.presets.teams.friendly', { ns: 'renderer' })
        : t('InGameSend.presets.teams.enemy', { ns: 'renderer' })

    return {
      label: t('InGameSend.presets.teams.labelWithName', {
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
    const selfTeamId = selfTeamEntry?.[0] ?? null
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
      .toSorted(([teamIdA], [teamIdB]) => {
        return compareTeamIds(teamIdA, teamIdB, selfTeamId)
      })
      .map(([teamId, puuids]) => {
        const labels = getTeamLabels(teamId, selfTeamId)

        return {
          id: teamId,
          ...labels,
          indicatorColorClass: getTeamIndicatorColorClass(teamId),
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

  function teamOf(teamId: string) {
    return teamsWithPlayers.value.find((team) => team.id === teamId)
  }

  function selectedInTeam(teamId: string) {
    const team = teamOf(teamId)
    if (!team) return 0

    const selected = selectedPlayerPuuidSet.value

    return team.players.reduce((acc, player) => acc + (selected.has(player.puuid) ? 1 : 0), 0)
  }

  function isTeamAllSelected(teamId: string) {
    const team = teamOf(teamId)
    if (!team || team.players.length === 0) {
      return false
    }

    const selected = selectedPlayerPuuidSet.value
    return team.players.every((player) => selected.has(player.puuid))
  }

  function isTeamIndeterminate(teamId: string) {
    const team = teamOf(teamId)
    if (!team) return false

    const teamSelectedCount = selectedInTeam(teamId)

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

  function setTeamSelected(teamId: string, selected: boolean) {
    const team = teamOf(teamId)
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
          key: `${team.id}:g:${groupIndex}`,
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

  function indicesOfTeam(teamId: string) {
    const teamView = teams.value.find((item) => item.team.id === teamId)
    return teamView ? teamView.groups.map((group) => group.groupIndex) : []
  }

  function isTeamAllSelected(teamId: string) {
    const indices = indicesOfTeam(teamId)
    const selected = selectedIndexSet.value

    return indices.length > 0 && indices.every((index) => selected.has(index))
  }

  function isTeamIndeterminate(teamId: string) {
    const indices = indicesOfTeam(teamId)
    const selected = selectedIndexSet.value
    const teamSelectedCount = indices.reduce((acc, index) => acc + (selected.has(index) ? 1 : 0), 0)

    return teamSelectedCount > 0 && teamSelectedCount < indices.length
  }

  function setTeamSelected(teamId: string, selected: boolean) {
    const next = new Set(selectedIndexSet.value)
    for (const index of indicesOfTeam(teamId)) {
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
