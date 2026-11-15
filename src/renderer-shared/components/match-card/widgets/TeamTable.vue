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
              resources.runtime.locale
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
        {{ team.totalGoldEarned.toLocaleString() }}
      </div>

      <!-- team avg akari score -->
      <NPopover v-if="teamAvgAkariScore !== null">
        <template #trigger>
          <div
            class="flex cursor-default items-center gap-1 text-xs text-black/80 dark:text-white/80"
          >
            <span class="text-black/60 dark:text-white/60">Akari</span>
            <span class="font-bold">{{ teamAvgAkariScore.toFixed(2) }}</span>
            <NSpin v-if="loadingMultiGameScores" :size="10" class="ml-0.5" />
          </div>
        </template>
        <div class="text-xs">
          {{
            isMultiGameScoreActive
              ? t('matchCard.teamTable.avgMultiGameAkariScore', {
                  score: teamAvgAkariScore.toFixed(2)
                })
              : t('matchCard.teamTable.avgAkariScore', { score: teamAvgAkariScore.toFixed(2) })
          }}
        </div>
      </NPopover>

      <!-- objective -->
      <div v-if="team.teamInfo" class="flex gap-2">
        <div
          class="flex items-center gap-1 text-black/60 dark:text-white/60"
          :title="t('matchCard.teamTable.objectives.tower')"
        >
          <Tower class="size-3.5" />
          <span>{{ team.teamInfo.objectives.tower.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 text-black/60 dark:text-white/60"
          :title="t('matchCard.teamTable.objectives.inhibitor')"
        >
          <Inhibitor class="size-3.5" />
          <span>{{ team.teamInfo.objectives.inhibitor.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 text-black/60 dark:text-white/60"
          :title="t('matchCard.teamTable.objectives.dragon')"
        >
          <Dragon class="size-3.5" />
          <span>{{ team.teamInfo.objectives.dragon.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 text-black/60 dark:text-white/60"
          :title="t('matchCard.teamTable.objectives.baron')"
        >
          <Baron class="size-3.5" />
          <span>{{ team.teamInfo.objectives.baron.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 text-black/60 dark:text-white/60"
          :title="t('matchCard.teamTable.objectives.voidGrub')"
        >
          <VoidGrub class="size-3.5" />
          <span>{{ team.teamInfo.objectives.horde.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 text-black/60 dark:text-white/60"
          :title="t('matchCard.teamTable.objectives.riftHerald')"
        >
          <RiftHerald class="size-3.5" />
          <span>{{ team.teamInfo.objectives.riftHerald.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 text-black/60 dark:text-white/60"
          :title="t('matchCard.teamTable.objectives.atakhan')"
          v-if="someTeamHasAtakhan && team.teamInfo.objectives.atakhan"
        >
          <Atakhan class="size-3.5" />
          <span>{{ team.teamInfo.objectives.atakhan.kills }}</span>
        </div>
      </div>

      <!-- bans -->
      <div class="ml-auto flex" v-if="team.teamInfo && team.teamInfo.bans.length > 0">
        <div class="mr-1 text-xs text-black/60 dark:text-white/60">
          {{ t('matchCard.teamTable.bans') }}
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
      <div class="flex min-w-0 grow-2 basis-52 items-center gap-1">
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
          <div class="flex min-w-0 items-center gap-1">
            <NTooltip>
              <template #trigger>
                <div
                  class="flex min-w-0 cursor-pointer items-center gap-1 text-xs"
                  @click="navigateToSummonerByPuuid(participant.puuid)"
                  @mousedown="handleMouseDown"
                  @mouseup="handleMouseUp($event, participant.puuid)"
                  :class="{ 'font-bold text-black dark:text-white': participant.puuid === puuid }"
                >
                  <NIcon
                    class="shrink-0 text-black/80 dark:text-white/80"
                    v-if="!participant.puuid || participant.puuid === EMPTY_PUUID"
                  >
                    <Robot />
                  </NIcon>

                  <div class="truncate">
                    <template v-if="hidePrivacy">
                      {{ resources.champions.name(participant.championId) }}
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
                <span v-if="akariScoresByPuuid[participant.puuid]" class="text-white/70">
                  ({{ akariScoresByPuuid[participant.puuid].total.toFixed(2) }})
                </span>
              </div>
              <div class="flex items-center gap-1 text-xs" v-else>
                <span class="font-bold">{{
                  resources.champions.name(participant.championId)
                }}</span>
                <span v-if="akariScoresByPuuid[participant.puuid]" class="text-white/70">
                  ({{ akariScoresByPuuid[participant.puuid].total.toFixed(2) }})
                </span>
              </div>
            </NTooltip>

            <AkariScorePopover
              v-if="akariScoresByPuuid[participant.puuid]"
              :score="akariScoresByPuuid[participant.puuid]"
            >
              <span
                class="shrink-0 cursor-default text-xs font-normal text-black/60 tabular-nums hover:text-black dark:text-white/60 dark:hover:text-white"
                :class="{ 'font-bold': participant.puuid === puuid }"
              >
                ({{ akariScoresByPuuid[participant.puuid].total.toFixed(2) }})
              </span>
            </AkariScorePopover>
          </div>
          <div
            v-if="participant.position && participant.position.toLowerCase() !== 'invalid'"
            class="flex items-center gap-1 text-[11px] text-black/60 dark:text-white/60"
          >
            <span>{{ position(participant.position) }}</span>
          </div>
        </div>
      </div>

      <template v-for="column in extraColumns" :key="column.name">
        <!-- kda -->
        <div v-if="column.name === 'kda'" class="grow" :class="column.class">
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
        <div
          v-else-if="column.name === 'augments' && participant.augments"
          class="grow"
          :class="column.class"
        >
          <AugmentDisplay
            v-for="aug in participant.augments.slice(0, someoneHas6Augments ? 6 : 5)"
            :key="aug"
            :augment-id="aug"
            :size="20"
          />
        </div>

        <!-- dmg dealt / dmg taken -->
        <div v-else-if="column.name === 'damage'" class="grow" :class="column.class">
          <DamageBarWithPopover
            :total-damage="participant.totalDamageDealtToChampions"
            :team-total-damage="team.totalDamageDealtToChampions"
            :physical-damage="participant.physicalDamageDealtToChampions"
            :magic-damage="participant.magicDamageDealtToChampions"
            :true-damage="participant.trueDamageDealtToChampions"
            :baseline-damage="teams.allTeamStats.maxDamageDealtToChampions"
          />
          <DamageBarWithPopover
            metric="taken"
            :total-damage="participant.totalDamageTaken"
            :team-total-damage="team.totalDamageTaken"
            :physical-damage="participant.physicalDamageTaken"
            :magic-damage="participant.magicDamageTaken"
            :true-damage="participant.trueDamageTaken"
            :baseline-damage="teams.allTeamStats.maxDamageTaken"
          />
        </div>

        <!-- cs -->
        <div v-else-if="column.name === 'cs'" class="grow" :class="column.class">
          <div class="text-xs">{{ participant.cs }} {{ t('matchCard.teamTable.cs') }}</div>
          <div class="text-[11px] text-black/60 dark:text-white/60">
            {{ (participant.cs / (basicInfo.gameDuration / 60)).toFixed(1) }}
            {{ t('matchCard.teamTable.perMinuteSuffix') }}
          </div>
        </div>

        <!-- gold -->
        <div v-else-if="column.name === 'gold'" class="grow" :class="column.class">
          <div class="text-xs">{{ participant.goldEarned.toLocaleString() }}</div>
          <div class="text-[11px] text-black/60 dark:text-white/60">
            {{ (participant.goldEarned / (basicInfo.gameDuration / 60)).toFixed(1) }}
            {{ t('matchCard.teamTable.perMinuteSuffix') }}
          </div>
        </div>

        <!-- items -->
        <div v-else-if="column.name === 'items'" class="grow" :class="column.class">
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
import { AkariScorePopover } from '@renderer-shared/components/akari-score'
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@renderer-shared/components/widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { useAkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { EMPTY_PUUID } from '@shared/constants/common'
import { Robot } from '@vicons/fa'
import { useTranslation } from 'i18next-vue'
import { NIcon, NPopover, NSpin, NTooltip } from 'naive-ui'
import { computed } from 'vue'

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
        { name: 'kda', class: 'basis-26 min-w-26 text-center' },
        { name: 'augments', class: 'basis-30 min-w-30 flex gap-0.5 justify-center' },
        { name: 'damage', class: 'basis-32 min-w-32 flex gap-2 justify-center' },
        { name: 'cs', class: 'hidden @[740px]:block basis-18 min-w-18 text-center' },
        { name: 'gold', class: 'hidden @[700px]:block basis-18 min-w-18 text-xs text-center' },
        { name: 'items', class: 'basis-40 w-40 flex gap-0.5 justify-center' }
      ]
    case 'KIWI':
      return [
        { name: 'kda', class: 'basis-26 min-w-26 text-center' },
        { name: 'augments', class: 'basis-29 min-w-29 flex gap-0.5 justify-center' },
        { name: 'damage', class: 'basis-30 min-w-30 flex gap-2 justify-center' },
        { name: 'cs', class: 'hidden @[740px]:block basis-18 min-w-18 text-center' },
        { name: 'gold', class: 'hidden @[700px]:block basis-18 min-w-18 text-xs text-center' },
        { name: 'items', class: 'basis-40 min-w-40 flex gap-0.5 justify-center' }
      ]
    default:
      return [
        { name: 'kda', class: 'basis-26 min-w-26 text-center' },
        { name: 'damage', class: 'basis-32 min-w-32 flex gap-2 justify-center' },
        { name: 'cs', class: 'hidden @[700px]:block basis-18 w-18 text-center' },
        { name: 'gold', class: 'basis-18 min-w-18 text-xs text-center' },
        {
          name: 'items',
          class: `${hasRoleBoundItems.value ? 'basis-45 min-w-45' : 'basis-40 min-w-40'} flex gap-0.5 justify-center`
        }
      ]
  }
})

const resources = useAkariResourceProvider()
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
  teams,
  participants,
  puuid,
  hidePrivacy,
  navigateToSummonerByPuuid,
  akariScoresByPuuid,
  loadingMultiGameScores,
  isMultiGameScoreActive
} = useMatchCard()

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

const teamAvgAkariScore = computed(() => {
  if (teamParticipants.value.length === 0) {
    return null
  }

  let sum = 0
  let count = 0
  for (const p of teamParticipants.value) {
    const score = akariScoresByPuuid.value[p.puuid]
    if (score && Number.isFinite(score.total)) {
      sum += score.total
      count++
    }
  }

  return count > 0 ? sum / count : null
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
</script>

<style scoped>
@import '../match-card.css';
</style>
