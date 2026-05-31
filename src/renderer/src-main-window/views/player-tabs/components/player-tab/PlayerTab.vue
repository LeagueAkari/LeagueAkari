<template>
  <div class="relative h-full">
    <NScrollbar x-scrollable :theme-overrides="{ width: '8px' }" ref="scrollbarEl">
      <div
        class="mx-auto pt-10 pb-4"
        :class="{
          'w-266': !isSmallSize,
          'w-191': isSmallSize
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
        <div class="flex items-start gap-3" v-else>
          <!-- sentinel -->
          <div ref="stickySentinelLeftSideEl" class="-ml-3 h-0"></div>

          <!-- sticky box -->
          <StickyBox class="w-75" :offset-top="8" :offset-bottom="8">
            <div class="space-y-2">
              <MatchHistoryPagination />
              <NormalTagBlock />
              <SpectatorPane />
              <SummaryPane />
              <ChampionMasteryPane />
              <RecentlyPlayers side="ally" />
              <RecentlyPlayers side="enemy" />
              <PlayerChallenges />
              <EncounteredGames />
            </div>
          </StickyBox>

          <!-- match history container -->
          <MatchHistoryList class="flex-1" />
        </div>
      </div>
    </NScrollbar>

    <CollectModeProgress />

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
      :details="previewingGame.details"
      :hide-privacy="as.settings.streamerMode"
      :can-dry-run-ongoing-game="canDryRunOngoingGame"
      @navigate-to-summoner-by-puuid="(puuid) => navigateToTabByPuuid(puuid)"
      @dry-run-ongoing-game="handleDryRunOngoingGame"
    />

    <!-- 这个组件不会生成 DOM，但用来保证全局状态同步 -->
    <GlobalStateTracker />
  </div>
</template>

<script setup lang="ts">
import MatchPreviewer from '@renderer-shared/components/match-preview/MatchPreviewer.vue'
import {
  type MatchPreviewPayload,
  type MatchPreviewState,
  toMatchPreviewState
} from '@renderer-shared/components/match-preview'
import StickyBox from '@renderer-shared/components/sticky-box/StickyBox.vue'
import { useActivated } from '@renderer-shared/composables/useActivated'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { OngoingGameRenderer } from '@renderer-shared/shards/ongoing-game'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { DraftOptions } from '@shared/types/shards/ongoing-game'
import { ArrowUp20Regular } from '@vicons/fluent'
import { useElementVisibility, useTimeoutFn } from '@vueuse/core'
import { NButton, NIcon, NScrollbar } from 'naive-ui'
import { computed, ref, shallowRef, useTemplateRef, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import { useMainWindowAppContext } from '@main-window/context'
import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import GlobalStateTracker from './GlobalStateTracker'
import { SMALL_SIZE_THRESHOLD } from './constants'
import { providePlayerTab } from './context'
import { useFreezeValue } from './utils/freeze'
import ChampionMasteryPane from './widgets/ChampionMasteryPane.vue'
import EncounteredGames from './widgets/EncounteredGames.vue'
import MatchHistoryList from './widgets/MatchHistoryList.vue'
import MatchHistoryPagination from './widgets/match-history-pagination'
import NormalTagBlock from './widgets/NormalTagBlock.vue'
import PlayerChallenges from './widgets/PlayerChallenges.vue'
import PlayerTabHeader from './widgets/PlayerTabHeader.vue'
import RecentlyPlayers from './widgets/RecentlyPlayers.vue'
import SpectatorPane from './widgets/SpectatorPane.vue'
import SummaryPane from './widgets/SummaryPane.vue'
import CollectModeProgress from './widgets/match-history-filters/CollectModeProgress.vue'

const { id, puuid, sgpServerId } = defineProps<{
  id: string
  puuid: string
  sgpServerId: string
}>()

const pt = useInstance(PlayerTabsRenderer)
const og = useInstance(OngoingGameRenderer)
const router = useRouter()

const lcs = useLeagueClientStore()
const as = useAppCommonStore()
const pts = usePlayerTabsStore()
const sgps = useSgpStore()

const { navigateToTabByPuuid } = pt.useNavigateToTab()

const { contentWidth } = useMainWindowAppContext()

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
const previewingGame = shallowRef<MatchPreviewState>({
  gameId: 0,
  source: 'sgp'
})

const handlePreviewGame = (payload: MatchPreviewPayload) => {
  previewingGame.value = toMatchPreviewState(
    payload,
    as.settings.preferredLolSource,
    lcs.summoner.me?.puuid
  )
  showPreviewModal.value = true
}

// The analysis draft relies on local-region data loaded by ongoing-game.
const canDryRunOngoingGame = computed(() => sgpServerId === sgps.availability.sgpServerId)

const handleDryRunOngoingGame = async (draft: DraftOptions) => {
  if (!canDryRunOngoingGame.value) {
    return
  }

  await og.setDraft(draft)
  await router.replace({ name: 'ongoing-game' })
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
