<template>
  <div class="flex items-center">
    <template v-if="teamStats">
      <NPopover>
        <template #trigger>
          <div
            class="text-sm font-bold"
            :class="
              teamStats.avgWinRate >= 0.5
                ? WIN_RATE_GTE_50_TEXT_CLASSES
                : WIN_RATE_LT_50_TEXT_CLASSES
            "
          >
            {{ (teamStats.avgWinRate * 100).toFixed() }}%
          </div>
        </template>
        {{
          t('TeamTagsArea.winRate', {
            rate: (teamStats.avgWinRate * 100).toFixed(2)
          })
        }}
        ({{ teamStats.wins.toLocaleString() }} / {{ teamStats.games.toLocaleString() }})
      </NPopover>

      <div class="mx-2 box-border h-[0.9em] w-px self-center bg-black/15 dark:bg-white/15"></div>

      <NPopover>
        <template #trigger>
          <div class="text-sm">
            {{ teamStats.avgKda.toFixed(2) }}
          </div>
        </template>
        {{
          t('TeamTagsArea.kda', {
            kda: teamStats.avgKda.toFixed(4)
          })
        }}
        (K {{ teamStats.kills.toLocaleString() }} / D {{ teamStats.deaths.toLocaleString() }} / A
        {{ teamStats.assists.toLocaleString() }})
      </NPopover>
    </template>

    <!-- 左右两边都有时给个分界线 -->
    <div
      v-if="teamStats && hasTags"
      class="mx-2 box-border h-[0.9em] w-px self-center bg-black/15 dark:bg-white/15"
    />

    <div class="flex gap-2">
      <NPopover v-for="p of teamPremadeTeams" :key="p.premadeId">
        <template #trigger>
          <!-- 胜率队 / 败率队的特殊样式 -->
          <template v-if="p.winRateTeamInfo">
            <div class="flex items-center overflow-hidden rounded-sm">
              <div
                class="rounded-none px-1 py-0.5 text-xs leading-3 text-white"
                :style="{
                  backgroundColor: p.premadeId
                    ? premadeColors[p.premadeId]?.foregroundColor
                    : '#ffffff40',
                  color: p.premadeId ? premadeColors[p.premadeId]?.color || '#fff' : '#fff'
                }"
              >
                {{
                  t('TeamTagsArea.premade', {
                    countV: p.puuids.length
                  })
                }}
              </div>
              <div
                v-if="p.winRateTeamInfo.type === 'win-rate-team'"
                class="rounded-none px-1 py-0.5 text-xs leading-3 text-white"
                :class="WIN_RATE_TEAM_TAG_BG_CLASSES"
              >
                {{ t('TeamTagsArea.winRateTeam') }}
              </div>
              <div
                v-else
                class="rounded-none px-1 py-0.5 text-xs leading-3 text-white"
                :class="LOSS_RATE_TEAM_TAG_BG_CLASSES"
              >
                {{ t('TeamTagsArea.loseRateTeam') }}
              </div>
            </div>
          </template>

          <template v-else>
            <div
              class="rounded-sm px-1 py-0.5 text-xs leading-3 text-white"
              :style="{
                backgroundColor: p.premadeId
                  ? premadeColors[p.premadeId]?.foregroundColor
                  : '#ffffff40',
                color: p.premadeId ? premadeColors[p.premadeId]?.color || '#fff' : '#fff'
              }"
            >
              {{
                t('TeamTagsArea.premade', {
                  size: p.puuids.length
                })
              }}
            </div>
          </template>
        </template>

        <TinyPlayerChampionList :puuids="p.puuids" />
      </NPopover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useTranslation } from 'i18next-vue'
import { NPopover } from 'naive-ui'
import { computed } from 'vue'

import {
  LOSS_RATE_TEAM_MAX_WIN_RATE,
  LOSS_RATE_TEAM_MIN_SIZE,
  PREMADE_TEAM_COLORS,
  PREMADE_TEAM_COLORS_LIGHT,
  WIN_RATE_TEAM_MIN_MATCHES,
  WIN_RATE_TEAM_MIN_SIZE,
  WIN_RATE_TEAM_MIN_WIN_RATE,
  WIN_RATE_TEAM_OTHER_MEMBER_WIN_STREAK
} from '../constants'
import { useOngoingGamePanel } from '../context'
import {
  LOSS_RATE_TEAM_TAG_BG_CLASSES,
  WIN_RATE_GTE_50_TEXT_CLASSES,
  WIN_RATE_LT_50_TEXT_CLASSES,
  WIN_RATE_TEAM_TAG_BG_CLASSES
} from '../utils/theme'
import TinyPlayerChampionList from './TinyPlayerChampionList.vue'

const { teamIdentifier } = defineProps<{
  teamIdentifier: string
}>()

interface WinRateTeamInfo {
  premadeId: string
  players: string[]
  type: 'win-rate-team' | 'loss-rate-team'
}

const { t } = useTranslation()

const as = useAppCommonStore()
const ogs = useOngoingGameStore()

const { mergedPremadeTeams } = useOngoingGamePanel()

const teamStats = computed(() => {
  if (!ogs.playerStats) {
    return null
  }

  return ogs.playerStats.teams[teamIdentifier] ?? null
})

const teamMembers = computed(() => {
  if (!ogs.playerStats) {
    return []
  }

  return ogs.teams[teamIdentifier] ?? []
})

const premadeColors = computed(() => {
  return as.colorTheme === 'dark' ? PREMADE_TEAM_COLORS : PREMADE_TEAM_COLORS_LIGHT
})

// ## 胜率队
// 1. 3 人以上的预组队队伍
// 2. 存在任意一名高胜率玩家
// 3. 其他成员的近期连胜平均值超过预设场次
// ## 败率队 (偏娱乐)
// 1. 2 人以上的预组队队伍
// 2. 玩家胜率均低于特定值
const winRateTeams = computed(() => {
  if (!ogs.playerStats || !mergedPremadeTeams.value) {
    return {}
  }

  const playerStats = ogs.playerStats.players

  const result: WinRateTeamInfo[] = []

  Object.entries(mergedPremadeTeams.value.groups).forEach(([premadeId, players]) => {
    if (players.length < WIN_RATE_TEAM_MIN_SIZE && players.length < LOSS_RATE_TEAM_MIN_SIZE) {
      return
    }

    let hasOneHighWinRateMember = false
    let otherMembersWinTotalStreak = 0

    for (const p of players) {
      const a = playerStats[p]

      if (!a) {
        break
      }

      if (
        !hasOneHighWinRateMember &&
        a.summary.winRate >= WIN_RATE_TEAM_MIN_WIN_RATE &&
        a.summary.count >= WIN_RATE_TEAM_MIN_MATCHES
      ) {
        hasOneHighWinRateMember = true
      } else {
        otherMembersWinTotalStreak += a.summary.winningStreak
      }
    }

    if (
      hasOneHighWinRateMember &&
      otherMembersWinTotalStreak / (players.length - 1) >= WIN_RATE_TEAM_OTHER_MEMBER_WIN_STREAK
    ) {
      result.push({
        premadeId,
        players,
        type: 'win-rate-team'
      })
    }

    let lossRateTeamQualified = true

    for (const p of players) {
      const a = playerStats[p]

      if (!a) {
        lossRateTeamQualified = false
        break
      }

      if (!lossRateTeamQualified) {
        break
      }

      if (
        a.summary.count < LOSS_RATE_TEAM_MIN_SIZE ||
        a.summary.winRate > LOSS_RATE_TEAM_MAX_WIN_RATE
      ) {
        lossRateTeamQualified = false
      }
    }

    if (lossRateTeamQualified) {
      result.push({
        premadeId,
        players,
        type: 'loss-rate-team'
      })
    }
  })

  return result.reduce(
    (acc, cur) => {
      acc[cur.premadeId] = cur
      return acc
    },
    {} as Record<string, WinRateTeamInfo>
  )
})

const teamPremadeTeams = computed(() => {
  if (!mergedPremadeTeams.value) {
    return []
  }

  return Object.entries(mergedPremadeTeams.value.groups)
    .filter(([_, puuids]) => puuids.every((p) => teamMembers.value.includes(p)))
    .map(([premadeId, puuids]) => {
      return {
        premadeId,
        winRateTeamInfo: winRateTeams.value[premadeId],
        puuids
      }
    })
    .toSorted((a, b) => {
      return a.puuids.length - b.puuids.length
    })
})

const hasTags = computed(() => {
  return teamPremadeTeams.value.length > 0
})
</script>
