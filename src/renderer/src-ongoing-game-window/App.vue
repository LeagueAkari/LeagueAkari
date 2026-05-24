<template>
  <Transition name="one-way-fade">
    <div
      v-show="ogws.fakeShow"
      ref="containerEl"
      class="box-border h-full rounded-lg bg-(--la-background-color-primary) opacity-90"
    >
      <MatchPreviewer
        :summary="previewingGame.summary"
        :game-id="previewingGame.gameId"
        :puuid="previewingGame.puuid"
        :source="previewingGame.source"
        :details="previewingGame.details"
        v-model:show="showPreviewModal"
        :hide-privacy="as.settings.streamerMode"
      />
      <SetupInAppScope />
      <OngoingGamePanel
        :content-width="containerWidth"
        :content-height="containerHeight"
        @preview-game="handlePreviewGame"
      />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import MatchPreviewer from '@renderer-shared/components/match-preview/MatchPreviewer.vue'
import {
  type MatchPreviewPayload,
  type MatchPreviewState,
  toMatchPreviewState
} from '@renderer-shared/components/match-preview'
import OngoingGamePanel from '@renderer-shared/components/ongoing-game-panel/OngoingGamePanel.vue'
import { useHideNotAppTag } from '@renderer-shared/composables/useHideNotAppTag'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/setup-in-app-scope-component'
import { useOngoingGameWindowStore } from '@renderer-shared/shards/window-manager/store'
import { useElementSize } from '@vueuse/core'
import { ref, shallowRef, useTemplateRef, watch } from 'vue'

const ogws = useOngoingGameWindowStore()

const containerEl = useTemplateRef('containerEl')
const { width: containerWidth, height: containerHeight } = useElementSize(containerEl)

const as = useAppCommonStore()

const previewingGame = shallowRef<MatchPreviewState>({
  gameId: 0,
  source: 'sgp'
})

const showPreviewModal = ref(false)
const handlePreviewGame = (payload: MatchPreviewPayload) => {
  previewingGame.value = toMatchPreviewState(payload, as.settings.preferredLolSource)
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
