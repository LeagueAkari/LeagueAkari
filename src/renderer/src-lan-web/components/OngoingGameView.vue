<template>
  <div ref="container" class="min-w-0 space-y-4 overflow-hidden">
    <NEmpty v-if="!game.leagueClientConnected" :description="labels.waitingForClient" />
    <NEmpty v-else-if="game.teams.length === 0" :description="labels.noCurrentGame" />
    <template v-else>
      <div class="flex flex-wrap items-center gap-2 text-sm opacity-65">
        <NTag size="small" round>{{ game.phase }}</NTag>
        <span v-if="game.gameInfo">{{ game.gameInfo.queueType }}</span>
      </div>
      <OngoingGamePanel
        :content-width="Math.max(width, 320)"
        :content-height="Math.max(availableHeight, 500)"
        is-standalone-ongoing-game-window
        @navigate-to-summoner-by-puuid="selectPlayer"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import OngoingGamePanel from '@renderer-shared/components/ongoing-game-panel/OngoingGamePanel.vue'
import { provideOngoingGameProvider } from '@renderer-shared/providers/ongoing-game'
import type { LanWebOngoingGameDto, LanWebOngoingPlayerDto } from '@shared/shards/lan-web'
import { useElementSize, useWindowSize } from '@vueuse/core'
import { NEmpty, NTag } from 'naive-ui'
import { computed, useTemplateRef } from 'vue'

import type { LanWebLabels } from '../labels'
import { createLanWebOngoingGameProvider } from '../ongoing-game-adapter'

const props = defineProps<{
  game: LanWebOngoingGameDto
  labels: LanWebLabels
}>()
const emit = defineEmits<{ 'select-player': [player: LanWebOngoingPlayerDto] }>()

const container = useTemplateRef('container')
const { width } = useElementSize(container)
const { height: windowHeight } = useWindowSize()
const availableHeight = computed(() => windowHeight.value - 180)

provideOngoingGameProvider(createLanWebOngoingGameProvider(() => props.game))

function selectPlayer(puuid: string) {
  const player = props.game.teams
    .flatMap((team) => team.players)
    .find((item) => item.puuid === puuid)
  if (player) {
    emit('select-player', player)
  }
}
</script>
