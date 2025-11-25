<template>
  <div class="@container b b-solid rounded" :class="tone.borderClass">
    <!-- header -->
    <div class="box-border flex items-center gap-4 h-8 text-xs p-2" :class="tone.headerClass">
      <!-- team name -->
      <div class="flex items-center gap-1">
        <div
          class="text-xs font-bold"
          :class="{
            'dark:text-green-300 text-green-700': team.winResult === 'win',
            'dark:text-red-300 text-red-700': team.winResult === 'lose',
            'dark:text-white/80 text-black/80':
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
      <div class="text-xs dark:text-white/80 text-black/80">
        {{ team.totalKills }}/{{ team.totalDeaths }}/{{ team.totalAssists }}
      </div>

      <div class="text-xs dark:text-white/80 text-black/80">
        {{ (team.totalGoldEarned / 1000).toFixed(2) }} k
      </div>

      <!-- objective -->
      <div v-if="team.teamInfo" class="flex gap-2">
        <div class="flex items-center gap-1 dark:text-white/60 text-black/60" title="防御塔">
          <Tower class="size-3.5" />
          <span>{{ team.teamInfo.objectives.tower.kills }}</span>
        </div>
        <div class="flex items-center gap-1 dark:text-white/60 text-black/60" title="水晶">
          <Inhibitor class="size-3.5" />
          <span>{{ team.teamInfo.objectives.inhibitor.kills }}</span>
        </div>
        <div class="flex items-center gap-1 dark:text-white/60 text-black/60" title="巨龙">
          <Dragon class="size-3.5" />
          <span>{{ team.teamInfo.objectives.dragon.kills }}</span>
        </div>
        <div class="flex items-center gap-1 dark:text-white/60 text-black/60" title="纳什男爵">
          <Baron class="size-3.5" />
          <span>{{ team.teamInfo.objectives.baron.kills }}</span>
        </div>
        <div class="flex items-center gap-1 dark:text-white/60 text-black/60" title="虚空巢虫">
          <VoidGrub class="size-3.5" />
          <span>{{ team.teamInfo.objectives.horde.kills }}</span>
        </div>
        <div class="flex items-center gap-1 dark:text-white/60 text-black/60" title="峡谷先锋">
          <RiftHerald class="size-3.5" />
          <span>{{ team.teamInfo.objectives.riftHerald.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 dark:text-white/60 text-black/60"
          title="厄塔汗"
          v-if="team.teamInfo.objectives.atakhan"
        >
          <Atakhan class="size-3.5" />
          <span>{{ team.teamInfo.objectives.atakhan.kills }}</span>
        </div>
      </div>

      <!-- bans -->
      <div class="mla flex" v-if="team.teamInfo && team.teamInfo.bans.length > 0">
        <div class="text-xs dark:text-white/60 text-black/60 mr-1">禁用</div>
        <div class="flex gap-0.5">
          <ChampionIcon
            v-for="ban in team.teamInfo.bans.slice(0, 5)"
            :key="ban.championId"
            :champion-id="ban.championId"
            class="size-4 rounded-xs"
          />
          <NPopover v-if="team.teamInfo.bans.length > 5">
            <template #trigger>
              <div class="text-xs dark:text-white/60 text-black/60">
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
        'dark:bg-white/5 bg-black/5 bg-clip-padding': participant.puuid === puuid
      }"
      class="box-border b-t b-t-solid dark:b-t-white/5 b-t-black/5 h-12 px-2 py-1 flex items-center"
    >
      <!-- name line -->
      <div class="flex-1 min-w-0 flex items-center gap-1">
        <!-- left champion icon -->
        <NPopover placement="right">
          <template #trigger>
            <div class="relative size-8 cursor-pointer">
              <ChampionIcon :champion-id="participant.championId" class="!size-full" round />
              <div
                class="absolute -bottom-1 right-0 text-[10px] leading-none p-0.5 text-white/80 dark:bg-black/50 bg-black/70 rounded-full"
              >
                {{ participant.level }}
              </div>
            </div>
          </template>
          <RadarChart :puuid="participant.puuid" />
        </NPopover>

        <!-- spells -->
        <div v-if="participant.spells[0] || participant.spells[1]" class="flex gap-0.5 flex-col">
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
          class="flex gap-0.5 flex-col -ml-0.5"
        >
          <PerkDisplay :perk-id="participant.perks.styles[0]?.selections[0]?.perk" :size="16" />
          <PerkstyleDisplay :perkstyle-id="participant.perks.styles[1]?.style" :size="16" />
        </div>

        <!-- name & position -->
        <div class="flex-1 min-w-0">
          <NTooltip>
            <template #trigger>
              <div
                class="text-xs truncate cursor-pointer"
                @click="onNavigateToSummonerByPuuid(participant.puuid)"
                @mousedown="handleMouseDown"
                @mouseup="handleMouseUp($event, participant.puuid)"
                :class="{ 'font-bold dark:text-white text-black': participant.puuid === puuid }"
              >
                {{ participant.gameName }}
                <template v-if="participant.tagLine"> #{{ participant.tagLine }}</template>
              </div>
            </template>
            <div class="flex items-center gap-1 text-xs">
              <span class="font-bold">{{ participant.gameName }}</span>
              <span v-if="participant.tagLine" class="text-white/80"
                >#{{ participant.tagLine }}</span
              >
            </div>
          </NTooltip>
          <div
            v-if="participant.position && participant.position.toLowerCase() !== 'invalid'"
            class="text-[11px] dark:text-white/60 text-black/60"
          >
            {{ position(participant.position) }}
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
          <div class="dark:text-white/60 text-black/60 text-[11px]">
            {{ participant.kda.toFixed(2) }} KDA
          </div>
        </div>

        <!-- augments (5) -->
        <div v-else-if="column.name === 'augments' && participant.augments" :class="column.class">
          <AugmentDisplay
            v-for="aug in participant.augments.slice(0, 5)"
            :key="aug"
            :augment-id="aug"
            :size="20"
          />
        </div>

        <!-- dmg dealt / dmg taken -->
        <div v-else-if="column.name === 'damage'" :class="column.class">
          <DamageMetricBar
            :total-damage="participant.totalDamageDealtToChampions"
            :physical-damage="participant.physicalDamageDealtToChampions"
            :magic-damage="participant.magicDamageDealtToChampions"
            :true-damage="participant.trueDamageDealtToChampions"
            :baseline-damage="teams.allTeamStats.maxDamageDealtToChampions"
          />
          <DamageMetricBar
            :total-damage="participant.totalDamageTaken"
            :physical-damage="participant.physicalDamageTaken"
            :magic-damage="participant.magicDamageTaken"
            :true-damage="participant.trueDamageTaken"
            :baseline-damage="teams.allTeamStats.maxDamageTaken"
          />
        </div>

        <!-- cs -->
        <div v-else-if="column.name === 'cs'" :class="column.class">
          <div class="text-xs">{{ participant.cs }} CS</div>
          <div class="dark:text-white/60 text-black/60 text-[11px]">
            {{ (participant.cs / (basicInfo.gameDuration / 60)).toFixed(1) }} / Min
          </div>
        </div>

        <!-- gold -->
        <div v-else-if="column.name === 'gold'" :class="column.class">
          <div class="text-xs">{{ (participant.goldEarned / 1000).toFixed(2) }} K</div>
          <div class="dark:text-white/60 text-black/60 text-[11px]">
            {{ (participant.goldEarned / (basicInfo.gameDuration / 60)).toFixed(1) }} / Min
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
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import AugmentDisplay from '@renderer-shared/components/widgets/AugmentDisplay.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import ItemDisplay from '@renderer-shared/components/widgets/ItemDisplay.vue'
import PerkDisplay from '@renderer-shared/components/widgets/PerkDisplay.vue'
import PerkstyleDisplay from '@renderer-shared/components/widgets/PerkstyleDisplay.vue'
import SummonerSpellDisplay from '@renderer-shared/components/widgets/SummonerSpellDisplay.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { NPopover, NTooltip } from 'naive-ui'
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
import DamageMetricBar from './DamageMetricBar.vue'
import RadarChart from './RadarChart.vue'

interface ColumnConfig {
  name: string
  class: string
}

const extraColumns = computed<ColumnConfig[]>(() => {
  switch (basicInfo.value.gameMode) {
    case 'CHERRY':
      return [
        { name: 'kda', class: 'w-26 text-center' },
        { name: 'augments', class: 'w-30 flex gap-0.5 justify-center' },
        { name: 'damage', class: 'w-32 flex gap-2 justify-center' },
        { name: 'cs', class: 'hidden @[800px]:block w-18 text-center' },
        { name: 'gold', class: 'hidden @[740px]:block w-18 text-xs text-center' },
        { name: 'items', class: 'w-40 flex gap-0.5 justify-center' }
      ]
    case 'KIWI':
      return [
        { name: 'kda', class: 'w-26 text-center' },
        { name: 'augments', class: 'w-30 flex gap-0.5 justify-center' },
        { name: 'damage', class: 'w-32 flex gap-2 justify-center' },
        { name: 'cs', class: 'hidden @[740px]:block w-18 text-center' },
        { name: 'gold', class: 'hidden @[700px]:block w-18 text-xs text-center' },
        { name: 'items', class: 'w-40 flex gap-0.5 justify-center' }
      ]
    default:
      return [
        { name: 'kda', class: 'w-26 text-center' },
        { name: 'damage', class: 'w-32 flex gap-2 justify-center' },
        { name: 'cs', class: 'hidden @[700px]:block w-18 text-center' },
        { name: 'gold', class: ' w-18 text-xs text-center' },
        { name: 'items', class: 'w-40 flex gap-0.5 justify-center' }
      ]
  }
})

const as = useAppCommonStore()

const tone = computed(() => {
  const k = team.value.winResult
  const borderClass = {
    win: 'dark:b-green-300/10 b-green-700/10',
    lose: 'dark:b-red-300/10 b-red-700/10',
    remake: 'dark:b-white/10 b-black/10',
    abort: 'dark:b-white/10 b-black/10'
  }[k]

  const headerClass = {
    win: 'dark:bg-green-300/10 bg-green-700/10',
    lose: 'dark:bg-red-300/10 bg-red-700/10',
    remake: 'dark:bg-white/10 b-black/10',
    abort: 'dark:bg-white/10 b-black/10'
  }[k]

  return { borderClass, headerClass }
})

const { teamIdentifier } = defineProps<{
  teamIdentifier: string
}>()

const { basicInfo, teams, participants, puuid, onNavigateToSummonerByPuuid } = useMatchCard()

const team = computed(() => {
  return teams.value.teamStatMap[teamIdentifier]
})

const teamParticipants = computed(() => {
  return participants.value.filter((p) => p.teamIdentifier === teamIdentifier)
})

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

const teamName = useTeamName()
const gameResultName = useGameResultName()
const position = usePosition()
</script>

<style scoped>
@import '../match-card.css';
</style>
