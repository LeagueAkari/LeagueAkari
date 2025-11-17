<template>
  <!-- summary card -->
  <div
    v-if="participant && team"
    :style="{ width: `${width}px` }"
    class="@container h-27 flex rounded dark:border-white/20 border-black/20 border border-solid select-none box-border transition-[width]"
  >
    <!-- main content -->
    <div class="relative flex gap-2 px-3 py-2 flex-1">
      <!-- stats content -->
      <div class="flex flex-col flex-1 justify-between">
        <!-- 上半部分：英雄头像 + stats line -->
        <div class="flex gap-2 h-12">
          <!-- champion icon -->
          <div class="w-16 shrink-0">
            <ChampionIcon
              :champion-id="participant.championId"
              class="size-12 rounded-lg b-2 b-solid box-border"
              :class="{
                'dark:b-green-300 b-green-700': team.winResult === 'win',
                'dark:b-red-300 b-red-600': team.winResult === 'lose',
                'dark:b-white/80 b-black/80':
                  team.winResult === 'remake' || team.winResult === 'abort'
              }"
            />
          </div>

          <!-- stats line -->
          <div class="flex items-center gap-2 flex-1">
            <!-- KDA -->
            <div class="w-20">
              <div class="flex gap-0.5 justify-center items-center">
                <div class="dark:text-white text-black font-bold text-base">
                  {{ participant.kills }}
                </div>
                <div class="dark:text-white/60 text-black/60 text-xs mx-0.5">/</div>
                <div class="dark:text-red-300 text-red-600 font-bold text-base">
                  {{ participant.deaths }}
                </div>
                <div class="dark:text-white/60 text-black/60 text-xs mx-0.5">/</div>
                <div class="dark:text-white text-black font-bold text-base">
                  {{ participant.assists }}
                </div>
              </div>

              <!-- KDA value -->
              <div
                class="flex justify-center dark:text-yellow-200 text-yellow-500 text-xs"
                v-if="participant.deaths === 0"
              >
                Perfect
              </div>

              <div class="flex justify-center gap-1" v-else>
                <div class="dark:text-white/80 text-black/80 text-xs">
                  {{ participant.kda.toFixed(2) }}
                </div>
                <div class="dark:text-white/60 text-black/60 text-xs">KDA</div>
              </div>
            </div>

            <!-- DMG -->
            <NPopover>
              <template #trigger>
                <div class="w-20">
                  <div class="text-center font-bold text-base">
                    {{
                      (
                        (participant.totalDamageDealtToChampions /
                          teams.teamStatMap[participant.teamIdentifier]
                            .totalDamageDealtToChampions) *
                        100
                      ).toFixed(0)
                    }}%
                  </div>

                  <div class="flex justify-center gap-1">
                    <div class="dark:text-white/80 text-black/80 text-xs">
                      {{ participant.totalDamageDealtToChampions.toLocaleString() }}
                    </div>
                    <div class="dark:text-white/60 text-black/60 text-xs">伤害</div>
                  </div>
                </div>
              </template>
              <RadarChart :puuid="puuid" />
            </NPopover>

            <!-- spacer -->
            <div class="w-2"></div>

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
            <div v-if="displayParts.augments" class="hidden @[700px]:grid gap-0.5 grid-cols-3">
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
                'dark:text-green-300 text-green-700': team.winResult === 'win',
                'dark:text-red-300 text-red-700': team.winResult === 'lose',
                'dark:text-white text-black/80':
                  team.winResult === 'remake' || team.winResult === 'abort'
              }"
              class="font-bold leading-none text-sm"
            >
              {{ gameResultName(team.winResult, team.isSurrender) }}
            </div>
          </div>

          <!-- tags line -->
          <div class="flex-1">
            <ManyTags />
          </div>
        </div>

        <!-- info line -->
        <div class="flex">
          <!-- queue name -->
          <div class="dark:text-white/80 text-black/80 text-xs">
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
          <div class="dark:text-white/60 text-black/80 text-xs">
            {{ formattedRelativeTime }}
          </div>
          <div class="dark:text-white/40 text-black/60 text-xs mx-1">·</div>
          <div class="dark:text-white/60 text-black/80 text-xs truncate flex-1">
            {{ mapName }}
          </div>
        </div>
      </div>

      <!-- player list (5x5 team only) -->
      <div v-if="basicInfo.isTwoTeam" class="flex gap-2 max-w-42">
        <!-- teams -->
        <div
          v-for="team of twoTeams"
          :key="team[0].teamId"
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

            <NTooltip>
              <template #trigger>
                <div
                  class="text-xs truncate dark:group-hover:text-white group-hover:text-black transition-colors"
                  :class="{
                    'font-bold dark:text-white/80 text-black/80': player.puuid === puuid,
                    'dark:text-white/60 text-black/60': player.puuid !== puuid
                  }"
                >
                  {{ player.gameName }}
                </div>
              </template>
              <div class="flex items-center gap-1 text-xs">
                <span class="font-bold">{{ player.gameName }}</span>
                <span v-if="player.tagLine" class="text-white/80">#{{ player.tagLine }}</span>
              </div>
            </NTooltip>
          </div>
        </div>
      </div>

      <!-- shadow for win / lose -->
      <div
        class="absolute top-0 left-0 h-full w-full z-[-1]"
        :class="{
          'shadow-win': team.winResult === 'win',
          'shadow-lose': team.winResult === 'lose',
          'shadow-remake': team.winResult === 'remake' || team.winResult === 'abort'
        }"
      ></div>
    </div>

    <!-- right-end expand icon -->
    <div
      @click="$emit('toggle-expand')"
      class="b-l b-l-solid dark:b-l-white/10 b-l-black/10 w-8 transition-colors dark:bg-white/5 bg-black/5 hover:dark:bg-white/10 hover:bg-black/10 active:dark:bg-white/5 active:bg-black/5 cursor-pointer [writing-mode:vertical-rl] flex items-center justify-center"
    >
      Expand+
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useIntervalFn } from '@vueuse/core'
import dayjs from 'dayjs'
import { NPopover, NTooltip } from 'naive-ui'
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

const { width = 720 } = defineProps<{
  width?: number
}>()

defineEmits<{
  'toggle-expand': []
}>()

const { puuid, basicInfo, teams, participants } = useMatchCard()

const gameResultName = useGameResultName()

const as = useAppCommonStore()
const lcs = useLeagueClientStore()

// 典型的 100 / 200 红蓝队方法
const twoTeams = computed(() => {
  if (basicInfo.value.isTwoTeam) {
    const teamIdentifiers = Object.keys(teams.value.teamStatMap)
    return teamIdentifiers.map((i) => {
      return participants.value.filter((s) => s.teamIdentifier === i).slice(0, 5) // 5 是战绩卡片的最大容纳量
    })
  }

  return []
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
    basicInfo.value.gameModeMutators.some(
      (g) => m.Mutator.ExpandedMutator.toLowerCase() === g.toLowerCase()
    )
  )

  if (mutator) {
    return `${mutators.MapNameBase} (${mutator.MapNameOverride})`
  }

  return lcs.gameData.mapName(basicInfo.value.mapId)
})

const formattedRelativeTime = ref('')

useIntervalFn(
  () => {
    formattedRelativeTime.value = dayjs(basicInfo.value.gameCreation)
      .locale(as.settings.locale.toLowerCase())
      .fromNow()
  },
  60000,
  { immediateCallback: true, immediate: true }
)
</script>

<style scoped>
@import './match-card.css';
</style>
