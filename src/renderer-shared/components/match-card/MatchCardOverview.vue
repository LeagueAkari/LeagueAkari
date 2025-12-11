<template>
  <div
    v-if="participant && team"
    class="@container w-full h-29 flex rounded dark:border-white/20 border-black/20 b b-solid overflow-hidden select-none box-border transition-width dark:bg-neutral-900/95 bg-neutral-100/95"
  >
    <!-- main content -->
    <div class="relative flex gap-2 px-4 py-1 flex-1 min-w-0">
      <!-- stats content -->
      <div class="flex flex-col flex-1 justify-between my-1 z-2 min-w-0">
        <!-- 上半部分：英雄头像 + stats line -->
        <div class="flex gap-2 h-12">
          <!-- champion icon -->
          <div class="w-16 shrink-0 flex items-center">
            <div class="relative" :class="{ contents: !shouldShowCrown }">
              <ChampionIcon
                :champion-id="participant.championId"
                class="size-11 rounded-lg b-2 b-solid box-border relative -left-2px"
                :class="{
                  'dark:b-green-300 b-green-700': winStyleType === 'win',
                  'dark:b-red-300 b-red-600': winStyleType === 'loss',
                  'dark:b-white/80 b-black/80': winStyleType === 'neutral'
                }"
              />

              <!-- top1 头顶上方的皇冠 -->
              <div
                v-if="shouldShowCrown"
                class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <NIcon class="dark:text-yellow-500 text-orange-600">
                  <Crown />
                </NIcon>
              </div>
            </div>
          </div>

          <!-- stats line -->
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <!-- KDA -->
            <div class="min-w-22">
              <div class="flex gap-0.5 justify-center items-center">
                <div class="dark:text-white text-black font-bold text-base">
                  {{ participant.kills }}
                </div>
                <div class="dark:text-white/60 text-black/60 text-xs mx-0.25">/</div>
                <div class="dark:text-red-300 text-red-600 font-bold text-base">
                  {{ participant.deaths }}
                </div>
                <div class="dark:text-white/60 text-black/60 text-xs mx-0.25">/</div>
                <div class="dark:text-white text-black font-bold text-base">
                  {{ participant.assists }}
                </div>
              </div>

              <!-- KDA value -->
              <div
                class="flex justify-center dark:text-yellow-200 text-yellow-700 text-xs"
                v-if="
                  participant.deaths === 0 && (participant.kills > 0 || participant.assists > 0)
                "
              >
                {{ t('MatchCard.overview.perfect') }}
                ({{ (participant.killParticipation * 100).toFixed(0) }}%)
              </div>

              <div class="flex justify-center gap-1" v-else>
                <div class="dark:text-white/80 text-black/80 text-xs">
                  {{ participant.kda.toFixed(2) }}
                </div>
                <div class="dark:text-white/60 text-black/60 text-xs">KDA</div>
                <div class="dark:text-white/80 text-black/80 text-xs">
                  ({{ (participant.killParticipation * 100).toFixed(0) }}%)
                </div>
              </div>
            </div>

            <!-- DMG -->
            <NPopover>
              <template #trigger>
                <div class="min-w-22">
                  <div class="text-center font-bold text-base">
                    {{
                      (
                        (participant.totalDamageDealtToChampions /
                          (teams.teamStatMap[participant.teamIdentifier]
                            .totalDamageDealtToChampions || 1)) *
                        100
                      ).toFixed(0)
                    }}%
                  </div>

                  <div class="flex justify-center gap-1">
                    <div class="dark:text-white/80 text-black/80 text-xs">
                      {{ participant.totalDamageDealtToChampions.toLocaleString() }}
                    </div>
                    <div class="dark:text-white/60 text-black/60 text-xs">
                      {{ t('MatchCard.overview.damage') }}
                    </div>
                  </div>
                </div>
              </template>
              <RadarChart :puuid="puuid" />
            </NPopover>

            <!-- spacer -->
            <div class="w-0"></div>

            <!-- spells + runes -->
            <div v-if="displayParts.spells || displayParts.runes" class="flex gap-0.5">
              <!-- spells -->
              <div
                v-if="displayParts.spells && (participant.spells[0] || participant.spells[1])"
                class="flex flex-col gap-0.5"
              >
                <SummonerSpellDisplay :spell-id="participant.spells[0]" :size="20" />
                <SummonerSpellDisplay :spell-id="participant.spells[1]" :size="20" />
              </div>

              <!-- runes / styles -->
              <div v-if="displayParts.runes && perks" class="flex flex-col gap-0.5">
                <PerkDisplay :perk-id="perks.primaryPerkId" :size="20" />
                <PerkstyleDisplay :perkstyle-id="perks.subPerkStyleId" :size="20" />
              </div>
            </div>

            <!-- augments -->
            <div v-if="displayParts.augments" class="hidden @[680px]:grid gap-0.5 grid-cols-3">
              <AugmentDisplay
                v-for="augment of participant.augments"
                :key="augment"
                :augment-id="augment"
                :size="20"
              />
            </div>

            <!-- items area -->
            <div v-if="displayParts.items" class="flex gap-0.5">
              <!-- items, 2 rows, 3 cols -->
              <div class="grid grid-cols-3 grid-rows-2 gap-0.5">
                <ItemDisplay
                  v-for="item of participant.items.slice(0, 6)"
                  :key="item"
                  :item-id="item"
                  :size="20"
                />
              </div>

              <!-- trinket -->
              <div class="flex flex-col gap-0.5">
                <ItemDisplay :item-id="participant.items[6]" :size="20" class="!rounded-full" />
                <div class="size-5 invisible"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 下半部分：胜利结果 + tags -->
        <div class="flex gap-2 items-center">
          <!-- result -->
          <div class="min-w-16 shrink-0">
            <div
              :class="{
                'dark:text-green-300 text-green-700': winStyleType === 'win',
                'dark:text-red-300 text-red-700': winStyleType === 'loss',
                'dark:text-white text-black/80': winStyleType === 'neutral'
              }"
              class="font-bold leading-none text-sm"
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
          </div>

          <!-- tags line -->
          <div class="flex-1 min-w-0">
            <ManyTags />
          </div>
        </div>

        <!-- info line -->
        <div class="flex">
          <!-- queue name -->
          <div class="dark:text-white/80 text-black text-xs">
            {{ lcs.gameData.queueName(basicInfo.queueId) }}
          </div>
          <div class="dark:text-white/40 text-black/40 text-xs mx-1">·</div>

          <!-- duration hh:mm:ss (pad 0) -->
          <!-- advanced: from -> to -->
          <div class="dark:text-white/60 text-black/80 text-xs">
            {{ formatSeconds(basicInfo.gameDuration) }}
          </div>
          <div class="dark:text-white/40 text-black/60 text-xs mx-1">·</div>

          <!-- should show the specific time if hover -->
          <div class="dark:text-white/60 text-black/80 text-xs" :title="gameCreationTitle">
            {{ formattedRelativeTime }}
          </div>
          <div class="dark:text-white/40 text-black/60 text-xs mx-1">·</div>
          <div class="dark:text-white/60 text-black/80 text-xs truncate flex-1">
            {{ mapName }}
          </div>
        </div>
      </div>

      <!-- player list (5x5 team only) -->
      <div v-if="basicInfo.isTwoTeam" class="flex gap-2 max-w-42 w-42 z-2 my-1">
        <!-- teams -->
        <div
          v-for="team of twoTeams"
          :key="team[0].teamIdentifier"
          class="flex flex-col gap-0.5 flex-1 min-w-0 justify-between"
        >
          <!-- team players -->
          <div
            v-for="player in team"
            :key="player.puuid"
            class="flex gap-1 items-center group cursor-pointer"
          >
            <!-- player champion avatar -->
            <ChampionIcon :champion-id="player.championId" class="size-4 shrink-0 rounded" />

            <!-- maybe a bot player -->
            <NIcon
              class="dark:text-white/80 text-black/80"
              v-if="!player.puuid || player.puuid === EMPTY_PUUID"
            >
              <Robot />
            </NIcon>

            <NTooltip :keep-alive-on-hover="false">
              <template #trigger>
                <div
                  class="text-xs truncate dark:group-hover:text-white group-hover:text-black transition-colors"
                  :class="{
                    'font-bold dark:text-white/90 text-black/90': player.puuid === puuid,
                    'dark:text-white/80 text-black/80': player.puuid !== puuid
                  }"
                  @click="onNavigateToSummonerByPuuid(player.puuid)"
                  @mousedown="handleMouseDown"
                  @mouseup="handleMouseUp($event, player.puuid)"
                >
                  {{ hidePrivacy ? lcs.gameData.championName(player.championId) : player.gameName }}
                </div>
              </template>
              <div class="flex items-center gap-1 text-xs" v-if="!hidePrivacy">
                <span class="font-bold">{{ player.gameName }}</span>
                <span v-if="player.tagLine" class="text-white/80">#{{ player.tagLine }}</span>
              </div>
              <div class="flex items-center gap-1 text-xs" v-else>
                <span class="font-bold">{{ lcs.gameData.championName(player.championId) }}</span>
              </div>
            </NTooltip>
          </div>
        </div>
      </div>

      <div
        v-else-if="basicInfo.isCherrySubteam"
        class="grid grid-cols-2 grid-rows-2 gap-x-2 max-w-42 w-42 z-2 my-1"
      >
        <!-- teams -->
        <div
          v-for="team of cherryTop4Teams"
          :key="team[0].teamIdentifier"
          class="flex flex-col gap-1 justify-center min-w-0"
        >
          <!-- team players -->
          <div
            v-for="player in team"
            :key="player.puuid"
            class="flex gap-1 items-center group cursor-pointer"
          >
            <!-- placement -->
            <div
              class="shrink-0 dark:text-white/80 text-black/80 text-11px bg-black/10 dark:bg-white/10 rounded-full size-4 leading-4 text-center"
            >
              {{ player.subteamPlacement }}
            </div>

            <!-- player champion avatar -->
            <ChampionIcon :champion-id="player.championId" class="size-4 shrink-0 rounded" />

            <NIcon
              class="dark:text-white/80 text-black/80"
              v-if="!player.puuid || player.puuid === EMPTY_PUUID"
            >
              <Robot />
            </NIcon>

            <NTooltip :keep-alive-on-hover="false">
              <template #trigger>
                <div
                  class="text-xs truncate dark:group-hover:text-white group-hover:text-black transition-colors"
                  :class="{
                    'font-bold dark:text-white/90 text-black/90': player.puuid === puuid,
                    'dark:text-white/80 text-black/80': player.puuid !== puuid
                  }"
                  @click="onNavigateToSummonerByPuuid(player.puuid)"
                  @mousedown="handleMouseDown"
                  @mouseup="handleMouseUp($event, player.puuid)"
                >
                  {{ hidePrivacy ? lcs.gameData.championName(player.championId) : player.gameName }}
                </div>
              </template>
              <div class="flex items-center gap-1 text-xs" v-if="!hidePrivacy">
                <span class="font-bold">{{ player.gameName }}</span>
                <span v-if="player.tagLine" class="text-white/80">#{{ player.tagLine }}</span>
              </div>
              <div class="flex items-center gap-1 text-xs" v-else>
                <span class="font-bold">{{ lcs.gameData.championName(player.championId) }}</span>
              </div>
            </NTooltip>
          </div>
        </div>
      </div>

      <!-- shadow for win / loss -->
      <div
        class="absolute top-0 left-0 h-full w-full z-1"
        :class="{
          'shadow-win': winStyleType === 'win',
          'shadow-loss': winStyleType === 'loss',
          'shadow-remake': winStyleType === 'neutral'
        }"
      ></div>
    </div>

    <!-- right-end expand icon -->
    <div
      @click="$emit('toggle-expand')"
      class="b-l b-l-solid dark:b-l-white/10 b-l-black/10 w-8 transition-colors dark:bg-white/5 bg-black/5 hover:dark:bg-white/10 hover:bg-black/10 active:dark:bg-white/5 active:bg-black/5 cursor-pointer [writing-mode:vertical-rl] flex items-center justify-center"
    >
      <NIcon
        class="dark:text-white/60 text-black/60 text-base"
        :class="{ '-rotate-90': !isExpanded, 'rotate-90': isExpanded }"
      >
        <ArrowBackIosFilled />
      </NIcon>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { EMPTY_PUUID } from '@shared/constants/common'
import { Crown, Robot } from '@vicons/fa'
import { ArrowBackIosFilled } from '@vicons/material'
import { useIntervalFn } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import { NIcon, NPopover, NTooltip } from 'naive-ui'
import { computed, ref } from 'vue'

import AugmentDisplay from '../widgets/AugmentDisplay.vue'
import ChampionIcon from '../widgets/ChampionIcon.vue'
import ItemDisplay from '../widgets/ItemDisplay.vue'
import PerkDisplay from '../widgets/PerkDisplay.vue'
import PerkstyleDisplay from '../widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '../widgets/SummonerSpellDisplay.vue'
import { useMatchCard } from './context'
import { useGameResultName } from './utils/text'
import { formatSeconds } from './utils/time'
import ManyTags from './widgets/ManyTags.vue'
import RadarChart from './widgets/RadarChart.vue'

defineEmits<{
  'toggle-expand': []
}>()

const {
  puuid,
  basicInfo,
  teams,
  participants,
  isExpanded,
  hidePrivacy,
  onNavigateToSummonerByPuuid
} = useMatchCard()

const gameResultName = useGameResultName()

const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const { t } = useTranslation()

// 典型的 100 / 200 红蓝队方法
const twoTeams = computed(() => {
  if (!basicInfo.value.isTwoTeam) return []

  const teamIdentifiers = teams.value.teamStatsArr.map((t) => t.teamIdentifier).slice(0, 2)
  return teamIdentifiers.map((i) => {
    return participants.value.filter((s) => s.teamIdentifier === i).slice(0, 5) // 5 是战绩卡片的最大容纳量
  })
})

const cherryTop4Teams = computed(() => {
  if (!basicInfo.value.isCherrySubteam) return []

  const teamIdentifiers = teams.value.teamStatsArr
    .filter((t) => t.subteamPlacement <= 4)
    .toSorted((a, b) => a.subteamPlacement - b.subteamPlacement)
    .map((t) => t.teamIdentifier)

    .slice(0, 4)

  return teamIdentifiers.map((i) => {
    return participants.value.filter((s) => s.teamIdentifier === i).slice(0, 2)
  })
})

const shouldShowCrown = computed(() => {
  return participant.value?.subteamPlacement === 1
})

// 自己相关的数据
const participant = computed(() => {
  return participants.value.find((s) => s.puuid === puuid.value)
})

const team = computed(() => {
  if (!participant.value) return null

  return teams.value.teamStatMap[participant.value.teamIdentifier]
})

const perks = computed(() => {
  if (!participant.value) return null

  const { styles } = participant.value.perks

  const primaryStyle = styles[0]
  const subStyle = styles[1]

  // no id 0, no null
  if (!primaryStyle || !subStyle || !primaryStyle.selections[0]?.perk || !subStyle.style) {
    return null
  }

  return {
    primaryPerkId: primaryStyle.selections[0].perk,
    subPerkStyleId: subStyle.style
  }
})

// UI 有些地方可以不用展示
const displayParts = computed(() => {
  return {
    spells: basicInfo.value.gameMode !== 'CHERRY',
    augments: basicInfo.value.gameMode === 'CHERRY' || basicInfo.value.gameMode === 'KIWI',
    runes: basicInfo.value.gameMode !== 'CHERRY' && basicInfo.value.gameMode !== 'KIWI',
    items: true
  }
})

const mapName = computed(() => {
  const mutators = lcs.gameData.gameModeMutators[basicInfo.value.mapId]

  if (!mutators) return lcs.gameData.mapName(basicInfo.value.mapId)

  const mutator = mutators.Mutators.find((m) =>
    basicInfo.value.gameModeMutators?.some(
      (g) => m.Mutator.ExpandedMutator.toLowerCase() === g.toLowerCase()
    )
  )

  if (mutator) {
    return mutator.MapNameOverride
  }

  return mutators.MapNameBase
})

const winStyleType = computed(() => {
  if (!team.value) {
    return 'neutral'
  }

  if (
    basicInfo.value.gameMode === 'PRACTICETOOL' ||
    team.value.winResult === 'remake' ||
    team.value.winResult === 'abort'
  ) {
    return 'neutral'
  }

  if (team.value.winResult === 'win') {
    return 'win'
  }

  return 'loss'
})

const formattedRelativeTime = ref('')
const gameCreationTitle = computed(() => {
  return dayjs(basicInfo.value.gameCreation).format('YYYY-MM-DD HH:mm:ss:SSS')
})

useIntervalFn(
  () => {
    const date = dayjs(basicInfo.value.gameCreation).locale(as.settings.locale.toLowerCase())
    if (dayjs().diff(date, 'day', true) > 3) {
      formattedRelativeTime.value = date.format('YYYY-MM-DD HH:mm')
    } else {
      formattedRelativeTime.value = date.fromNow()
    }
  },
  60000,
  { immediateCallback: true, immediate: true }
)

const handleMouseDown = (event: MouseEvent) => {
  if (event.button === 1) {
    event.preventDefault()
  }
}

const handleMouseUp = (event: MouseEvent, puuid: string) => {
  if (event.button === 1) {
    onNavigateToSummonerByPuuid(puuid, false)
  }
}
</script>

<style scoped>
@import './match-card.css';
</style>
