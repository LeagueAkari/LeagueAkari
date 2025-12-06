<template>
  <div ref="containerEl" class="relative h-full">
    <NScrollbar x-scrollable>
      <div
        class="mx-auto"
        :class="{
          'w-1064px': !isSmallSize,
          'w-764px': isSmallSize
        }"
      >
        <!-- head -->
        <PlayerTabHeader class="mt-10 mb-6 px-4 h-28" />

        <!-- main content -->
        <div class="flex gap-3 items-start">
          <!-- side -->
          <div class="space-y-2 w-300px" v-if="!isSmallSize">
            <NormalTagBlock />
            <EncounteredGames />
          </div>

          <!-- match history container -->
          <MatchHistoryList class="flex-1" />
        </div>
      </div>
    </NScrollbar>

    <MatchPreviewer
      v-model:show="showPreviewModal"
      :game-id="previewingGame.gameId"
      :source="previewingGame.source"
      :puuid="previewingGame.puuid"
      :summary="previewingGame.summary"
    />

    <LoadingStateTracker />
  </div>
</template>

<script setup lang="ts">
import MatchPreviewer from '@renderer-shared/components/MatchPreviewer.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { useElementSize } from '@vueuse/core'
import { NScrollbar } from 'naive-ui'
import { computed, ref, shallowRef, useTemplateRef } from 'vue'

import MatchHistoryList from './MatchHistoryList.vue'
import PlayerTabHeader from './PlayerTabHeader.vue'
import { providePlayerTab } from './context'
import { SMALL_SIZE_THRESHOLD } from './data/constants'
import EncounteredGames from './widgets/EncounteredGames.vue'
import LoadingStateTracker from './widgets/LoadingStateTracker.vue'
import NormalTagBlock from './widgets/NormalTagBlock.vue'

const { puuid, sgpServerId } = defineProps<{
  puuid: string
  sgpServerId: string
}>()

const emits = defineEmits<{
  createTab: [puuid: string, sgpServerId: string]
}>()

const lcs = useLeagueClientStore()
const as = useAppCommonStore()

const containerEl = useTemplateRef('containerEl')

const { width } = useElementSize(containerEl)

const isSmallSize = computed(() => width.value < SMALL_SIZE_THRESHOLD)

const showPreviewModal = ref(false)
const previewingGame = shallowRef({
  gameId: 0,
  summary: undefined as LcuOrSgpGameSummary | undefined,
  puuid: undefined as string | undefined,
  source: 'sgp' as 'sgp' | 'lcu'
})

const handlePreviewGame = (summary: LcuOrSgpGameSummary | number, puuid?: string) => {
  if (puuid === undefined && lcs.summoner.me) {
    puuid = lcs.summoner.me.puuid
  }

  previewingGame.value = {
    gameId: typeof summary === 'object' ? summary.gameId : summary,
    summary: typeof summary === 'object' ? summary : undefined,
    puuid,
    source: typeof summary === 'object' ? summary.source : as.settings.preferredLolSource
  }

  showPreviewModal.value = true
}

providePlayerTab({
  puuid: () => puuid,
  sgpServerId: () => sgpServerId,
  isSmallSize,
  previewGame: handlePreviewGame,

  onCreateTab: (puuid: string, sgpServerId: string) => {
    emits('createTab', puuid, sgpServerId)
  }
})
</script>
