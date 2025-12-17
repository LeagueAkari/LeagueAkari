<template>
  <div
    v-if="participant && team"
    class="transition-width @container box-border flex h-29 w-full overflow-hidden rounded border border-solid border-black/20 bg-neutral-100/95 select-none dark:border-white/20 dark:bg-neutral-900/95"
  >
    <!-- main content -->
    <div class="relative flex min-w-0 flex-1 gap-2 px-4 py-1">
      <!-- stats content -->
      <div class="z-2 my-1 flex min-w-0 flex-1 flex-col justify-between">
        <!-- 上半部分：英雄头像 + stats line -->
        <div class="flex h-12 gap-2">
          <!-- champion icon -->
          <div class="flex w-16 shrink-0 items-center">
            <div class="relative" :class="{ contents: !shouldShowCrown }">
              <ChampionIcon
                :champion-id="participant.championId"
                class="relative -left-[2px] box-border size-11 rounded-lg border-2 border-solid"
                :class="{
                  'border-green-700 dark:border-green-300': winStyleType === 'win',
                  'border-red-600 dark:border-red-300': winStyleType === 'loss',
                  'border-black/80 dark:border-white/80': winStyleType === 'neutral'
                }"
              />

              <!-- top1 头顶上方的皇冠 -->
              <div
                v-if="shouldShowCrown"
                class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <NIcon class="text-orange-600 dark:text-yellow-500">
                  <Crown />
                </NIcon>
              </div>
            </div>
          </div>

          <!-- stats line -->
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <!-- KDA -->
            <div class="min-w-22">
              <div class="flex items-center justify-center gap-0.5">
                <div class="text-base font-bold text-black dark:text-white">
                  {{ participant.kills }}
                </div>
                <div class="mx-0.25 text-xs text-black/60 dark:text-white/60">/</div>
                <div class="text-base font-bold text-red-600 dark:text-red-300">
                  {{ participant.deaths }}
                </div>
                <div class="mx-0.25 text-xs text-black/60 dark:text-white/60">/</div>
                <div class="text-base font-bold text-black dark:text-white">
                  {{ participant.assists }}
                </div>
              </div>

              <!-- KDA value -->
              <div
                class="flex justify-center text-xs text-yellow-700 dark:text-yellow-200"
                v-if="
                  participant.deaths === 0 && (participant.kills > 0 || participant.assists > 0)
                "
              >
                {{ t('MatchCard.overview.perfect') }}
                ({{ (participant.killParticipation * 100).toFixed(0) }}%)
              </div>

              <div class="flex justify-center gap-1" v-else>
                <div class="text-xs text-black/80 dark:text-white/80">
                  {{ participant.kda.toFixed(2) }}
                </div>
                <div class="text-xs text-black/60 dark:text-white/60">KDA</div>
                <div class="text-xs text-black/80 dark:text-white/80">
                  ({{ (participant.killParticipation * 100).toFixed(0) }}%)
                </div>
              </div>
            </div>

            <!-- DMG -->
            <NPopover>
              <template #trigger>
                <div class="min-w-22">
                  <div class="text-center text-base font-bold">
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
                    <div class="text-xs text-black/80 dark:text-white/80">
                      {{ participant.totalDamageDealtToChampions.toLocaleString() }}
                    </div>
                    <div class="text-xs text-black/60 dark:text-white/60">
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
            <div v-if="displayParts.augments" class="hidden grid-cols-3 gap-0.5 @[680px]:grid">
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
                <ItemDisplay :item-id="participant.items[6]" :size="20" class="rounded-full!" />
                <div class="invisible size-5"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 下半部分：胜利结果 + tags -->
        <div class="flex items-center gap-2">
          <!-- result -->
          <div class="min-w-16 shrink-0">
            <div
              :class="{
                'text-green-700 dark:text-green-300': winStyleType === 'win',
                'text-red-700 dark:text-red-300': winStyleType === 'loss',
                'text-black/80 dark:text-white': winStyleType === 'neutral'
              }"
              class="text-sm leading-none font-bold"
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
          <div class="min-w-0 flex-1">
            <ManyTags />
          </div>
        </div>

        <!-- info line -->
        <div class="flex">
          <!-- queue name -->
          <div class="text-xs text-black dark:text-white/80">
            {{ lcs.gameData.queueName(basicInfo.queueId) }}
          </div>
          <div class="mx-1 text-xs text-black/40 dark:text-white/40">·</div>

          <!-- duration hh:mm:ss (pad 0) -->
          <!-- advanced: from -> to -->
          <div class="text-xs text-black/80 dark:text-white/60">
            {{ formatSeconds(basicInfo.gameDuration) }}
          </div>
          <div class="mx-1 text-xs text-black/60 dark:text-white/40">·</div>

          <!-- should show the specific time if hover -->
          <div class="text-xs text-black/80 dark:text-white/60" :title="gameCreationTitle">
            {{ formattedRelativeTime }}
          </div>
          <div class="mx-1 text-xs text-black/60 dark:text-white/40">·</div>
          <div class="flex-1 truncate text-xs text-black/80 dark:text-white/60">
            {{ mapName }}
          </div>
        </div>
      </div>

      <!-- player list (5x5 team only) -->
      <div v-if="basicInfo.isTwoTeam" class="z-2 my-1 flex w-42 max-w-42 gap-2">
        <!-- teams -->
        <div
          v-for="team of twoTeams"
          :key="team[0].teamIdentifier"
          class="flex min-w-0 flex-1 flex-col justify-between gap-0.5"
        >
          <!-- team players -->
          <div
            v-for="player in team"
            :key="player.puuid"
            class="group flex cursor-pointer items-center gap-1"
          >
            <!-- player champion avatar -->
            <ChampionIcon :champion-id="player.championId" class="size-4 shrink-0 rounded" />

            <!-- maybe a bot player -->
            <NIcon
              class="text-black/80 dark:text-white/80"
              v-if="!player.puuid || player.puuid === EMPTY_PUUID"
            >
              <Robot />
            </NIcon>

            <NTooltip :keep-alive-on-hover="false">
              <template #trigger>
                <div
                  class="truncate text-xs transition-colors group-hover:text-black dark:group-hover:text-white"
                  :class="{
                    'font-bold text-black/90 dark:text-white/90': player.puuid === puuid,
                    'text-black/80 dark:text-white/80': player.puuid !== puuid
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
        class="z-2 my-1 grid w-42 max-w-42 grid-cols-2 grid-rows-2 gap-x-2"
      >
        <!-- teams -->
        <div
          v-for="team of cherryTop4Teams"
          :key="team[0].teamIdentifier"
          class="flex min-w-0 flex-col justify-center gap-1"
        >
          <!-- team players -->
          <div
            v-for="player in team"
            :key="player.puuid"
            class="group flex cursor-pointer items-center gap-1"
          >
            <!-- placement -->
            <div
              class="size-4 shrink-0 rounded-full bg-black/10 text-center text-[11px] leading-4 text-black/80 dark:bg-white/10 dark:text-white/80"
            >
              {{ player.subteamPlacement }}
            </div>

            <!-- player champion avatar -->
            <ChampionIcon :champion-id="player.championId" class="size-4 shrink-0 rounded" />

            <NIcon
              class="text-black/80 dark:text-white/80"
              v-if="!player.puuid || player.puuid === EMPTY_PUUID"
            >
              <Robot />
            </NIcon>

            <NTooltip :keep-alive-on-hover="false">
              <template #trigger>
                <div
                  class="truncate text-xs transition-colors group-hover:text-black dark:group-hover:text-white"
                  :class="{
                    'font-bold text-black/90 dark:text-white/90': player.puuid === puuid,
                    'text-black/80 dark:text-white/80': player.puuid !== puuid
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
        class="absolute top-0 left-0 z-1 h-full w-full"
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
      class="flex w-8 cursor-pointer items-center justify-center border-t-0 border-r-0 border-b-0 border-l border-solid border-l-black/10 bg-black/5 transition-colors hover:bg-black/10 active:bg-black/5 dark:border-l-white/10 dark:bg-white/5 hover:dark:bg-white/10 active:dark:bg-white/5"
    >
      <NIcon
        class="text-base text-black/60 dark:text-white/60"
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
