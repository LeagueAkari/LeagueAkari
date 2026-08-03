<template>
  <div class="space-y-4">
    <NEmpty v-if="!game.leagueClientConnected" :description="labels.waitingForClient" />
    <NEmpty v-else-if="game.teams.length === 0" :description="labels.noCurrentGame" />
    <template v-else>
      <div class="flex flex-wrap items-center gap-2 text-sm opacity-65">
        <NTag size="small" round>{{ game.phase }}</NTag>
        <span v-if="game.gameInfo">{{
          queueName(game.gameInfo.queueId, game.gameInfo.queueType)
        }}</span>
      </div>

      <section v-for="team in game.teams" :key="team.id" class="space-y-2">
        <div class="flex items-center gap-2">
          <span
            class="size-2.5 rounded-full border border-white/20"
            :class="teamColor(team.id)"
          ></span>
          <h2 class="text-base leading-tight font-bold">{{ teamName(team.id) }}</h2>
        </div>
        <div
          class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),240px))] gap-x-1 gap-y-2"
        >
          <OngoingPlayerCard
            v-for="player in team.players"
            :key="player.puuid"
            :player="player"
            :api="api"
            :labels="labels"
            @select-player="emit('select-player', $event)"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { LanWebOngoingGameDto, LanWebOngoingPlayerDto } from '@shared/shards/lan-web'
import { NEmpty, NTag } from 'naive-ui'

import type { LanWebApiClient } from '../api'
import { queueName } from '../format'
import type { LanWebLabels } from '../labels'
import OngoingPlayerCard from './OngoingPlayerCard.vue'

const props = defineProps<{
  game: LanWebOngoingGameDto
  api: LanWebApiClient
  labels: LanWebLabels
}>()
const emit = defineEmits<{ 'select-player': [player: LanWebOngoingPlayerDto] }>()

function teamColor(teamId: string) {
  if (teamId.includes('100') || teamId.toLowerCase().includes('blue')) return 'bg-blue-500'
  if (teamId.includes('200') || teamId.toLowerCase().includes('red')) return 'bg-red-400'
  return 'bg-neutral-400'
}

function teamName(teamId: string) {
  if (teamId.includes('100') || teamId.toLowerCase().includes('blue')) {
    return props.labels.blueTeam
  }
  if (teamId.includes('200') || teamId.toLowerCase().includes('red')) {
    return props.labels.redTeam
  }
  return `${props.labels.team} ${teamId}`
}
</script>
