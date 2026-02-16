<template>
  <div
    class="h-(--la-ongoing-game-height) w-(--la-ongoing-game-width)"
    :style="{
      '--la-ongoing-game-height': contentHeight + 'px',
      '--la-ongoing-game-width': contentWidth + 'px'
    }"
  >
    <NScrollbar v-if="!isInIdleState" x-scrollable>
      <div
        class="m relative mx-auto box-border flex flex-col gap-4 p-4"
        :class="{ 'w-fit': columnsNeed >= 4 }"
        :style="teamsContainerStyles"
      >
        <OngoingGameTeam
          v-for="(players, teamIdentifier) of sortedTeams"
          :teamIdentifier="teamIdentifier"
          :key="teamIdentifier"
          :puuids="players"
        />

        <div
          v-if="isTwoTeamsMode && linesPerTeam === 1 && Object.keys(sortedTeams).length === 1"
          class="flex-1"
        ></div>
      </div>
    </NScrollbar>

    <!-- placeholder panel -->
    <div v-else class="relative flex h-full">
      <div
        class="absolute top-[48%] left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4"
      >
        <template v-if="ogs.settings.enabled">
          <template v-if="lcs.connectionState !== 'connected'">
            <NIcon class="text-6xl text-black/30 dark:text-white/30" :component="PlugConnected" />
            <div class="text-base font-normal text-black/60 dark:text-white/80">
              {{ t('OngoingGame.disconnected') }}
            </div>
          </template>

          <template v-else-if="lcs.champSelect.session && lcs.champSelect.session.isSpectating">
            <NIcon class="text-6xl text-black/30 dark:text-white/30" :component="TimeOutline" />
            <div class="text-base font-normal text-black/60 dark:text-white/80">
              {{ t('OngoingGame.waitingForSpectate') }}
            </div>
          </template>

          <template v-else>
            <NIcon class="text-6xl text-black/30 dark:text-white/30" :component="GameController" />
            <div class="text-base font-normal text-black/60 dark:text-white/80">
              {{ t('OngoingGame.noOngoingGame') }}
            </div>
          </template>
        </template>

        <template v-else>
          <NIcon class="text-6xl text-black/30 dark:text-white/30" :component="Forbid" />
          <div class="text-base font-normal text-black/60 dark:text-white/80">
            {{ t('OngoingGame.disabled') }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { GameController, TimeOutline } from '@vicons/ionicons5'
import { Forbid, PlugConnected } from '@vicons/tabler'
import { useTranslation } from 'i18next-vue'
import { NIcon, NScrollbar } from 'naive-ui'
import { computed } from 'vue'

import { FIXED_CARD_WIDTH_PX_NUMBER, POSITION_ORDER, PREMADE_TEAMS } from './constants'
import { provideOngoingGamePanel } from './context'
import OngoingGameTeam from './widgets/OngoingGameTeam.vue'

const props = defineProps<{
  /** 容器参考宽度，用于计算列数 */
  contentWidth: number
  /** 容器参考高度，用于计算两队模式下的高度样式 */
  contentHeight: number
}>()

const emits = defineEmits<{
  navigateToSummonerByPuuid: [puuid: string]
  previewGame: [summary: LcuOrSgpGameSummary | number, puuid?: string]
}>()

const { t } = useTranslation()

const lcs = useLeagueClientStore()
const ogs = useOngoingGameStore()

const isInIdleState = computed(() => ogs.queryStage.phase === 'unavailable')

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

  for (const [puuid, premadeId] of Object.entries(ogs.calculatedPremadeTeamMap)) {
    const groupId = PREMADE_TEAMS[premadeId - 1]

    if (playerMap.groups[groupId]) {
      playerMap.groups[groupId].push(puuid)
    } else {
      playerMap.groups[groupId] = [puuid]
    }

    playerMap.premadeTeamIdMap[puuid] = groupId
  }

  return playerMap
})

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
        const info = premadeTeamInfo.value
        const idMap = info.premadeTeamIdMap
        const groups = info.groups

        const teamA = idMap[a]
        const teamB = idMap[b]

        if (!!teamA !== !!teamB) {
          return teamA ? -1 : 1
        }

        if ((!teamA && !teamB) || teamA === teamB) return 0

        const sizeDiff = groups[teamB].length - groups[teamA].length
        if (sizeDiff) return sizeDiff

        return teamA.localeCompare(teamB)
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

const columnsNeed = computed(() => {
  const teamColumns = Object.values(ogs.teams || {})
    .map((t) => t.length)
    .reduce((a, b) => Math.max(a, b), 0)

  const maxAllowed = [8, 7, 6, 5, 4, 3].find(
    (col) => props.contentWidth > FIXED_CARD_WIDTH_PX_NUMBER * (col + 0.25)
  )

  return Math.min(maxAllowed || 2, teamColumns)
})

const linesPerTeam = computed(() => {
  const maxMembers = Math.max(...Object.values(sortedTeams.value).map((t) => t.length))

  return Math.ceil(maxMembers / columnsNeed.value)
})

const isTwoTeamsMode = computed(() => {
  return Object.keys(sortedTeams.value).some((t) => t === 'TEAM-100' || t === 'TEAM-200')
})

const teamsContainerStyles = computed(() => {
  // 1. 必须是两队式
  // 2. 只有一排显示
  if (isTwoTeamsMode.value && linesPerTeam.value === 1) {
    return {
      height: props.contentHeight + 'px',
      maxHeight: '1200px',
      minHeight: '500px'
    }
  }

  // 其他情况容器固定高度 (600px)
  return {}
})

provideOngoingGamePanel({
  contentWidth: () => props.contentWidth,
  contentHeight: () => props.contentHeight,

  columnsNeed,
  linesPerTeam,
  isTwoTeamsMode,
  premadeTeamInfo,

  navigateToSummonerByPuuid: (puuid: string) => {
    emits('navigateToSummonerByPuuid', puuid)
  },
  previewGame: (summary: LcuOrSgpGameSummary | number, puuid?: string) => {
    emits('previewGame', summary, puuid)
  }
})
</script>
