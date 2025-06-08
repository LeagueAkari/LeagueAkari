<template>
  <StandaloneMatchHistoryCardModal
    :game="showingGame.game"
    :game-id="showingGame.gameId"
    :self-puuid="showingGame.selfPuuid"
    @to-summoner="emits('toSummoner', $event)"
    v-model:show="isStandaloneMatchHistoryCardShow"
  />
</template>

<script lang="ts" setup>
import StandaloneMatchHistoryCardModal from '@renderer-shared/components/match-history-card/StandaloneMatchHistoryCardModal.vue'
import { Game } from '@shared/types/league-client/match-history'
import { reactive, ref } from 'vue'

const emits = defineEmits<{
  toSummoner: [puuid: string]
}>()

const showingGame = reactive<{
  gameId: number
  game: Game | null
  selfPuuid?: string
}>({
  gameId: 0,
  game: null
})

const isStandaloneMatchHistoryCardShow = ref(false)
const handleShowGame = (game: Game | number, selfPuuid?: string) => {
  if (typeof game === 'number') {
    showingGame.game = null
    showingGame.gameId = game
    showingGame.selfPuuid = selfPuuid
    isStandaloneMatchHistoryCardShow.value = true
  } else {
    showingGame.gameId = 0
    showingGame.game = game
    showingGame.selfPuuid = selfPuuid
    isStandaloneMatchHistoryCardShow.value = true
  }
}

defineExpose({
  showGame: handleShowGame
})
</script>
