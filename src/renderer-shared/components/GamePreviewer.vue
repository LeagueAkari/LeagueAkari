<template>
  <StandaloneMatchHistoryCardModal
    :summary="showingGame.game"
    :game-id="showingGame.gameId"
    :puuid="showingGame.puuid"
    @to-summoner="emits('toSummoner', $event)"
    v-model:show="isStandaloneMatchHistoryCardShow"
  />
</template>

<script lang="ts" setup>
import StandaloneMatchHistoryCardModal from '@renderer-shared/components/match-history-card/StandaloneMatchHistoryCardModal.vue'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { reactive, ref } from 'vue'

const emits = defineEmits<{
  toSummoner: [puuid: string]
}>()

const showingGame = reactive<{
  gameId: number
  game: LcuOrSgpGameSummary | null
  puuid?: string
}>({
  gameId: 0,
  game: null
})

const isStandaloneMatchHistoryCardShow = ref(false)
const handleShowGame = (game: LcuOrSgpGameSummary | number, puuid?: string) => {
  if (typeof game === 'number') {
    showingGame.game = null
    showingGame.gameId = game
    showingGame.puuid = puuid
    isStandaloneMatchHistoryCardShow.value = true
  } else {
    showingGame.gameId = 0
    showingGame.game = game
    showingGame.puuid = puuid
    isStandaloneMatchHistoryCardShow.value = true
  }
}

defineExpose({
  showGame: handleShowGame
})
</script>
