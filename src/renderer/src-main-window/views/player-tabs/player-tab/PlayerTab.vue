<template>
  <div class="relative h-full">
    <NScrollbar x-scrollable :theme-overrides="{ width: '8px' }" ref="scrollbarEl">
      <div
        class="mx-auto pt-10 pb-4"
        :class="{
          'w-[1064px]': !isSmallSize,
          'w-[764px]': isSmallSize
        }"
      >
        <!-- head -->
        <PlayerTabHeader class="mb-6 h-28 px-4" />

        <!-- main content: thin size -->
        <div class="flex flex-col" v-if="isSmallSize">
          <div ref="stickySentinelRightSideEl" class="h-0 w-full"></div>
          <MatchHistoryPagination
            horizontal
            :is-floating="!isSentinelVisibleRightSide"
            class="sticky top-2 z-10 mb-2 self-end"
          />

          <MatchHistoryList />
        </div>

        <!-- main content: wide size -->
        <div class="flex gap-3" v-else>
          <!-- side -->
          <div class="w-[300px] space-y-2">
            <div ref="stickySentinelLeftSideEl" class="h-0 w-full"></div>
            <MatchHistoryPagination
              :is-floating="!frozenVisibleLeftSide"
              class="sticky top-2 z-10 -mt-2"
            />
            <NormalTagBlock />
            <SpectatorPane />
            <SummaryPane />
            <RecentlyPlayers side="ally" />
            <RecentlyPlayers side="enemy" />
            <EncounteredGames />
          </div>

          <!-- match history container -->
          <MatchHistoryList class="flex-1" />
        </div>
      </div>
    </NScrollbar>

    <div
      :class="{
        'pointer-events-auto opacity-80': shouldShowScrollToTopButton,
        'pointer-events-none opacity-0': !shouldShowScrollToTopButton
      }"
      class="absolute! right-8 bottom-8 z-10 transition-opacity hover:opacity-100"
    >
      <NButton size="large" type="primary" circle :focusable="false" @click="scrollToTop">
        <NIcon>
          <ArrowUp20Regular />
        </NIcon>
      </NButton>
    </div>

    <MatchPreviewer
      v-model:show="showPreviewModal"
      :game-id="previewingGame.gameId"
      :source="previewingGame.source"
      :puuid="previewingGame.puuid"
      :summary="previewingGame.summary"
    />

    <!-- 这个组件不会生成 DOM，但用来保证全局状态同步 -->
    <GlobalStateTracker />
  </div>
</template>

<script setup lang="ts">
import MatchPreviewer from '@renderer-shared/components/MatchPreviewer.vue'
import { useActivated } from '@renderer-shared/composables/useActivated'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LcuOrSgpGameSummary } from '@shared/data-adapter/wrapper'
import { ArrowUp20Regular } from '@vicons/fluent'
import { useElementVisibility, useTimeoutFn } from '@vueuse/core'
import { NButton, NIcon, NScrollbar } from 'naive-ui'
import { computed, ref, shallowRef, useTemplateRef, watchEffect } from 'vue'

import { useAppContext } from '@main-window/context'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import GlobalStateTracker from './GlobalStateTracker'
import MatchHistoryList from './MatchHistoryList.vue'
import PlayerTabHeader from './PlayerTabHeader.vue'
import { providePlayerTab } from './context'
import { SMALL_SIZE_THRESHOLD } from './data/constants'
import { useFreezeValue } from './utils/freeze'
import EncounteredGames from './widgets/EncounteredGames.vue'
import MatchHistoryPagination from './widgets/MatchHistoryPagination.vue'
import NormalTagBlock from './widgets/NormalTagBlock.vue'
import RecentlyPlayers from './widgets/RecentlyPlayers.vue'
import SpectatorPane from './widgets/SpectatorPane.vue'
import SummaryPane from './widgets/SummaryPane.vue'

const { id, puuid, sgpServerId } = defineProps<{
  id: string
  puuid: string
  sgpServerId: string
}>()

const lcs = useLeagueClientStore()
const as = useAppCommonStore()
const pts = usePlayerTabsStore()

const { contentWidth } = useAppContext()

const isSmallSize = computed(() => contentWidth.value < SMALL_SIZE_THRESHOLD)

const isCurrentTab = computed(() => {
  return pts.currentTabId === id
})

const isActivated = useActivated()

const isInvisible = computed(() => {
  return !isCurrentTab.value || !isActivated.value
})

const scrollbarEl = useTemplateRef('scrollbarEl')
const stickySentinelLeftSideEl = useTemplateRef('stickySentinelLeftSideEl')
const stickySentinelRightSideEl = useTemplateRef('stickySentinelRightSideEl')
const isSentinelVisibleLeftSide = useElementVisibility(stickySentinelLeftSideEl, {
  initialValue: true
})
const isSentinelVisibleRightSide = useElementVisibility(stickySentinelRightSideEl, {
  initialValue: true
})

const {
  value: frozenVisibleLeftSide,
  freeze: freezeLeftSide,
  unfreeze: unfreezeLeftSide
} = useFreezeValue(isSentinelVisibleLeftSide)
const {
  value: frozenVisibleRightSide,
  freeze: freezeRightSide,
  unfreeze: unfreezeRightSide
} = useFreezeValue(isSentinelVisibleRightSide)

const shouldShowScrollToTopButton = computed(() => {
  if (isSmallSize.value) {
    return !frozenVisibleRightSide.value
  }

  return !frozenVisibleLeftSide.value
})

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

const scrollToTop = () => {
  scrollbarEl.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

// 一个粗糙的解决闪烁问题的方式
// 我们假设浏览器在 50ms 内可以完成异步的 intersection observer 的回调
const { start, stop } = useTimeoutFn(() => {
  unfreezeLeftSide()
  unfreezeRightSide()
}, 50)

watchEffect(() => {
  if (isInvisible.value) {
    stop()
    freezeLeftSide()
    freezeRightSide()
  } else {
    start()
  }
})

providePlayerTab({
  id: () => id,
  puuid: () => puuid,
  sgpServerId: () => sgpServerId,
  isCurrentTab,
  isSmallSize,
  previewGame: handlePreviewGame
})
</script>
