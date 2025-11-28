<template>
  <div class="ongoing-game-view" ref="og-view-container">
    <DefineOngoingTeam v-slot="{ players, team, teamColor, teamName }">
      <div class="team-wrapper">
        <div class="team-header">
          <div class="team-header__team-color" :class="teamColor" v-if="teamColor"></div>
          <span class="team-header__title">{{ teamName }}</span>
          <TeamTagsArea
            class="team-header__team-tags"
            v-if="players.length >= 1"
            :side-id="team"
            :analysis="mapAnalysisTeamData(team)"
            :premade-info="mapPremadePlayers(team)"
            :summoners="mapSummoners(team)"
            :champion-selections="ogs.championSelections"
          />
        </div>
        <div class="team-members">
          <PlayerInfoCard
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
          />
        </div>
      </div>
    </DefineOngoingTeam>
    <NScrollbar v-if="!isInIdleState && ogs.settings.enabled" x-scrollable>
      <div class="inner-container" :class="{ 'fit-content': columnsNeed >= 4 }">
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
    <div v-else class="no-ongoing-game">
      <div class="centered">
        <LeagueAkariSpan bold class="akari-text" />
        <template v-if="ogs.settings.enabled">
          <template v-if="lcs.connectionState !== 'connected'">
            <span class="no-ongoing-game-text">{{ t('OngoingGame.disconnected') }}</span>
            <EasyToLaunch v-if="showEasyToLaunch" />
          </template>
          <template v-else-if="lcs.champSelect.session && lcs.champSelect.session.isSpectating">
            <span class="no-ongoing-game-text"> {{ t('OngoingGame.waitingForSpectate') }}</span>
          </template>
          <template v-else>
            <span class="no-ongoing-game-text"> {{ t('OngoingGame.noOngoingGame') }}</span>
          </template>
        </template>
        <span v-else class="no-ongoing-game-text">{{ t('OngoingGame.disabled') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import EasyToLaunch from '@renderer-shared/components/EasyToLaunch.vue'
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
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

const { showEasyToLaunch = true } = defineProps<{
  showEasyToLaunch?: boolean
}>()

const emits = defineEmits<{
  toSummoner: [puuid: string]
  showGame: [game: LcuOrSgpGameSummary, puuid: string]
  showGameById: [id: number, selfPuuid: string]
}>()

const lcs = useLeagueClientStore()

const { t } = useTranslation()

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

const { width } = useElementSize(useTemplateRef('og-view-container'))
const columnsNeed = computed(() => {
  const teamColumns = Object.values(ogs.teams || {})
    .map((t) => t.length)
    .reduce((a, b) => Math.max(a, b), 0)

  const maxAllowed = [8, 7, 6, 5, 4, 3].find(
    (col) => width.value > FIXED_CARD_WIDTH_PX_NUMBER * (col + 0.25)
  )

  return Math.min(maxAllowed || 2, teamColumns)
})
</script>

<style scoped>
.ongoing-game-view {
  height: 100%;
}

.inner-container {
  position: relative;
  height: 100%;
  margin: 0 auto;
  padding: 16px;

  .content {
    display: flex;
  }

  &.fit-content {
    width: fit-content;
  }
}

.team-members {
  display: grid;
  margin-top: 4px;
  grid-template-columns: repeat(v-bind(columnsNeed), v-bind(FIXED_CARD_WIDTH_PX_LITERAL));
  gap: 8px 4px;
}

.sora {
  height: 16px;
}

.team-header {
  display: flex;
  margin-bottom: 8px;
  align-items: flex-end;

  .team-header__team-color {
    align-self: center;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 8px;
    border: 1px solid rgb(255, 255, 255, 0.2);

    &.red {
      background-color: #ff3333;
    }

    &.blue {
      background-color: #40c1ff;
    }
  }

  .team-header__title {
    font-size: 16px;
    font-weight: bold;
    margin-right: 16px;
  }

  .analysis {
    display: flex;
    gap: 8px;
  }

  .win-rate {
    font-weight: bold;
  }
}

.team-wrapper {
  &:not(:last-child) {
    margin-bottom: 16px;
  }
}

.team-side-analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.no-ongoing-game {
  height: 100%;
  display: flex;
  position: relative;

  .akari-text {
    font-size: 22px;
  }

  .no-ongoing-game-text {
    font-size: 14px;
    font-weight: normal;
  }
}

.centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  top: 48%;
  left: 50%;
  transform: translate(-50%, -50%);
  gap: 16px;
}

[data-theme='dark'] {
  .team-header {
    .win-rate.gte-50 {
      color: #4cc69d;
    }

    .win-rate.lt-50 {
      color: #ff6161;
    }
  }

  .no-ongoing-game {
    .no-ongoing-game-text {
      color: rgba(255, 255, 255, 0.4);
    }
  }
}

[data-theme='light'] {
  .team-header {
    .win-rate.gte-50 {
      color: rgb(44, 140, 108);
    }

    .win-rate.lt-50 {
      color: rgb(204, 0, 0);
    }
  }

  .no-ongoing-game {
    .no-ongoing-game-text {
      color: rgba(0, 0, 0, 0.4);
    }
  }
}
</style>
