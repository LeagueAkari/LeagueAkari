<template>
  <div class="h-full" ref="viewContainer">
    <!-- teams template -->
    <DefineOngoingTeam v-slot="{ players, team, teamColor, teamName }">
      <div class="not-last:mb-4">
        <!-- header + tags -->
        <div class="mb-2 flex items-end">
          <div
            v-if="teamColor"
            :class="[
              'mr-2 size-[10px] self-center rounded-full border border-white/20',
              teamColor === 'red' ? 'bg-[#ff3333]' : '',
              teamColor === 'blue' ? 'bg-[#40c1ff]' : '',
              teamColor === 'white' ? 'bg-neutral-500 dark:bg-neutral-200' : ''
            ]"
          ></div>
          <span class="mr-3 text-base leading-tight font-bold">{{ teamName }}</span>
          <TeamTagsArea
            v-if="players.length >= 1"
            :side-id="team"
            :analysis="mapAnalysisTeamData(team)"
            :premade-info="mapPremadePlayers(team)"
            :summoners="mapSummoners(team)"
            :champion-selections="ogs.championSelections"
          />
        </div>

        <!-- players -->
        <div
          class="mt-1 grid gap-x-1 gap-y-2"
          :style="{ gridTemplateColumns: `repeat(${columnsNeed}, ${FIXED_CARD_WIDTH_PX_LITERAL})` }"
        >
          <PlayerInfoCard
            :class="{
              'h-[280px]': playerInfoCardHeightLevel === 1,
              'h-[320px]': playerInfoCardHeightLevel === 2,
              'h-[360px]': playerInfoCardHeightLevel === 3,
              'h-[400px]': playerInfoCardHeightLevel === 4,
              'h-[440px]': playerInfoCardHeightLevel === 5
            }"
            v-for="player of players"
            :puuid="player"
            :key="player"
            :is-self="player === lcs.summoner.me?.puuid"
            :champion-id="ogs.championSelections?.[player]"
            :match-history="ogs.matchHistory[player]?.data"
            :match-history-loading="ogs.matchHistoryLoadingState[player]"
            :summoner="ogs.summoner[player]"
            :ranked-stats="ogs.rankedStats[player]"
            :saved-info="ogs.savedInfo[player]"
            :champion-mastery="ogs.championMastery[player]"
            :analysis="ogs.playerStats?.players[player]"
            :position="ogs.positionAssignments?.[player]"
            :premade-team-id="premadeTeamInfo.premadeTeamIdMap[player]"
            :currentHighlightingPremadeTeamId="currentHighlightingPremadeTeamIdD"
            :kda-iqr="kdaOutliers?.[player]"
            :query-stage="ogs.queryStage"
            :queue-type="ogs.queryStage.gameInfo?.queueType"
            @show-game="emits('showGame', $event, player)"
            @show-game-by-id="emits('showGameById', $event, player)"
            @to-summoner="emits('toSummoner', $event)"
            @highlight="handleHighlightSubTeam"
            @reload="og.reloadPlayer"
          />
        </div>
      </div>
    </DefineOngoingTeam>

    <NScrollbar v-if="!isInIdleState" x-scrollable>
      <div class="relative m-auto h-full p-4" :class="{ 'w-fit': columnsNeed >= 4 }">
        <OngoingTeam
          v-for="(players, team) of sortedTeams"
          :team="team"
          :key="team"
          :players="players"
          :teamColor="mapTeamColor(team)"
          :teamName="formatTeamText(team)"
        />
      </div>
    </NScrollbar>

    <div v-else class="relative flex h-full">
      <div
        class="absolute top-[48%] left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4"
      >
        <template v-if="ogs.settings.enabled">
          <div
            v-if="lcs.connectionState !== 'connected'"
            class="text-base font-normal text-black/60 dark:text-white/80"
          >
            {{ t('OngoingGame.disconnected') }}
          </div>

          <div
            v-else-if="lcs.champSelect.session && lcs.champSelect.session.isSpectating"
            class="text-base font-normal text-black/60 dark:text-white/80"
          >
            {{ t('OngoingGame.waitingForSpectate') }}
          </div>

          <div v-else class="text-base font-normal text-black/60 dark:text-white/80">
            {{ t('OngoingGame.noOngoingGame') }}
          </div>
        </template>

        <div v-else class="text-base font-normal text-black/60 dark:text-white/80">
          {{ t('OngoingGame.disabled') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { MatchHistoryGamesAnalysisAll } from '@shared/data-adapter/analysis/players'
import { findOutliersByIqr } from '@shared/data-adapter/utils'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { createReusableTemplate, refDebounced, useElementSize } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NScrollbar } from 'naive-ui'
import { computed, ref, useTemplateRef } from 'vue'

import PlayerInfoCard from './PlayerInfoCard.vue'
import {
  FIXED_CARD_WIDTH_PX_LITERAL,
  FIXED_CARD_WIDTH_PX_NUMBER,
  PREMADE_TEAMS,
  useIdleState
} from './ongoing-game-utils'
import TeamTagsArea from './widgets/TeamTagsArea.vue'

const emits = defineEmits<{
  toSummoner: [puuid: string]
  showGame: [game: LcuOrSgpGameSummary, puuid: string]
  showGameById: [id: number, selfPuuid: string]
}>()

const lcs = useLeagueClientStore()

const { t } = useTranslation()

const og = useInstance(OngoingGameRenderer)
const ogs = useOngoingGameStore()

const isInIdleState = useIdleState()

const POSITION_ORDER = {
  NONE: 0,
  TOP: 1,
  MIDDLE: 3,
  JUNGLE: 2,
  BOTTOM: 4,
  UTILITY: 5
}

const sortedTeams = computed(() => {
  if (!ogs.teams) {
    return {}
  }

  const sorted: Record<string, string[]> = {}

  Object.entries(ogs.teams).forEach(([team, players]) => {
    if (!players.length) {
      return
    }

    sorted[team] = players.toSorted((a, b) => {
      if (ogs.settings.orderPlayerBy === 'position') {
        const pa = ogs.positionAssignments[a]?.position || 'NONE'
        const pb = ogs.positionAssignments[b]?.position || 'NONE'

        return POSITION_ORDER[pa] - POSITION_ORDER[pb]
      }

      if (ogs.settings.orderPlayerBy === 'premade-team') {
        const teamA = premadeTeamInfo.value.premadeTeamIdMap[a]
        const teamB = premadeTeamInfo.value.premadeTeamIdMap[b]

        if (teamA && teamB) {
          if (teamA !== teamB) {
            const sizeA = premadeTeamInfo.value.groups[teamA].length
            const sizeB = premadeTeamInfo.value.groups[teamB].length
            if (sizeA !== sizeB) {
              return sizeB - sizeA
            } else {
              return teamA.localeCompare(teamB)
            }
          } else {
            return 0
          }
        }

        if (teamA) {
          return -1
        }

        if (teamB) {
          return 1
        }

        return 0
      }

      const statsA = ogs.playerStats?.players[a]
      const statsB = ogs.playerStats?.players[b]

      if (ogs.settings.orderPlayerBy === 'akari-score') {
        return (statsB?.akariScore.total || 0) - (statsA?.akariScore.total || 0)
      }

      if (ogs.settings.orderPlayerBy === 'kda') {
        return (statsB?.summary.avgKda || 0) - (statsA?.summary.avgKda || 0)
      }

      if (ogs.settings.orderPlayerBy === 'win-rate') {
        return (statsB?.summary.winRate || 0) - (statsA?.summary.winRate || 0)
      }

      return 0
    })
  })

  return sorted
})

const premadeTeamInfo = computed(() => {
  if (ogs.queryStage.phase === 'lobby' || ogs.queryStage.phase === 'unavailable') {
    return {
      groups: {},
      premadeTeamIdMap: {}
    }
  }

  const playerMap: {
    groups: Record<string, string[]> // premadeId, puuids
    premadeTeamIdMap: Record<string, string> // puuid, premadeId (A, B, C, ...)
  } = {
    groups: {},
    premadeTeamIdMap: {}
  }

  let groupIndex = 0
  Object.entries(ogs.teamParticipantGroups).forEach(([_, groups]) => {
    if (groups.length < 2) {
      return
    }

    const groupId = PREMADE_TEAMS[groupIndex++]
    playerMap.groups[groupId] = groups
    groups.forEach((p) => {
      playerMap.premadeTeamIdMap[p] = groupId
    })
  })

  return playerMap
})

const formatTeamText = (teamIdentifier: string) => {
  return t(`teams.${teamIdentifier}`, { ns: 'common', defaultValue: teamIdentifier })
}

const mapTeamColor = (team: string) => {
  switch (team) {
    case 'TEAM-100':
      return 'blue'

    case 'TEAM-200':
      return 'red'

    case 'LOBBY':
      return 'white'

    default:
      return null
  }
}

const [DefineOngoingTeam, OngoingTeam] = createReusableTemplate<{
  players: string[]
  team: string
  teamColor: string | null
  teamName: string
}>({ inheritAttrs: false })

const currentHighlightingPremadeTeamId = ref<string | null>(null)
const currentHighlightingPremadeTeamIdD = refDebounced<string | null>(
  currentHighlightingPremadeTeamId,
  200
)

const handleHighlightSubTeam = (preMadeTeamId: string, highlight: boolean) => {
  if (highlight) {
    currentHighlightingPremadeTeamId.value = preMadeTeamId
  } else {
    currentHighlightingPremadeTeamId.value = null
  }
}

const IQR_THRESHOLD = 0.65
const kdaOutliers = computed(() => {
  if (!ogs.playerStats || Object.keys(ogs.playerStats.players).length < 5) {
    return null
  }

  const kdaList = Object.entries(ogs.playerStats.players).map(([puuid, p]) => ({
    puuid,
    kda: p.summary.avgKda
  }))

  const iqr = findOutliersByIqr(kdaList, (a) => a.kda, IQR_THRESHOLD)
  const result: Record<string, 'over' | 'below'> = {}

  iqr.over.forEach((a) => {
    result[a.puuid] = 'over'
  })

  iqr.below.forEach((a) => {
    result[a.puuid] = 'below'
  })

  return result
})

const mapAnalysisTeamData = (team: string) => {
  if (!ogs.playerStats) {
    return undefined
  }

  const members = ogs.teams[team]
  const teamAnalysis = ogs.playerStats.teams[team]

  if (members && teamAnalysis) {
    return {
      players: members.reduce(
        (prev, puuid) => {
          prev[puuid] = ogs.playerStats!.players[puuid]
          return prev
        },
        {} as Record<string, MatchHistoryGamesAnalysisAll>
      ),
      team: ogs.playerStats.teams[team]
    }
  }

  return undefined
}

const mapPremadePlayers = (team: string) => {
  const t = ogs.teams[team]
  if (!t) {
    return undefined
  }

  const thisTeamGroups: Record<string, string[]> = {}
  const thisTeamPremadeIds: Record<string, string> = {}
  Object.entries(premadeTeamInfo.value.groups).forEach(([premadeId, puuids]) => {
    const realPuuids = puuids.filter((p) => t.includes(p))

    if (realPuuids.length < 2) {
      return
    }

    thisTeamGroups[premadeId] = realPuuids
    realPuuids.forEach((p) => {
      thisTeamPremadeIds[p] = premadeId
    })
  })

  return {
    groups: thisTeamGroups,
    premadeTeamIdMap: thisTeamPremadeIds
  }
}

const mapSummoners = (team: string) => {
  const t = ogs.teams[team]
  if (!t) {
    return undefined
  }

  const thisTeamSummoners: Record<string, SummonerInfo> = {}
  Object.entries(ogs.summoner).forEach(([puuid, summoner]) => {
    if (t.includes(puuid)) {
      thisTeamSummoners[puuid] = summoner
    }
  })

  return thisTeamSummoners
}

const viewContainerEl = useTemplateRef('viewContainer')
const { width, height } = useElementSize(
  viewContainerEl,
  {
    width: 1024,
    height: 800
  },
  {}
)
const columnsNeed = computed(() => {
  const teamColumns = Object.values(ogs.teams || {})
    .map((t) => t.length)
    .reduce((a, b) => Math.max(a, b), 0)

  const maxAllowed = [8, 7, 6, 5, 4, 3].find(
    (col) => width.value > FIXED_CARD_WIDTH_PX_NUMBER * (col + 0.25)
  )

  return Math.min(maxAllowed || 2, teamColumns)
})

const playerInfoCardHeightLevel = computed(() => {
  if (height.value > 1000) {
    return 5
  }

  if (height.value > 900) {
    return 4
  }

  if (height.value > 820) {
    return 3
  }

  if (height.value > 740) {
    return 2
  }

  return 1
})
</script>
