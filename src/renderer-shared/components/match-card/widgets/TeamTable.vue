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
            'dark:text-red-300 text-red-700': team.winResult === 'loss',
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
        <div
          class="flex items-center gap-1 dark:text-white/60 text-black/60"
          :title="t('MatchCard.teamTable.objectives.tower')"
        >
          <Tower class="size-3.5" />
          <span>{{ team.teamInfo.objectives.tower.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 dark:text-white/60 text-black/60"
          :title="t('MatchCard.teamTable.objectives.inhibitor')"
        >
          <Inhibitor class="size-3.5" />
          <span>{{ team.teamInfo.objectives.inhibitor.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 dark:text-white/60 text-black/60"
          :title="t('MatchCard.teamTable.objectives.dragon')"
        >
          <Dragon class="size-3.5" />
          <span>{{ team.teamInfo.objectives.dragon.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 dark:text-white/60 text-black/60"
          :title="t('MatchCard.teamTable.objectives.baron')"
        >
          <Baron class="size-3.5" />
          <span>{{ team.teamInfo.objectives.baron.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 dark:text-white/60 text-black/60"
          :title="t('MatchCard.teamTable.objectives.voidGrub')"
        >
          <VoidGrub class="size-3.5" />
          <span>{{ team.teamInfo.objectives.horde.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 dark:text-white/60 text-black/60"
          :title="t('MatchCard.teamTable.objectives.riftHerald')"
        >
          <RiftHerald class="size-3.5" />
          <span>{{ team.teamInfo.objectives.riftHerald.kills }}</span>
        </div>
        <div
          class="flex items-center gap-1 dark:text-white/60 text-black/60"
          :title="t('MatchCard.teamTable.objectives.atakhan')"
          v-if="team.teamInfo.objectives.atakhan"
        >
          <Atakhan class="size-3.5" />
          <span>{{ team.teamInfo.objectives.atakhan.kills }}</span>
        </div>
      </div>

      <!-- bans -->
      <div class="mla flex" v-if="team.teamInfo && team.teamInfo.bans.length > 0">
        <div class="text-xs dark:text-white/60 text-black/60 mr-1">
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
                class="absolute -bottom-1 right-0 text-10px leading-none p-0.5 text-white/80 dark:bg-black/50 bg-black/70 rounded-full"
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
        <div class="flex-1 min-w-0 flex flex-col">
          <NTooltip>
            <template #trigger>
              <div
                class="text-xs cursor-pointer flex items-center gap-1"
                @click="onNavigateToSummonerByPuuid(participant.puuid)"
                @mousedown="handleMouseDown"
                @mouseup="handleMouseUp($event, participant.puuid)"
                :class="{ 'font-bold dark:text-white text-black': participant.puuid === puuid }"
              >
                <NIcon
                  class="dark:text-white/80 text-black/80"
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
            class="text-11px dark:text-white/60 text-black/60"
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
          <div class="dark:text-white/60 text-black/60 text-11px">
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
          <div class="dark:text-white/60 text-black/60 text-11px">
            {{ (participant.cs / (basicInfo.gameDuration / 60)).toFixed(1) }}
            {{ t('MatchCard.teamTable.perMinuteSuffix') }}
          </div>
        </div>

        <!-- gold -->
        <div v-else-if="column.name === 'gold'" :class="column.class">
          <div class="text-xs">{{ (participant.goldEarned / 1000).toFixed(2) }} k</div>
          <div class="dark:text-white/60 text-black/60 text-11px">
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
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { EMPTY_PUUID } from '@shared/constants/common'
import { useTranslation } from 'i18next-vue'
import { Robot } from '@vicons/fa'
import { NIcon, NPopover, NTooltip } from 'naive-ui'
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
        { name: 'kda', class: 'min-w-26 text-center' },
        { name: 'augments', class: 'min-w-30 flex gap-0.5 justify-center' },
        { name: 'damage', class: 'min-w-32 flex gap-2 justify-center' },
        { name: 'cs', class: 'hidden @[800px]:block min-w-18 text-center' },
        { name: 'gold', class: 'hidden @[740px]:block min-w-18 text-xs text-center' },
        { name: 'items', class: 'w-40 flex gap-0.5 justify-center' }
      ]
    case 'KIWI':
      return [
        { name: 'kda', class: 'min-w-26 text-center' },
        { name: 'augments', class: 'min-w-29 flex gap-0.5 justify-center' },
        { name: 'damage', class: 'min-w-30 flex gap-2 justify-center' },
        { name: 'cs', class: 'hidden @[740px]:block min-w-18 text-center' },
        { name: 'gold', class: 'hidden @[700px]:block min-w-18 text-xs text-center' },
        { name: 'items', class: 'min-w-40 flex gap-0.5 justify-center' }
      ]
    default:
      return [
        { name: 'kda', class: 'min-w-26 text-center' },
        { name: 'damage', class: 'min-w-32 flex gap-2 justify-center' },
        { name: 'cs', class: 'hidden @[700px]:block w-18 text-center' },
        { name: 'gold', class: 'min-w-18 text-xs text-center' },
        { name: 'items', class: 'min-w-40 flex gap-0.5 justify-center' }
      ]
  }
})

const as = useAppCommonStore()
const { t } = useTranslation()

const tone = computed(() => {
  const k = team.value.winResult
  const borderClass = {
    win: 'dark:b-green-300/10 b-green-700/10',
    loss: 'dark:b-red-300/10 b-red-700/10',
    remake: 'dark:b-white/10 b-black/10',
    abort: 'dark:b-white/10 b-black/10'
  }[k]

  const headerClass = {
    win: 'dark:bg-green-300/10 bg-green-700/10',
    loss: 'dark:bg-red-300/10 bg-red-700/10',
    remake: 'dark:bg-white/10 b-black/10',
    abort: 'dark:bg-white/10 b-black/10'
  }[k]

  return { borderClass, headerClass }
})

const { teamIdentifier } = defineProps<{
  teamIdentifier: string
}>()

const { basicInfo, teams, participants, puuid, hidePrivacy, onNavigateToSummonerByPuuid } =
  useMatchCard()

const lcs = useLeagueClientStore()

const team = computed(() => {
  return teams.value.teamStatMap[teamIdentifier]
})

const teamParticipants = computed(() => {
  return participants.value.filter((p) => p.teamIdentifier === teamIdentifier)
})

const someoneHas6Augments = computed(() => {
  // 0 或 undefined 都算没有
  return teamParticipants.value.some((p) => p.augments[5])
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
