<template>
  <Transition name="one-way-fade">
    <div
      v-show="ogws.fakeShow"
      class="box-border h-full rounded-lg bg-(--la-background-color-primary) opacity-90"
    >
      <MatchPreviewer
        :summary="showingGame.game"
        :game-id="showingGame.gameId"
        :puuid="showingGame.puuid"
        :source="showingGame.source"
        v-model:show="showPreviewModal"
        :hide-privacy="as.settings.streamerMode"
      />
      <SetupInAppScope />
      <OngoingGamePanel @show-game="handleShowGame" @show-game-by-id="handleShowGameById" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import MatchPreviewer from '@renderer-shared/components/MatchPreviewer.vue'
import OngoingGamePanel from '@renderer-shared/components/ongoing-game-panel/OngoingGamePanel.vue'
import { useHideNotAppTag } from '@renderer-shared/composables/useHideNotAppTag'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/comp'
import { useOngoingGameWindowStore } from '@renderer-shared/shards/window-manager/store'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { ref, shallowRef, watch } from 'vue'

const ogws = useOngoingGameWindowStore()
const as = useAppCommonStore()

const showingGame = shallowRef<{
  gameId: number
  game: LcuOrSgpGameSummary | undefined
  puuid: string
  source: 'lcu' | 'sgp'
}>({
  gameId: 0,
  game: undefined,
  puuid: '',
  source: 'lcu'
})

const showPreviewModal = ref(false)
const handleShowGame = (game: LcuOrSgpGameSummary, puuid: string) => {
  showingGame.value = {
    gameId: game.gameId,
    game,
    puuid,
    source: game.source
  }
  showPreviewModal.value = true
}

const handleShowGameById = (id: number, selfPuuid: string) => {
  showingGame.value = {
    gameId: id,
    game: undefined,
    puuid: selfPuuid,
    source: 'lcu'
  }
  showPreviewModal.value = true
}

watch(
  () => ogws.fakeShow,
  (show) => {
    if (show) {
    } else {
      showPreviewModal.value = false
    }
  }
)

useHideNotAppTag(() => ogws.fakeShow)
</script>

<style>
.one-way-fade-enter-active,
.one-way-fade-leave-active {
  transition: opacity 0.15s;
}

.one-way-fade-enter-from,
.one-way-fade-leave-to {
  opacity: 0;
}

.one-way-fade-enter-to,
.one-way-fade-leave-from {
  opacity: 0.95;
}
</style>
