<template>
  <div ref="playerTabRootEl" class="relative h-full">
    <NScrollbar x-scrollable :theme-overrides="{ width: '8px' }" ref="scrollbarEl">
      <div ref="layoutContainerEl" class="@container w-full">
        <div class="mx-auto w-full max-w-191 pt-10 pb-4 @[1064px]:max-w-266">
          <PlayerTabHeader class="mb-6 h-28 px-4" />

          <div class="box-border px-4 @[764px]:px-0">
            <div ref="stickySentinelEl" class="h-0 w-full"></div>

            <div
              class="grid grid-cols-1 items-start gap-3 @[1064px]:grid-cols-[300px_minmax(0,1fr)]"
            >
              <StickyBox v-if="!isCompactLayout" class="w-75" :offset-top="8" :offset-bottom="8">
                <PlayerTabSidebarContent />
              </StickyBox>

              <div class="min-w-0">
                <div
                  v-if="isCompactLayout"
                  class="sticky top-2 z-10 mb-2 flex min-w-0 items-start gap-2"
                >
                  <NTooltip placement="bottom-start">
                    <template #trigger>
                      <NButton
                        class="shrink-0"
                        size="small"
                        secondary
                        circle
                        :focusable="false"
                        :aria-label="t('playerTabs.matchHistory.sidebar.open')"
                        @click="showSidebarDrawer = true"
                      >
                        <template #icon>
                          <NIcon><PanelLeftExpand20Regular /></NIcon>
                        </template>
                      </NButton>
                    </template>
                    {{ t('playerTabs.matchHistory.sidebar.open') }}
                  </NTooltip>

                  <MatchHistoryPagination
                    class="min-w-0 flex-1"
                    :is-floating="!frozenSentinelVisible"
                  />
                </div>

                <MatchHistoryList />
              </div>
            </div>
          </div>
        </div>
      </div>
    </NScrollbar>

    <CollectModeProgress />

    <NDrawer
      v-if="isCompactLayout"
      v-model:show="showSidebarDrawer"
      :to="playerTabRootEl ?? undefined"
      width="min(320px, calc(100% - 32px))"
      placement="left"
      class="bg-neutral-900/90! backdrop-blur-xl"
    >
      <NDrawerContent :native-scrollbar="false" body-content-style="padding: 8px">
        <PlayerTabSidebarContent />
      </NDrawerContent>
    </NDrawer>

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

    <ConnectedMatchPreviewer
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
import ConnectedMatchPreviewer from '@renderer-shared/components/match-preview/ConnectedMatchPreviewer.vue'
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
import { DraftOptions } from '@shared/shards/ongoing-game'
import { ArrowUp20Regular, PanelLeftExpand20Regular } from '@vicons/fluent'
import { useElementSize, useElementVisibility, useTimeoutFn } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NButton, NDrawer, NDrawerContent, NIcon, NScrollbar, NTooltip } from 'naive-ui'
import { computed, ref, shallowRef, useTemplateRef, watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import GlobalStateTracker from './GlobalStateTracker'
import { PLAYER_TAB_WIDE_MIN_WIDTH } from './constants'
import { providePlayerTab } from './context'
import { useFreezeValue } from './utils/freeze'
import MatchHistoryList from './widgets/MatchHistoryList.vue'
import { provideMatchHistoryCardViewport } from './widgets/match-history-card'
import MatchHistoryPagination from './widgets/match-history-pagination'
import PlayerTabHeader from './widgets/PlayerTabHeader.vue'
import CollectModeProgress from './widgets/match-history-filters/CollectModeProgress.vue'
import PlayerTabSidebarContent from './PlayerTabSidebarContent.vue'

const { id, puuid, sgpServerId } = defineProps<{
  id: string
  puuid: string
  sgpServerId: string
}>()

const pt = useInstance(PlayerTabsRenderer)
const og = useInstance(OngoingGameRenderer)
const router = useRouter()
const { t } = useTranslation()

const lcs = useLeagueClientStore()
const as = useAppCommonStore()
const pts = usePlayerTabsStore()
const sgps = useSgpStore()

const { navigateToTabByPuuid } = pt.useNavigateToTab()

const playerTabRootEl = useTemplateRef('playerTabRootEl')
const layoutContainerEl = useTemplateRef('layoutContainerEl')
const { width: layoutWidth } = useElementSize(layoutContainerEl)
const isCompactLayout = computed(() => layoutWidth.value < PLAYER_TAB_WIDE_MIN_WIDTH)
const showSidebarDrawer = ref(false)

const isCurrentTab = computed(() => {
  return pts.currentTabId === id
})

const isActivated = useActivated()

const isInvisible = computed(() => {
  return !isCurrentTab.value || !isActivated.value
})

provideMatchHistoryCardViewport({
  active: () => !isInvisible.value
})

const scrollbarEl = useTemplateRef('scrollbarEl')
const stickySentinelEl = useTemplateRef('stickySentinelEl')
const isSentinelVisible = useElementVisibility(stickySentinelEl, {
  initialValue: true
})

const {
  value: frozenSentinelVisible,
  freeze: freezeSentinel,
  unfreeze: unfreezeSentinel
} = useFreezeValue(isSentinelVisible)

const shouldShowScrollToTopButton = computed(() => !frozenSentinelVisible.value)

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
  unfreezeSentinel()
}, 50)

watchEffect(() => {
  if (isInvisible.value) {
    stop()
    freezeSentinel()
  } else {
    start()
  }
})

watchEffect(() => {
  if (isInvisible.value || !isCompactLayout.value) {
    showSidebarDrawer.value = false
  }
})

providePlayerTab({
  id: () => id,
  puuid: () => puuid,
  sgpServerId: () => sgpServerId,
  isCurrentTab,
  previewGame: handlePreviewGame
})
</script>
