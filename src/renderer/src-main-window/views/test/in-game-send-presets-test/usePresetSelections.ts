import {
  PREMADE_TEAMS,
  PREMADE_TEAM_COLORS,
  PREMADE_TEAM_COLORS_LIGHT
} from '@renderer-shared/components/ongoing-game-panel/constants'
import { getTeamIndicatorColorClass } from '@renderer-shared/components/ongoing-game-panel/utils/theme'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import type { InGameSendRenderer } from '@renderer-shared/shards/in-game-send'
import { useInGameSendStore } from '@renderer-shared/shards/in-game-send/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import i18next from 'i18next'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import type {
  DemoPlayer,
  DemoTeam,
  PlayerSelectionPresetId,
  PremadeBucket,
  PremadeColors,
  PremadeTeamView,
  PresetId
} from './types'

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

function isPlayerSelectionPresetId(presetId: PresetId): presetId is PlayerSelectionPresetId {
  return presetId === 'rating' || presetId === 'jungle'
}

export function usePresetSelections(ig: InGameSendRenderer) {
  const { t } = useTranslation()
  const ogs = useOngoingGameStore()
  const lcs = useLeagueClientStore()
  const as = useAppCommonStore()
  const igs = useInGameSendStore()

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

    const primaryLabel = teamId === selfTeamId ? '我方' : '敌方'

    return {
      label: `${primaryLabel} · ${teamName}`,
      primaryLabel,
      secondaryLabel: teamName
    }
  }

  const teams = computed<DemoTeam[]>(() => {
    const selfPuuid = lcs.summoner.me?.puuid
    const ogsTeams = ogs.teams
    const selfTeamEntry = selfPuuid
      ? Object.entries(ogsTeams).find(([, puuids]) => puuids.includes(selfPuuid))
      : null
    const selfTeamId = selfTeamEntry?.[0] ?? null

    const buildPlayer = (puuid: string): DemoPlayer => {
      const summoner = ogs.summoner[puuid]
      const championId = ogs.championSelections[puuid] ?? 0
      const premadeGroup = ogs.mergedPremadeTeamMap[puuid] || undefined
      return {
        puuid,
        championId,
        gameName: summoner?.gameName || summoner?.displayName || puuid.slice(0, 6),
        tagLine: summoner?.tagLine || '',
        premadeGroup
      }
    }

    return Object.entries(ogsTeams)
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
  const totalCount = computed(() => allPuuids.value.length)

  const selectedPlayerPuuidSets = computed<Record<PlayerSelectionPresetId, Set<string>>>(() => ({
    rating: new Set(igs.state.ratingPuuids),
    jungle: new Set(igs.state.junglePuuids)
  }))

  function selectedPlayerPuuidSet(presetId: PresetId) {
    return isPlayerSelectionPresetId(presetId)
      ? selectedPlayerPuuidSets.value[presetId]
      : new Set<string>()
  }

  function normalizeSelectedPuuids(puuids: Iterable<string>) {
    const selected = new Set(puuids)
    return allPuuids.value.filter((puuid) => selected.has(puuid))
  }

  function commitSelectedPuuids(presetId: PresetId, puuids: Iterable<string>) {
    if (!isPlayerSelectionPresetId(presetId)) {
      return
    }

    const normalized = normalizeSelectedPuuids(puuids)

    if (presetId === 'jungle') {
      void ig.setJunglePuuids(normalized)
    } else {
      void ig.setRatingPuuids(normalized)
    }
  }

  function selectedPlayerCount(presetId: PresetId) {
    const selected = selectedPlayerPuuidSet(presetId)
    return allPuuids.value.reduce((acc, puuid) => acc + (selected.has(puuid) ? 1 : 0), 0)
  }

  function isPlayerSelected(presetId: PresetId, puuid: string) {
    return selectedPlayerPuuidSet(presetId).has(puuid)
  }

  function setPlayerSelected(presetId: PresetId, puuid: string, selected: boolean) {
    const next = new Set(selectedPlayerPuuidSet(presetId))

    if (selected) {
      next.add(puuid)
    } else {
      next.delete(puuid)
    }

    commitSelectedPuuids(presetId, next)
  }

  function teamOf(teamId: string) {
    return teams.value.find((team) => team.id === teamId)
  }

  function selectedInTeam(presetId: PresetId, teamId: string) {
    const team = teamOf(teamId)
    if (!team) return 0
    const selected = selectedPlayerPuuidSet(presetId)
    return team.players.reduce((acc, player) => acc + (selected.has(player.puuid) ? 1 : 0), 0)
  }

  function isTeamAllSelected(presetId: PresetId, teamId: string) {
    const team = teamOf(teamId)
    if (!team || team.players.length === 0) {
      return false
    }

    const selected = selectedPlayerPuuidSet(presetId)
    return team.players.every((player) => selected.has(player.puuid))
  }

  function isTeamIndeterminate(presetId: PresetId, teamId: string) {
    const team = teamOf(teamId)
    if (!team) return false
    const selectedCount = selectedInTeam(presetId, teamId)
    return selectedCount > 0 && selectedCount < team.players.length
  }

  function setTeamSelected(presetId: PresetId, teamId: string, selected: boolean) {
    const team = teamOf(teamId)
    if (!team) return

    const next = new Set(selectedPlayerPuuidSet(presetId))
    for (const player of team.players) {
      if (selected) {
        next.add(player.puuid)
      } else {
        next.delete(player.puuid)
      }
    }

    commitSelectedPuuids(presetId, next)
  }

  function setAllSelected(presetId: PresetId, selected: boolean) {
    commitSelectedPuuids(presetId, selected ? allPuuids.value : [])
  }

  const premadeColors = computed<PremadeColors>(() => {
    return (
      as.colorTheme === 'dark' ? PREMADE_TEAM_COLORS : PREMADE_TEAM_COLORS_LIGHT
    ) as PremadeColors
  })

  const premadeView = computed<PremadeTeamView[]>(() => {
    return teamsWithPlayers.value.map((team) => {
      const byGroup = new Map<number, DemoPlayer[]>()
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

  const allPremadeGroupIndices = computed(() =>
    premadeView.value.flatMap((teamView) => teamView.groups.map((bucket) => bucket.groupIndex))
  )
  const totalPremadeGroupCount = computed(() => allPremadeGroupIndices.value.length)

  const selectedPremadeIndexSet = computed(() => new Set(igs.state.premadeIndices))

  function normalizeSelectedPremadeIndices(indices: Iterable<number>) {
    const selected = new Set(indices)
    return allPremadeGroupIndices.value.filter((index) => selected.has(index))
  }

  function commitSelectedPremadeIndices(indices: Iterable<number>) {
    void ig.setPremadeIndices(normalizeSelectedPremadeIndices(indices))
  }

  const selectedPremadeGroupCount = computed(() => {
    const selected = selectedPremadeIndexSet.value
    return allPremadeGroupIndices.value.reduce(
      (acc, index) => acc + (selected.has(index) ? 1 : 0),
      0
    )
  })

  function isPremadeBucketSelected(groupIndex: number) {
    return selectedPremadeIndexSet.value.has(groupIndex)
  }

  function setPremadeBucketSelected(groupIndex: number, selected: boolean) {
    const next = new Set(selectedPremadeIndexSet.value)

    if (selected) {
      next.add(groupIndex)
    } else {
      next.delete(groupIndex)
    }

    commitSelectedPremadeIndices(next)
  }

  function setAllPremadeSelected(selected: boolean) {
    commitSelectedPremadeIndices(selected ? allPremadeGroupIndices.value : [])
  }

  function premadeIndicesOfTeam(teamId: string) {
    const teamView = premadeView.value.find((item) => item.team.id === teamId)
    return teamView ? teamView.groups.map((group) => group.groupIndex) : []
  }

  function isPremadeTeamAllSelected(teamId: string) {
    const indices = premadeIndicesOfTeam(teamId)
    const selected = selectedPremadeIndexSet.value
    return indices.length > 0 && indices.every((index) => selected.has(index))
  }

  function isPremadeTeamIndeterminate(teamId: string) {
    const indices = premadeIndicesOfTeam(teamId)
    const selected = selectedPremadeIndexSet.value
    const selectedCount = indices.reduce((acc, index) => acc + (selected.has(index) ? 1 : 0), 0)
    return selectedCount > 0 && selectedCount < indices.length
  }

  function setPremadeTeamSelected(teamId: string, selected: boolean) {
    const next = new Set(selectedPremadeIndexSet.value)
    for (const index of premadeIndicesOfTeam(teamId)) {
      if (selected) {
        next.add(index)
      } else {
        next.delete(index)
      }
    }
    commitSelectedPremadeIndices(next)
  }

  return {
    isOngoingGameDraft: computed(() => Boolean(ogs.draft)),
    teamsWithPlayers,
    totalCount,
    selectedPlayerCount,
    isPlayerSelected,
    setPlayerSelected,
    selectedInTeam,
    isTeamAllSelected,
    isTeamIndeterminate,
    setTeamSelected,
    setAllSelected,
    premadeColors,
    premadeView,
    selectedPremadeGroupCount,
    totalPremadeGroupCount,
    isPremadeBucketSelected,
    setPremadeBucketSelected,
    setAllPremadeSelected,
    isPremadeTeamAllSelected,
    isPremadeTeamIndeterminate,
    setPremadeTeamSelected
  }
}
