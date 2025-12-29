<template>
  <div
    :class="[
      'relative box-border flex flex-col overflow-hidden rounded border border-neutral-900/20 bg-neutral-100/90 p-2 transition-[filter] dark:border-white/10 dark:bg-neutral-900/90',
      currentHighlightingPremadeTeamId && currentHighlightingPremadeTeamId !== premadeTeamId
        ? 'brightness-30'
        : '',
      currentHighlightingPremadeTeamId && currentHighlightingPremadeTeamId === premadeTeamId
        ? 'brightness-100'
        : ''
    ]"
    :style="{
      width: FIXED_CARD_WIDTH_PX_LITERAL,
      borderColor: premadeTeamId ? premadeColors[premadeTeamId]?.borderColor : undefined
    }"
  >
    <!-- premade deco -->
    <div
      class="absolute top-0 right-0 z-0 h-4 w-4 translate-x-1/2 -translate-y-1/2 rotate-45"
      :style="{
        backgroundColor: premadeTeamId ? premadeColors[premadeTeamId]?.foregroundColor : undefined
      }"
    />

    <div class="mb-1 flex">
      <div class="relative mr-2">
        <ChampionIcon
          :champion-id="championId || -1"
          round
          ring
          ring-color="rgba(255, 255, 255, 0.31)"
          class="h-[42px] w-[42px]"
        />
        <div
          v-if="summoner"
          class="absolute right-0 bottom-0 translate-x-[35%] rounded bg-black/50 px-1 text-[10px] text-white"
        >
          {{ summoner.summonerLevel }}
        </div>
      </div>

      <!-- summoner info (name & ranked) -->
      <div class="flex w-0 flex-1 flex-col justify-center gap-1">
        <!-- name -->
        <div
          class="cursor-pointer transition-[filter] hover:brightness-125"
          @click="() => emits('toSummoner', puuid)"
          ref="premade-title-el"
        >
          <NPopover
            :keep-alive-on-hover="false"
            :delay="50"
            :disabled="premadeTeamId === undefined"
          >
            <template #trigger>
              <div class="w-fit max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                <span
                  class="text-[13px] font-bold text-black/80 dark:text-white/80"
                  :style="{
                    color: premadeTeamId ? premadeColors[premadeTeamId]?.foregroundColor : undefined
                  }"
                  >{{
                    masked(
                      summoner?.gameName || summoner?.displayName || '—',
                      name(championId || -1)
                    )
                  }}</span
                >
                <span
                  v-if="!as.settings.streamerMode"
                  class="ml-1 text-xs text-gray-500 dark:text-gray-400"
                  >#{{ summoner?.tagLine || '—' }}</span
                >
              </div>
            </template>
            <div class="max-w-[200px] text-xs">
              {{ t('PlayerInfoCard.premadePopover', { team: premadeTeamId }) }}
            </div>
          </NPopover>
        </div>

        <!-- ranked -->
        <NPopover :keep-alive-on-hover="false" :delay="50">
          <template #trigger>
            <div class="flex gap-1">
              <!-- solo -->
              <div
                v-if="
                  rankedSoloFlex.solo && rankedSoloFlex.solo.tier && rankedSoloFlex.solo !== 'NA'
                "
                class="flex w-0 flex-1 items-center justify-start"
              >
                <img
                  class="mr-1 h-4 w-4"
                  :src="RANKED_MEDAL_MAP[rankedSoloFlex.solo.tier]"
                  alt="rank"
                />
                <span
                  class="overflow-hidden text-[11px] text-ellipsis whitespace-nowrap text-black/80 dark:text-white/80"
                  >{{ rankedSoloFlex.solo.text }}</span
                >
              </div>
              <div v-else class="flex w-0 flex-1 items-center justify-center">
                <span class="text-[11px] text-black/60 dark:text-white/60">{{
                  t('shortTiers.UNRANKED', {
                    ns: 'common'
                  })
                }}</span>
              </div>

              <!-- flex -->
              <div
                v-if="
                  rankedSoloFlex.flex && rankedSoloFlex.flex.tier && rankedSoloFlex.flex !== 'NA'
                "
                class="flex w-0 flex-1 items-center justify-start"
              >
                <img
                  class="mr-1 h-4 w-4"
                  :src="RANKED_MEDAL_MAP[rankedSoloFlex.flex.tier]"
                  alt="rank"
                />
                <span
                  class="overflow-hidden text-[11px] text-ellipsis whitespace-nowrap text-black/80 dark:text-white/80"
                  >{{ rankedSoloFlex.flex.text }}</span
                >
              </div>
              <div v-else class="flex w-0 flex-1 items-center justify-center">
                <span class="text-[11px] text-black/60 dark:text-white/60">{{
                  t('shortTiers.UNRANKED', {
                    ns: 'common'
                  })
                }}</span>
              </div>
            </div>
          </template>

          <RankedTable v-if="rankedStats" :rankedStats="rankedStats" />
          <div v-else class="text-xs">{{ t('PlayerInfoCard.empty') }}</div>
        </NPopover>
      </div>
    </div>

    <!-- win rate & kda -->
    <div class="mb-1 flex items-center">
      <template v-if="queueType === 'CHERRY'">
        <NPopover :keep-alive-on-hover="false" :disabled="!analysis" :delay="50">
          <template #trigger>
            <div
              v-if="analysis"
              class="flex-1 text-center text-[13px] font-bold"
              :class="{
                'text-green-600 dark:text-green-300': analysis.summary.winRate >= 0.53,
                'text-black/80 dark:text-white/80':
                  analysis.summary.winRate > 0.47 && analysis.summary.winRate < 0.53,
                'text-red-700 dark:text-red-400': analysis.summary.winRate <= 0.47
              }"
              :title="`${t('PlayerInfoCard.top4Rate')} & ${t('PlayerInfoCard.1stRate')}`"
            >
              {{ (analysis.summary.winRate * 100).toFixed() }}%
              <span class="text-[11px] font-normal"
                >/
                {{
                  t('PlayerInfoCard.1st', {
                    rate: (analysis.summary.cherry.top1Rate * 100).toFixed()
                  })
                }}</span
              >
              <span class="ml-1 text-[9px] font-normal text-black/90 dark:text-white/90"
                >({{ analysis.summary.count }})</span
              >
            </div>
            <div v-else class="flex-1 text-center text-[13px] font-bold">— %</div>
          </template>
          <div class="max-w-[200px] text-xs" v-if="analysis">
            {{
              t('PlayerInfoCard.cherryWinRatePopover', {
                countV: analysis.summary.count,
                winRate: (analysis.summary.winRate * 100).toFixed(2),
                cherryCount: analysis.summary.cherry.count,
                top1Rate: (analysis.summary.cherry.top1Rate * 100).toFixed(2)
              })
            }}
          </div>
        </NPopover>
      </template>

      <template v-else>
        <NPopover :keep-alive-on-hover="false" :disabled="!analysis">
          <template #trigger>
            <div
              v-if="analysis"
              class="flex-1 text-center text-[13px] font-bold"
              :class="{
                'text-green-600 dark:text-green-300': analysis.summary.winRate >= 0.53,
                'text-black/80 dark:text-white/80':
                  analysis.summary.winRate > 0.47 && analysis.summary.winRate < 0.53,
                'text-red-700 dark:text-red-400': analysis.summary.winRate <= 0.47
              }"
            >
              {{ (analysis.summary.winRate * 100).toFixed() }}%
              <span class="ml-1 text-[9px] font-normal text-black/90 dark:text-white/90"
                >({{ analysis.summary.count }})</span
              >
            </div>
            <div v-else class="flex-1 text-center text-[13px] font-bold">— %</div>
          </template>
          <div class="max-w-[200px] text-xs" v-if="analysis">
            {{
              t('PlayerInfoCard.winRatePopover', {
                countV: analysis.summary.count,
                winRate: (analysis.summary.winRate * 100).toFixed(),
                wins: analysis.summary.wins,
                losses: analysis.summary.losses
              })
            }}
          </div>
        </NPopover>
      </template>

      <NPopover :keep-alive-on-hover="false" :disabled="!analysis" :delay="50">
        <template #trigger>
          <div
            class="flex-1 text-center text-[13px] font-bold"
            :class="{
              'text-green-600 dark:text-green-300': kdaIqr === 'over',
              'text-black/80 dark:text-white/80': kdaIqr === null || kdaIqr === undefined,
              'text-red-700 dark:text-red-400': kdaIqr === 'below'
            }"
          >
            {{ analysis?.summary.avgKda.toFixed(2) || '—' }}
          </div>
        </template>
        <div class="max-w-[200px] text-xs" v-if="analysis">
          {{
            t('PlayerInfoCard.kdaPopover', {
              countV: analysis.summary.count,
              kda: analysis.summary.avgKda.toFixed(2),
              kills: (analysis.summary.kills / analysis.summary.count || 1).toFixed(2),
              deaths: (analysis.summary.deaths / analysis.summary.count || 1).toFixed(2),
              assists: (analysis.summary.assists / analysis.summary.count || 1).toFixed(2)
            })
          }}
          (KDA CV: {{ analysis.summary.kdaCv.toFixed(2) }})
        </div>
      </NPopover>

      <NPopover v-if="positionInfo">
        <template #trigger>
          <div
            class="flex flex-1 items-center justify-center gap-0.5 text-base"
            :class="{
              'ml-4': !(positionInfo.role && positionInfo.role.assignmentReason === 'AUTOFILL')
            }"
          >
            <div
              v-if="positionInfo.role && positionInfo.role.assignmentReason === 'AUTOFILL'"
              class="rounded px-1 py-0.5 text-[11px] leading-[11px] whitespace-nowrap text-black dark:text-white"
              :style="{
                'background-color': positionAssignmentReason.AUTOFILL_SHORT?.color,
                color: positionAssignmentReason.AUTOFILL_SHORT?.foregroundColor
              }"
            >
              {{ positionAssignmentReason.AUTOFILL_SHORT?.name }}
            </div>

            <template v-if="positionInfo.current && positionInfo.current !== 'NONE'">
              <PositionIcon :position="positionInfo.current" />
              <div
                v-if="(positionInfo.recent && positionInfo.recent.length) || positionInfo.role"
                class="mx-0.5 h-3 w-px bg-black/25 dark:bg-white/25"
              ></div>
            </template>

            <template v-if="positionInfo.recent && positionInfo.recent.length">
              <PositionIcon
                v-for="p of positionInfo.recent.slice(0, 3)"
                :key="p.position"
                :position="p.position"
              />
            </template>
            <template v-else-if="positionInfo.role">
              <PositionIcon :position="positionInfo.role.primary" />
              <PositionIcon
                v-if="positionInfo.role.secondary !== 'UNSELECTED'"
                :position="positionInfo.role.secondary"
              />
            </template>
          </div>
        </template>
        <div>
          <div class="mb-2 flex items-end gap-1">
            <PositionIcon
              v-if="positionInfo.current && positionInfo.current !== 'NONE'"
              class="text-lg text-black dark:text-white"
              :position="positionInfo.current || 'ALL'"
            />
            <span class="text-sm font-bold">{{
              t(`positions.${positionInfo.current || 'ALL'}`, {
                ns: 'common'
              })
            }}</span>
            <div
              v-if="positionInfo.role && positionInfo.role.assignmentReason !== 'NONE'"
              class="rounded px-1 py-0.5 text-[11px] leading-[11px] whitespace-nowrap text-black dark:text-white"
              :style="{
                'background-color':
                  positionAssignmentReason[positionInfo.role.assignmentReason]?.color || '#5b4694',
                color:
                  positionAssignmentReason[positionInfo.role.assignmentReason]?.foregroundColor ||
                  '#ffffff'
              }"
            >
              {{
                positionAssignmentReason[positionInfo.role.assignmentReason]?.name ||
                positionInfo.role.assignmentReason
              }}
            </div>
          </div>
          <div v-if="positionInfo.recent && positionInfo.recent.length" class="flex items-center">
            <span class="mr-2 w-16 text-xs">{{ t('PlayerInfoCard.position.recentlyPlayed') }}</span>
            <PositionIcon
              class="text-lg text-black dark:text-white"
              v-for="p of positionInfo.recent"
              :key="p.position"
              :position="p.position"
            />
          </div>
          <div v-if="positionInfo.role" class="flex items-center">
            <span class="mr-2 w-16 text-xs">{{ t('PlayerInfoCard.position.selection') }}</span>
            <PositionIcon
              class="text-lg text-black dark:text-white"
              :position="positionInfo.role.primary"
            />
            <PositionIcon
              class="text-lg text-black dark:text-white"
              v-if="positionInfo.role.secondary !== 'UNSELECTED'"
              :position="positionInfo.role.secondary"
            />
          </div>
        </div>
      </NPopover>
    </div>

    <!-- tags -->
    <PlayerCardTagsArea
      :analysis="analysis"
      :puuid="puuid"
      :is-self="isSelf"
      :premade-team-id="premadeTeamId"
      :current-highlighting-premade-team-id="currentHighlightingPremadeTeamId"
      :saved-info="savedInfo"
      :summoner="summoner"
      @show-game="(game, puuid) => emits('showGame', game, puuid)"
      @show-game-by-id="(gameId, puuid) => emits('showGameById', gameId, puuid)"
      @highlight="(premadeTeamId, hovering) => emits('highlight', premadeTeamId, hovering)"
      @to-summoner="emits('toSummoner', $event)"
    />

    <!-- champion usage -->
    <div v-if="championUsage.length" class="mb-1 flex w-full gap-1">
      <NPopover :keep-alive-on-hover="false" v-for="c of championUsage" :key="c.id" :delay="50">
        <template #trigger>
          <div class="relative h-5 w-5">
            <ChampionIcon
              :ring-color="
                c.analysis ? (c.analysis.winRate >= 0.5 ? '#2368ca' : '#c94f4f') : undefined
              "
              :champion-id="c.id"
              ring
              :ring-width="1"
              class="h-full w-full rounded"
            />
            <StarRoundIcon
              v-if="c.mastery && c.mastery.championLevel >= STARED_CHAMPION_LEVEL"
              class="absolute -right-0.5 -bottom-0.5 h-3 w-3 text-[#fff838]"
            />
          </div>
        </template>
        <div class="max-w-[260px]">
          <div class="mb-1 flex items-center gap-2 text-xs">
            <ChampionIcon
              ring
              :ring-width="1"
              round
              class="h-[22px] w-[22px]"
              :champion-id="c.id"
            />
            <div class="text-xs font-bold text-gray-200 dark:text-gray-200">
              {{ lcs.gameData.champions[c.id]?.name || c.id }}
            </div>
          </div>
          <div v-if="c.analysis" class="text-xs">
            {{
              t('PlayerInfoCard.champion.winRate', {
                countV: c.analysis.count,
                winRate: (c.analysis.winRate * 100).toFixed()
              })
            }}
          </div>
          <template v-if="c.mastery">
            <div class="mt-1 flex items-center gap-1">
              <span class="rounded bg-[#b94ecf] px-1 text-[11px]">{{
                t('PlayerInfoCard.champion.level', {
                  level: c.mastery.championLevel
                })
              }}</span>
              <span class="text-xs">{{
                t('PlayerInfoCard.champion.masteryPoints', {
                  points: c.mastery.championPoints.toLocaleString()
                })
              }}</span>
            </div>
            <div class="mt-1 flex flex-wrap gap-0.5">
              <span
                class="rounded bg-[#4e82cf] px-1 text-[11px]"
                v-for="m of toSortedMilestoneGrades(c.mastery.milestoneGrades)"
                :key="m"
                >{{ m }}</span
              >
            </div>
          </template>
        </div>
      </NPopover>
    </div>

    <!-- list -->
    <div class="relative mt-1 flex h-0 flex-1 flex-col gap-0.5">
      <NVirtualList
        key-field="gameId"
        style="height: 100%"
        :item-size="36"
        :items="matches"
        v-if="matches.length"
      >
        <template #default="{ item, index }">
          <div
            :class="[
              'group relative mb-0.5 box-border flex h-[34px] cursor-pointer items-center rounded px-2 py-0.5 transition-[filter] hover:brightness-125',
              ogs.settings.showMatchHistoryItemBorder
                ? `border ${getMatchItemThemeClasses(item).border}`
                : '',
              getMatchItemThemeClasses(item).bg
            ]"
            :key="item.gameId"
            @click="emits('showGame', item.game, puuid)"
          >
            <div
              class="absolute right-0 bottom-0 text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
              :class="getMatchItemThemeClasses(item).resultText"
            >
              #{{ index + 1 }}
            </div>
            <ChampionIcon
              :champion-id="item.participant.championId"
              class="mr-1 h-6 w-6 rounded bg-[#4b5b7d]"
            />
            <div class="mr-1 w-[100px]">
              <div
                class="overflow-hidden text-xs text-ellipsis whitespace-nowrap"
                :class="getMatchItemThemeClasses(item).text"
              >
                {{ lcs.gameData.queues[item.basicInfo.queueId]?.name || item.basicInfo.queueId }}
              </div>
              <div class="text-[10px]" :class="getMatchItemThemeClasses(item).text">
                {{ dayjs(item.basicInfo.gameCreation).format('MM-DD HH:mm') }}
                <span class="ml-1" :class="getMatchItemThemeClasses(item).resultText">
                  {{ getWinResultText(item) }}
                </span>
              </div>
            </div>
            <div class="text-xs" :class="getMatchItemThemeClasses(item).text">
              {{ item.participant.kills }} / {{ item.participant.deaths }} /
              {{ item.participant.assists }}
            </div>
          </div>
        </template>
      </NVirtualList>

      <!-- loading -->
      <div
        v-if="matchHistoryLoading === 'loading'"
        class="pointer-events-none absolute inset-0 flex h-full w-full items-center justify-center gap-1 rounded text-xs text-black/60 dark:bg-white/5 dark:text-white/60"
      >
        <div class="flex items-center gap-1">
          <NSpin :size="16" />
          <span>{{ t('PlayerInfoCard.loadingMatchHistory') }}</span>
        </div>
      </div>

      <!-- error -->
      <div
        v-else-if="matchHistoryLoading === 'error'"
        class="absolute inset-0 flex h-full w-full items-center justify-center gap-1 rounded text-xs text-orange-600 dark:bg-white/5 dark:text-orange-300"
      >
        <div class="flex flex-col items-center gap-2">
          <div>{{ t('PlayerInfoCard.errorLoadingMatchHistory') }}</div>

          <NButton size="tiny" @click="emits('reload', puuid)">
            {{ t('PlayerInfoCard.reloadMatchHistory') }}
          </NButton>
        </div>
      </div>

      <div
        v-else-if="matches.length === 0"
        class="pointer-events-none absolute inset-0 flex h-full w-full items-center justify-center rounded text-xs text-black/60 dark:bg-white/5 dark:text-white/60"
      >
        <div class="flex flex-col items-center gap-2">
          {{ t('PlayerInfoCard.empty') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RankedTable from '@renderer-shared/components/RankedTable.vue'
import PositionIcon from '@renderer-shared/components/icons/position-icons/PositionIcon.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useChampionInfo } from '@renderer-shared/composables/useChampionInfo'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { SavedInfo, useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { MatchHistoryGamesAnalysisAll } from '@shared/data-adapter/analysis/players'
import { MatchBasicInfo, toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { MatchParticipant, toParticipants } from '@shared/data-adapter/match-history/participants'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { formatI18nOrdinal } from '@shared/i18n'
import { Mastery } from '@shared/types/league-client/champion-mastery'
import { RankedStats } from '@shared/types/league-client/ranked'
import { SummonerInfo } from '@shared/types/league-client/summoner'
import { QueryStage } from '@shared/types/shards/ongoing-game'
import { ParsedRole } from '@shared/utils/ranked'
import { StarRound as StarRoundIcon } from '@vicons/material'
import { useElementHover } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NButton, NPopover, NSpin, NVirtualList } from 'naive-ui'
import { computed, onDeactivated, useTemplateRef, watch } from 'vue'

import {
  FIXED_CARD_WIDTH_PX_LITERAL,
  PREMADE_TEAM_COLORS,
  PREMADE_TEAM_COLORS_LIGHT,
  RANKED_MEDAL_MAP
} from './ongoing-game-utils'
import PlayerCardTagsArea from './widgets/PlayerCardTagsArea.vue'

const {
  puuid,
  analysis,
  matchHistory,
  position,
  premadeTeamId,
  summoner,
  rankedStats,
  savedInfo,
  championMastery,
  queueType
} = defineProps<{
  puuid: string
  championId?: number
  isSelf?: boolean
  premadeTeamId?: string
  currentHighlightingPremadeTeamId?: string | null
  team?: string
  queueType?: string
  kdaIqr?: 'below' | 'over' | null
  position?: {
    position: string
    role: ParsedRole | null
  }
  summoner?: SummonerInfo
  rankedStats?: RankedStats
  championMastery?: Record<number, Mastery>
  matchHistory?: LcuOrSgpGameSummary[]
  matchHistoryLoading?: string
  analysis?: MatchHistoryGamesAnalysisAll
  savedInfo?: SavedInfo
  queryStage: QueryStage
}>()

const emits = defineEmits<{
  toSummoner: [puuid: string]
  showGame: [game: LcuOrSgpGameSummary, puuid: string]
  showGameById: [gameId: number, puuid: string]
  showSavedInfo: [puuid: string]
  highlight: [premadeTeamId: string, boolean]
  reload: [puuid: string]
}>()

const { t } = useTranslation()

const STARED_CHAMPION_LEVEL = 60

const ogs = useOngoingGameStore()

const premadeTitleElHovering = useElementHover(useTemplateRef('premade-title-el'))
watch(
  () => premadeTitleElHovering.value,
  (hovering) => {
    if (premadeTeamId) {
      emits('highlight', premadeTeamId, hovering)
    }
  }
)

// 以防路由时高亮状态未清除
onDeactivated(() => {
  if (premadeTeamId) {
    emits('highlight', premadeTeamId, false)
  }
})

const lcs = useLeagueClientStore()
const as = useAppCommonStore()

const premadeColors = computed(() => {
  return as.colorTheme === 'dark' ? PREMADE_TEAM_COLORS : PREMADE_TEAM_COLORS_LIGHT
})

const positionInfo = computed(() => {
  const info = {
    current: null as string | null,
    role: null as ParsedRole | null,
    recent: [] as { position: string; count: number }[]
  }

  if (!position?.position || position.position === 'NONE') {
    return null
  }

  info.current = position.position
  info.role = position.role

  if (analysis?.positions) {
    const recentPositions = Object.entries(analysis.positions)
      .map(([position, count]) => ({ position, count }))
      .filter((p) => p.position !== 'NONE' && p.count > 0)
      .toSorted((a, b) => b.count - a.count)

    info.recent = recentPositions
  }

  return info
})

const FREQUENT_USED_CHAMPIONS_MAX_COUNT = 9

const championUsage = computed(() => {
  if (ogs.settings.showChampionUsage === 'recent') {
    if (!analysis) {
      return []
    }

    const truncated = Object.values(analysis.champions)
      .toSorted((a, b) => {
        return b.count - a.count
      })
      .slice(0, FREQUENT_USED_CHAMPIONS_MAX_COUNT)
      .map((c) => ({
        id: c.id,
        analysis: c,
        mastery: championMastery && championMastery[c.id]
      }))

    return truncated
  } else if (ogs.settings.showChampionUsage === 'mastery') {
    if (!championMastery) {
      return []
    }

    const truncated = Object.values(championMastery)
      .toSorted((a, b) => {
        return b.championPoints - a.championPoints
      })
      .slice(0, FREQUENT_USED_CHAMPIONS_MAX_COUNT)
      .map((m) => ({
        id: m.championId,
        analysis: analysis?.champions[m.championId],
        mastery: m
      }))

    return truncated
  }

  return []
})

const rankedSoloFlex = computed(() => {
  if (!rankedStats) {
    return {
      solo: null,
      flex: null,
      cherry: null
    }
  }

  const result: Record<string, any> = {}

  const solo = rankedStats.queueMap['RANKED_SOLO_5x5']
  const flex = rankedStats.queueMap['RANKED_FLEX_SR']
  const cherry = rankedStats.queueMap['CHERRY']

  if (solo) {
    const soloText =
      solo.division && solo.division !== 'NA'
        ? `${t(`shortTiers.${solo.tier || 'UNRANKED'}`, {
            ns: 'common'
          })} ${solo.division} ${solo.leaguePoints}`
        : `${t(`shortTiers.${solo.tier || 'UNRANKED'}`, {
            ns: 'common'
          })} ${solo.leaguePoints}`

    result.solo = {
      text: soloText,
      tier: solo.tier,
      division: solo.division,
      lp: solo.leaguePoints
    }
  }

  if (flex) {
    const flexText =
      flex.division && flex.division !== 'NA'
        ? `${t(`shortTiers.${flex.tier || 'UNRANKED'}`, {
            ns: 'common'
          })} ${flex.division} ${flex.leaguePoints}`
        : `${t(`shortTiers.${flex.tier || 'UNRANKED'}`, {
            ns: 'common'
          })} ${flex.leaguePoints}`

    result.flex = {
      text: flexText,
      tier: flex.tier,
      division: flex.division,
      lp: flex.leaguePoints
    }
  }

  if (cherry) {
    result.cherry = {
      ratedRating: cherry.ratedRating
    }
  }

  return result
})

const MILESTONE_ORDER = [
  'S+',
  'S',
  'S-',
  'A+',
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C+',
  'C',
  'C-',
  'D+',
  'D',
  'D-'
]

const positionAssignmentReason = computed(() => {
  return {
    FILL_SECONDARY: {
      name: t('positionAssignmentReason.FILL_SECONDARY', { ns: 'common' }),
      color: '#82613b',
      foregroundColor: '#ffffff'
    },
    FILL_PRIMARY: {
      name: t('positionAssignmentReason.FILL_PRIMARY', { ns: 'common' }),
      color: '#5b4694',
      foregroundColor: '#ffffff'
    },
    PRIMARY: {
      name: t('positionAssignmentReason.PRIMARY', { ns: 'common' }),
      color: '#5b4694',
      foregroundColor: '#ffffff'
    },
    SECONDARY: {
      name: t('positionAssignmentReason.SECONDARY', { ns: 'common' }),
      color: '#5b4694',
      foregroundColor: '#ffffff'
    },
    AUTOFILL: {
      name: t('positionAssignmentReason.AUTOFILL', { ns: 'common' }),
      color: '#944646',
      foregroundColor: '#ffffff'
    },
    AUTOFILL_SHORT: {
      name: t('positionAssignmentReason.AUTOFILL_SHORT', { ns: 'common' }),
      color: '#944646',
      foregroundColor: '#ffffff'
    }
  }
})

const toSortedMilestoneGrades = (arr: string[]) => {
  const deduplicated = Array.from(new Set(arr))

  const newArr = deduplicated.toSorted((a, b) => {
    const aIndex = MILESTONE_ORDER.indexOf(a)
    const bIndex = MILESTONE_ORDER.indexOf(b)

    if (aIndex === -1 && bIndex === -1) {
      return 0
    }

    if (aIndex === -1) {
      return 1
    }

    if (bIndex === -1) {
      return -1
    }

    return aIndex - bIndex
  })

  return newArr
}

const getWinResultText = (match: { basicInfo: MatchBasicInfo; participant: MatchParticipant }) => {
  if (match.basicInfo.gameMode === 'PRACTICETOOL') {
    return t('PlayerInfoCard.matchHistory.winResult.na')
  }

  if (match.participant.winResult === 'abort') {
    return t('PlayerInfoCard.matchHistory.winResult.abort')
  }

  if (match.participant.winResult === 'remake') {
    return t('PlayerInfoCard.matchHistory.winResult.remake')
  }

  if (match.basicInfo.gameMode === 'CHERRY') {
    if (match.participant.subteamPlacement === 0) {
      return '?'
    }

    return formatI18nOrdinal(match.participant.subteamPlacement, as.settings.locale)
  }

  return match.participant.winResult === 'win'
    ? t('PlayerInfoCard.matchHistory.winResult.win')
    : t('PlayerInfoCard.matchHistory.winResult.loss')
}

/**
 * 获取战绩条目的主题类名，使用主页战绩卡片的 shadow 主颜色
 * 亮色和暗色模式都使用具体颜色，但更柔和
 */
const getMatchItemThemeClasses = (match: {
  basicInfo: MatchBasicInfo
  participant: MatchParticipant
}) => {
  const isNeutral =
    match.basicInfo.gameMode === 'PRACTICETOOL' ||
    match.participant.winResult === 'abort' ||
    match.participant.winResult === 'remake'

  if (isNeutral) {
    return {
      bg: 'bg-[rgba(200,200,200,0.45)] dark:bg-[rgba(255,255,255,0.20)]',
      border: 'border-[rgba(200,200,200,1)] dark:border-[rgba(255,255,255,0.6)]',
      text: 'text-black dark:text-white',
      resultText: 'text-black dark:text-white/80'
    }
  }

  if (match.participant.winResult === 'win') {
    return {
      bg: 'bg-[rgba(96,165,250,0.35)] dark:bg-[rgba(59,130,246,0.25)]',
      border: 'border-[rgba(96,165,250,1)] dark:border-[rgba(59,130,246,0.6)]',
      text: 'text-black dark:text-white',
      resultText: 'text-blue-600 dark:text-blue-300'
    }
  }

  // loss
  return {
    bg: 'bg-[rgba(243,73,72,0.3)] dark:bg-[rgba(243,73,72,0.25)]',
    border: 'border-[rgba(243,73,72,1)] dark:border-[rgba(243,73,72,0.6)]',
    text: 'text-black dark:text-white',
    resultText: 'text-red-700 dark:text-red-300'
  }
}

const matches = computed(() => {
  if (!matchHistory) {
    return []
  }

  return matchHistory.map((game) => {
    const basicInfo = toBasicInfo(game)
    const participant = toParticipants(game, basicInfo).find((p) => p.puuid === puuid)

    return {
      gameId: game.gameId,
      basicInfo,
      participant,
      game
    }
  })
})

const { masked } = useStreamerModeMaskedText()
const { name } = useChampionInfo()
</script>

<style scoped></style>
