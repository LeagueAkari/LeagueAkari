<template>
  <div class="@container overflow-hidden rounded border border-solid" :class="tone.borderClass">
    <!-- header -->
    <div class="box-border flex h-8 items-center gap-4 p-2 text-xs" :class="tone.headerClass">
      <!-- team name -->
      <div class="flex items-center gap-1">
        <div
          class="text-xs font-bold"
          :class="{
            'text-blue-700 dark:text-blue-300': team.winResult === 'win',
            'text-red-700 dark:text-red-300': team.winResult === 'loss',
            'text-black/80 dark:text-white/80':
              team.winResult === 'remake' || team.winResult === 'abort'
          }"
        >
          {{
            gameResultName(
              team.subteamPlacement,
              team.winResult,
              team.isSurrender,
              as.settings.locale
            )
          }}
        </div>
        <div>{{ teamName(teamIdentifier) }}</div>
      </div>

      <!-- team kda -->
      <div class="text-xs text-black/80 dark:text-white/80">
        {{ team.totalKills }}/{{ team.totalDeaths }}/{{ team.totalAssists }}
      </div>

      <div class="text-xs text-black/80 dark:text-white/80">
        {{ (team.totalGoldEarned / 1000).toFixed(2) }}k
      </div>

      <!-- objective -->
      <div v-if="team.teamInfo" class="flex gap-2">
        <div
          class="flex items-center gap-1 text-black/60 dark:text-white/60"
          :title="t('MatchCard.teamTable.objectives.tower')"
        >
          <Tower class="size-3.5" />
          <span>{{ team.teamInfo.objectives.tower.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 text-black/60 dark:text-white/60"
          :title="t('MatchCard.teamTable.objectives.inhibitor')"
        >
          <Inhibitor class="size-3.5" />
          <span>{{ team.teamInfo.objectives.inhibitor.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 text-black/60 dark:text-white/60"
          :title="t('MatchCard.teamTable.objectives.dragon')"
        >
          <Dragon class="size-3.5" />
          <span>{{ team.teamInfo.objectives.dragon.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 text-black/60 dark:text-white/60"
          :title="t('MatchCard.teamTable.objectives.baron')"
        >
          <Baron class="size-3.5" />
          <span>{{ team.teamInfo.objectives.baron.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 text-black/60 dark:text-white/60"
          :title="t('MatchCard.teamTable.objectives.voidGrub')"
        >
          <VoidGrub class="size-3.5" />
          <span>{{ team.teamInfo.objectives.horde.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 text-black/60 dark:text-white/60"
          :title="t('MatchCard.teamTable.objectives.riftHerald')"
        >
          <RiftHerald class="size-3.5" />
          <span>{{ team.teamInfo.objectives.riftHerald.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 text-black/60 dark:text-white/60"
          :title="t('MatchCard.teamTable.objectives.atakhan')"
          v-if="someTeamHasAtakhan && team.teamInfo.objectives.atakhan"
        >
          <Atakhan class="size-3.5" />
          <span>{{ team.teamInfo.objectives.atakhan.kills }}</span>
        </div>
      </div>

      <!-- bans -->
      <div class="ml-auto flex" v-if="team.teamInfo && team.teamInfo.bans.length > 0">
        <div class="mr-1 text-xs text-black/60 dark:text-white/60">
          {{ t('MatchCard.teamTable.bans') }}
        </div>
        <div class="flex gap-0.5">
          <ChampionIcon
            v-for="ban in team.teamInfo.bans.slice(0, 5)"
            :key="ban.championId"
            :champion-id="ban.championId"
            class="size-4 rounded-xs"
          />
          <NPopover v-if="team.teamInfo.bans.length > 5">
            <template #trigger>
              <div class="text-xs text-black/60 dark:text-white/60">
                +{{ team.teamInfo.bans.length - 5 }}
              </div>
            </template>
            <div class="flex gap-0.5">
              <ChampionIcon
                v-for="ban in team.teamInfo.bans.slice(5)"
                :key="ban.championId"
                :champion-id="ban.championId"
                class="size-4 rounded-xs"
              />
            </div>
          </NPopover>
        </div>
      </div>
    </div>

    <!-- players -->
    <div
      v-for="participant in teamParticipants"
      :key="participant.puuid"
      :class="{
        'bg-black/5 bg-clip-padding dark:bg-white/5': participant.puuid === puuid
      }"
      class="box-border flex h-12 items-center border-t border-r-0 border-b-0 border-l-0 border-solid border-t-black/5 px-2 py-1 dark:border-t-white/5"
    >
      <!-- name line -->
      <div class="flex min-w-0 flex-1 items-center gap-1">
        <!-- left champion icon -->
        <NPopover placement="right">
          <template #trigger>
            <div class="relative size-8 cursor-pointer">
              <ChampionIcon :champion-id="participant.championId" class="size-full!" round />

              <div
                class="absolute right-0 -bottom-1 rounded-full bg-black/70 p-0.5 text-[10px] leading-none text-white/80 dark:bg-black/50"
              >
                {{ participant.level }}
              </div>
            </div>
          </template>
          <RadarChart :puuid="participant.puuid" />
        </NPopover>

        <!-- spells -->
        <div v-if="participant.spells[0] || participant.spells[1]" class="flex flex-col gap-0.5">
          <SummonerSpellDisplay
            v-for="spell in participant.spells"
            :key="spell"
            :spell-id="spell"
            :size="16"
          />
        </div>

        <!-- runes (if exists, ml -0.5rem) -->
        <div
          v-if="
            participant.perks.styles[0]?.selections[0]?.perk ||
            participant.perks.styles[1]?.selections[0]?.perk
          "
          class="-ml-0.5 flex flex-col gap-0.5"
        >
          <PerkDisplay :perk-id="participant.perks.styles[0]?.selections[0]?.perk" :size="16" />
          <PerkstyleDisplay :perkstyle-id="participant.perks.styles[1]?.style" :size="16" />
        </div>

        <!-- name & position -->
        <div class="flex min-w-0 flex-1 flex-col">
          <NTooltip>
            <template #trigger>
              <div
                class="flex cursor-pointer items-center gap-1 text-xs"
                @click="navigateToSummonerByPuuid(participant.puuid)"
                @mousedown="handleMouseDown"
                @mouseup="handleMouseUp($event, participant.puuid)"
                :class="{ 'font-bold text-black dark:text-white': participant.puuid === puuid }"
              >
                <NIcon
                  class="text-black/80 dark:text-white/80"
                  v-if="!participant.puuid || participant.puuid === EMPTY_PUUID"
                >
                  <Robot />
                </NIcon>

                <div class="truncate">
                  <template v-if="hidePrivacy">
                    {{ lcs.gameData.championName(participant.championId) }}
                  </template>
                  <template v-else>
                    {{ participant.gameName }}
                    <template v-if="participant.tagLine">#{{ participant.tagLine }}</template>
                  </template>
                </div>
              </div>
            </template>
            <div class="flex items-center gap-1 text-xs" v-if="!hidePrivacy">
              <span class="font-bold">{{ participant.gameName }}</span>
              <span v-if="participant.tagLine" class="text-white/80"
                >#{{ participant.tagLine }}</span
              >
            </div>
            <div class="flex items-center gap-1 text-xs" v-else>
              <span class="font-bold">{{ lcs.gameData.championName(participant.championId) }}</span>
            </div>
          </NTooltip>
          <div
            v-if="participant.position && participant.position.toLowerCase() !== 'invalid'"
            class="flex items-center gap-1 text-[11px] text-black/60 dark:text-white/60"
          >
            <span>{{ position(participant.position) }}</span>
            <JunglePathingInfo
              v-if="
                showJunglePathing &&
                isJunglePosition(participant.position) &&
                jungleAnalysisByPuuid[participant.puuid]
              "
              :analysis="jungleAnalysisByPuuid[participant.puuid]"
              trigger-mode="text"
              :trigger-text="t('JunglePathing.title')"
              :show-copy-all="false"
              :ftue-target="junglePathingFtueTarget"
              :custom-tabs="buildJunglePathingTabs(participant)"
              @tab-change="(tabKey) => handleJunglePathingTabChange(participant, tabKey)"
            />
            <span
              v-else-if="showJunglePathing && isJunglePosition(participant.position)"
              :data-ftue-target="junglePathingFtueTarget"
              class="inline-flex cursor-default items-center rounded border border-emerald-600/35 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] leading-none text-emerald-700 dark:border-emerald-300/40 dark:bg-emerald-400/15 dark:text-emerald-300"
              @mouseenter="ensureJungleAnalysisReady"
            >
              {{ t('JunglePathing.title') }}
            </span>
          </div>
        </div>
      </div>

      <template v-for="column in extraColumns" :key="column.name">
        <!-- kda -->
        <div v-if="column.name === 'kda'" :class="column.class">
          <div class="text-xs">
            {{ participant.kills }}/{{ participant.deaths }}/{{ participant.assists }} ({{
              (participant.killParticipation * 100).toFixed(0)
            }}%)
          </div>
          <div class="text-[11px] text-black/60 dark:text-white/60">
            {{ participant.kda.toFixed(2) }} KDA
          </div>
        </div>

        <!-- augments (5) -->
        <div v-else-if="column.name === 'augments' && participant.augments" :class="column.class">
          <AugmentDisplay
            v-for="aug in participant.augments.slice(0, someoneHas6Augments ? 6 : 5)"
            :key="aug"
            :augment-id="aug"
            :size="20"
          />
        </div>

        <!-- dmg dealt / dmg taken -->
        <div v-else-if="column.name === 'damage'" :class="column.class">
          <DamageBarWithPopover
            :total-damage="participant.totalDamageDealtToChampions"
            :physical-damage="participant.physicalDamageDealtToChampions"
            :magic-damage="participant.magicDamageDealtToChampions"
            :true-damage="participant.trueDamageDealtToChampions"
            :baseline-damage="teams.allTeamStats.maxDamageDealtToChampions"
          />
          <DamageBarWithPopover
            :total-damage="participant.totalDamageTaken"
            :physical-damage="participant.physicalDamageTaken"
            :magic-damage="participant.magicDamageTaken"
            :true-damage="participant.trueDamageTaken"
            :baseline-damage="teams.allTeamStats.maxDamageTaken"
          />
        </div>

        <!-- cs -->
        <div v-else-if="column.name === 'cs'" :class="column.class">
          <div class="text-xs">{{ participant.cs }} {{ t('MatchCard.teamTable.cs') }}</div>
          <div class="text-[11px] text-black/60 dark:text-white/60">
            {{ (participant.cs / (basicInfo.gameDuration / 60)).toFixed(1) }}
            {{ t('MatchCard.teamTable.perMinuteSuffix') }}
          </div>
        </div>

        <!-- gold -->
        <div v-else-if="column.name === 'gold'" :class="column.class">
          <div class="text-xs">{{ (participant.goldEarned / 1000).toFixed(2) }}k</div>
          <div class="text-[11px] text-black/60 dark:text-white/60">
            {{ (participant.goldEarned / (basicInfo.gameDuration / 60)).toFixed(1) }}
            {{ t('MatchCard.teamTable.perMinuteSuffix') }}
          </div>
        </div>

        <!-- items -->
        <div v-else-if="column.name === 'items'" :class="column.class">
          <ItemDisplay
            :item-id="item"
            :size="20"
            v-for="(item, index) in participant.items.slice(0, 7)"
            :is-trinket="index === participant.items.length - 1"
            :key="item"
          />

          <ItemDisplay
            v-if="hasRoleBoundItems"
            :item-id="participant.roleBoundItem"
            :size="20"
            :key="participant.roleBoundItem"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import JunglePathingInfo from '@renderer-shared/components/ongoing-game-panel/widgets/JunglePathingInfo.vue'
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@renderer-shared/components/widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SgpRenderer } from '@renderer-shared/shards/sgp'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { EMPTY_PUUID } from '@shared/constants/common'
import { getFtueTargetJunglePathingMatchHistory } from '@shared/constants/ftue'
import {
  JunglePathingAnalysis,
  analyzeJunglePathing,
  filterJungleGames
} from '@shared/data-adapter/analysis/jungle'
import { toBasicInfo } from '@shared/data-adapter/match-history/match-basic'
import { toParticipants } from '@shared/data-adapter/match-history/participants'
import { LcuOrSgpGameDetails, LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { Robot } from '@vicons/fa'
import { useTranslation } from 'i18next-vue'
import { NIcon, NPopover, NTooltip } from 'naive-ui'
import { computed, markRaw, reactive, watchEffect } from 'vue'

import { useMatchCard } from '../context'
import Atakhan from '../icons/Atakhan.vue'
import Baron from '../icons/Baron.vue'
import Dragon from '../icons/Dragon.vue'
import Inhibitor from '../icons/Inhibitor.vue'
import RiftHerald from '../icons/RiftHerald.vue'
import Tower from '../icons/Tower.vue'
import VoidGrub from '../icons/VoidGrub.vue'
import { useGameResultName, usePosition, useTeamName } from '../utils/text'
import DamageBarWithPopover from './DamageBarWithPopover.vue'
import RadarChart from './RadarChart.vue'

interface ColumnConfig {
  name: string
  class: string
}

type JunglePathingTabKey = 'game' | 'hero' | 'overall'

interface LazyJunglePathingState {
  loading: boolean
  loaded: boolean
  loadPromise: Promise<void> | null
  summaries: LcuOrSgpGameSummary[]
  details: Record<number, LcuOrSgpGameDetails>
  overallAnalysis: JunglePathingAnalysis | null
  heroAnalysisByChampionId: Record<number, JunglePathingAnalysis | null>
}

const JUNGLE_ANALYSIS_SUMMARY_MAX = 20
const JUNGLE_ANALYSIS_DETAILS_MAX = 12
const NO_CHAMPION_ID = -1

const hasRoleBoundItems = computed(() => {
  return teamParticipants.value.some((p) => p.roleBoundItem)
})

const someoneHas6Augments = computed(() => {
  // 0 或 undefined 都算没有
  return teamParticipants.value.some((p) => p.augments[5])
})

const extraColumns = computed<ColumnConfig[]>(() => {
  switch (basicInfo.value.gameMode) {
    case 'CHERRY':
      return [
        { name: 'kda', class: 'min-w-[6.5rem] text-center' },
        { name: 'augments', class: 'min-w-[7.5rem] flex gap-0.5 justify-center' },
        { name: 'damage', class: 'min-w-32 flex gap-2 justify-center' },
        { name: 'cs', class: 'hidden @[740px]:block min-w-[4.5rem] text-center' },
        { name: 'gold', class: 'hidden @[700px]:block min-w-[4.5rem] text-xs text-center' },
        { name: 'items', class: 'w-40 flex gap-0.5 justify-center' }
      ]
    case 'KIWI':
      return [
        { name: 'kda', class: 'min-w-[6.5rem] text-center' },
        { name: 'augments', class: 'min-w-[7.25rem] flex gap-0.5 justify-center' },
        { name: 'damage', class: 'min-w-[7.5rem] flex gap-2 justify-center' },
        { name: 'cs', class: 'hidden @[740px]:block min-w-[4.5rem] text-center' },
        { name: 'gold', class: 'hidden @[700px]:block min-w-[4.5rem] text-xs text-center' },
        { name: 'items', class: 'min-w-40 flex gap-0.5 justify-center' }
      ]
    default:
      return [
        { name: 'kda', class: 'min-w-[6.5rem] text-center' },
        { name: 'damage', class: 'min-w-32 flex gap-2 justify-center' },
        { name: 'cs', class: 'hidden @[700px]:block w-[4.5rem] text-center' },
        { name: 'gold', class: 'min-w-[4.5rem] text-xs text-center' },
        {
          name: 'items',
          class: `${hasRoleBoundItems ? 'min-w-45' : 'min-w-40'} flex gap-0.5 justify-center`
        }
      ]
  }
})

const as = useAppCommonStore()
const { t } = useTranslation()

const tone = computed(() => {
  const k = team.value.winResult
  const borderClass = {
    win: 'dark:border-blue-200/10 border-blue-600/10',
    loss: 'dark:border-red-300/10 border-red-700/10',
    remake: 'dark:border-white/10 border-black/10',
    abort: 'dark:border-white/10 border-black/10'
  }[k]

  const headerClass = {
    win: 'dark:bg-blue-200/10 bg-blue-600/10',
    loss: 'dark:bg-red-300/10 bg-red-700/10',
    remake: 'dark:bg-white/10 bg-black/10',
    abort: 'dark:bg-white/10 bg-black/10'
  }[k]

  return { borderClass, headerClass }
})

const { teamIdentifier } = defineProps<{
  teamIdentifier: string
}>()

const {
  basicInfo,
  details,
  loadingDetails,
  loadDetails,
  teams,
  participants,
  puuid,
  summary,
  showJunglePathing,
  junglePathingDataSource,
  hidePrivacy,
  navigateToSummonerByPuuid
} = useMatchCard()

const lcs = useLeagueClientStore()
const sgps = useSgpStore()
const componentName = useComponentName()
const lc = useInstance(LeagueClientRenderer)
const sgp = useInstance(SgpRenderer)
const log = useInstance(LoggerRenderer)

const team = computed(() => {
  return teams.value.teamStatMap[teamIdentifier]
})

// 版本更新后，这个野怪被移除了
const someTeamHasAtakhan = computed(() => {
  return teams.value.teamStatsArr.some(
    (t) => t.teamInfo?.objectives.atakhan && (t.teamInfo.objectives.atakhan.kills || 0) > 0
  )
})

const teamParticipants = computed(() => {
  return participants.value.filter((p) => p.teamIdentifier === teamIdentifier)
})

const junglePathingFtueTarget = computed(() => {
  return getFtueTargetJunglePathingMatchHistory(basicInfo.value.gameId)
})

const handleMouseDown = (event: MouseEvent) => {
  if (event.button === 1) {
    event.preventDefault()
  }
}

const handleMouseUp = (event: MouseEvent, puuid: string) => {
  if (event.button === 1) {
    navigateToSummonerByPuuid(puuid, false)
  }
}

const teamName = useTeamName()
const gameResultName = useGameResultName()
const position = usePosition()

const isJunglePosition = (position: string) => {
  const p = position.toUpperCase()
  return p === 'JUNGLE' || p === 'JUG'
}

const ensureJungleAnalysisReady = () => {
  if (!details.value && !loadingDetails.value) {
    loadDetails(basicInfo.value.gameId)
  }
}

const junglePathingSourceContext = computed(() => {
  return {
    preferredSource:
      junglePathingDataSource.value?.preferredSource ||
      (summary.value.source === 'sgp' ? 'sgp' : 'lcu'),
    sgpServerId: junglePathingDataSource.value?.sgpServerId || sgps.availability.sgpServerId,
    isCrossRegion: junglePathingDataSource.value?.isCrossRegion || false
  }
})

const shouldUseSgpForJunglePathing = computed(() => {
  const ctx = junglePathingSourceContext.value
  return ctx.preferredSource === 'sgp' || ctx.isCrossRegion
})

const lazyJunglePathingByPuuid = reactive<Record<string, LazyJunglePathingState>>({})

const createLazyJunglePathingState = (): LazyJunglePathingState => {
  return {
    loading: false,
    loaded: false,
    loadPromise: null,
    summaries: [],
    details: {},
    overallAnalysis: null,
    heroAnalysisByChampionId: {}
  }
}

const getLazyJunglePathingState = (targetPuuid: string) => {
  if (!lazyJunglePathingByPuuid[targetPuuid]) {
    lazyJunglePathingByPuuid[targetPuuid] = createLazyJunglePathingState()
  }

  return lazyJunglePathingByPuuid[targetPuuid]
}

const findChampionIdByPuuid = (s: LcuOrSgpGameSummary, targetPuuid: string) => {
  const participant = toParticipants(s, toBasicInfo(s)).find((p) => p.puuid === targetPuuid)
  return participant?.championId
}

const fetchRecentMatchSummaries = async (targetPuuid: string): Promise<LcuOrSgpGameSummary[]> => {
  if (shouldUseSgpForJunglePathing.value) {
    const serverId = junglePathingSourceContext.value.sgpServerId
    const isServerSupported = !!sgps.leagueServers.servers[serverId]?.matchHistory
    if (!sgps.isTokenReady || !isServerSupported) {
      return []
    }

    const { data } = await sgp.api.matchHistoryQuery.getMatchHistorySummaryByPlayerPuuid(
      targetPuuid,
      {
        startIndex: 0,
        count: JUNGLE_ANALYSIS_SUMMARY_MAX,
        __sgpServerId: serverId
      }
    )

    return data.games
      .filter((g) => g.json)
      .map((g) => markRaw({ source: 'sgp', gameId: g.json.gameId, data: g }) as LcuOrSgpGameSummary)
  }

  const { data } = await lc.api.matchHistory.getMatchHistory(
    targetPuuid,
    0,
    JUNGLE_ANALYSIS_SUMMARY_MAX - 1
  )

  return data.games.games
    .filter((g) => !!g && typeof g.gameId === 'number')
    .map((g) => markRaw({ source: 'lcu', gameId: g.gameId, data: g }) as LcuOrSgpGameSummary)
}

const fetchMatchDetailByGameId = async (gameId: number): Promise<LcuOrSgpGameDetails | null> => {
  try {
    if (shouldUseSgpForJunglePathing.value) {
      const { data } = await sgp.api.matchHistoryQuery.getGameDetailsByGameId(gameId, {
        __sgpServerId: junglePathingSourceContext.value.sgpServerId
      })

      return markRaw({ source: 'sgp' as const, gameId, data })
    }

    const { data } = await lc.api.matchHistory.getTimeline(gameId)
    return markRaw({ source: 'lcu' as const, gameId, data })
  } catch (error) {
    log.warn(componentName, error)
    return null
  }
}

const buildHeroAnalysisFromLazyState = (
  state: LazyJunglePathingState,
  targetPuuid: string,
  championId: number
) => {
  if (state.heroAnalysisByChampionId[championId] !== undefined) {
    return
  }

  const detailGameIdSet = new Set<number>(Object.keys(state.details).map((id) => Number(id)))
  const detailSummaries = state.summaries.filter((s) => detailGameIdSet.has(s.gameId))
  const heroSummaries = detailSummaries.filter(
    (s) => findChampionIdByPuuid(s, targetPuuid) === championId
  )
  const heroDetails = heroSummaries
    .map((s) => state.details[s.gameId])
    .filter((d): d is LcuOrSgpGameDetails => !!d)

  if (heroDetails.length === 0) {
    state.heroAnalysisByChampionId[championId] = null
    return
  }

  state.heroAnalysisByChampionId[championId] =
    analyzeJunglePathing(heroDetails, heroSummaries, targetPuuid, championId) || null
}

const ensureExtendedJungleAnalysis = async (targetPuuid: string, championId?: number) => {
  const state = getLazyJunglePathingState(targetPuuid)

  if (!state.loaded) {
    if (!state.loadPromise) {
      state.loadPromise = (async () => {
        state.loading = true

        try {
          const summaries = await fetchRecentMatchSummaries(targetPuuid)
          const jungleGameIds = filterJungleGames(summaries, targetPuuid).slice(
            0,
            JUNGLE_ANALYSIS_DETAILS_MAX
          )
          const detailEntries = await Promise.all(
            jungleGameIds.map(async (gameId) => {
              return {
                gameId,
                detail: await fetchMatchDetailByGameId(gameId)
              }
            })
          )

          const details = detailEntries
            .map((entry) => entry.detail)
            .filter((d): d is LcuOrSgpGameDetails => !!d)
          const detailsMap = detailEntries.reduce(
            (acc, entry) => {
              if (entry.detail) {
                acc[entry.gameId] = entry.detail
              }
              return acc
            },
            {} as Record<number, LcuOrSgpGameDetails>
          )
          const detailGameIdSet = new Set(details.map((d) => d.gameId))
          const detailSummaries = summaries.filter((s) => detailGameIdSet.has(s.gameId))

          state.summaries = summaries
          state.details = detailsMap
          state.overallAnalysis =
            details.length > 0
              ? analyzeJunglePathing(details, detailSummaries, targetPuuid, NO_CHAMPION_ID)
              : null
          state.loaded = true
        } catch (error) {
          log.warn(componentName, error)
        } finally {
          state.loading = false
          state.loadPromise = null
        }
      })()
    }

    await state.loadPromise
  }

  if (championId !== undefined && state.loaded) {
    buildHeroAnalysisFromLazyState(state, targetPuuid, championId)
  }
}

const jungleAnalysisByPuuid = computed<Record<string, JunglePathingAnalysis>>(() => {
  const d = details.value
  if (!d) {
    return {}
  }

  const result: Record<string, JunglePathingAnalysis> = {}

  for (const p of participants.value) {
    if (!p.puuid || p.puuid === EMPTY_PUUID || !isJunglePosition(p.position || '')) {
      continue
    }

    const analysis = analyzeJunglePathing([d], [summary.value], p.puuid, p.championId)

    if (analysis) {
      result[p.puuid] = analysis
    }
  }

  return result
})

const buildJunglePathingTabs = (participant: (typeof participants.value)[number]) => {
  const state = lazyJunglePathingByPuuid[participant.puuid]
  const heroAnalysis = state?.heroAnalysisByChampionId[participant.championId]

  return [
    {
      key: 'game' as JunglePathingTabKey,
      label: t('JunglePathing.thisGame'),
      analysis: jungleAnalysisByPuuid.value[participant.puuid] || null,
      objectiveTextMode: 'single' as const
    },
    {
      key: 'hero' as JunglePathingTabKey,
      label: t('JunglePathing.hero'),
      analysis: heroAnalysis === undefined ? null : heroAnalysis,
      loading: !!state?.loading && heroAnalysis === undefined,
      objectiveTextMode: 'average' as const
    },
    {
      key: 'overall' as JunglePathingTabKey,
      label: t('JunglePathing.overall'),
      analysis: state?.overallAnalysis || null,
      loading: !!state?.loading && !state?.overallAnalysis,
      objectiveTextMode: 'average' as const
    }
  ]
}

const handleJunglePathingTabChange = (
  participant: (typeof participants.value)[number],
  tabKey: string
) => {
  if ((tabKey as JunglePathingTabKey) === 'game') {
    return
  }

  if (!participant.puuid || participant.puuid === EMPTY_PUUID) {
    return
  }

  void ensureExtendedJungleAnalysis(participant.puuid, participant.championId)
}

watchEffect(() => {
  if (
    showJunglePathing.value &&
    participants.value.some((p) => isJunglePosition(p.position || ''))
  ) {
    ensureJungleAnalysisReady()
  }
})
</script>

<style scoped>
@import '../match-card.css';
</style>
