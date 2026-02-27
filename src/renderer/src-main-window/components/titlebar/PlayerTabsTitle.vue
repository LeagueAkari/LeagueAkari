<template>
  <div class="player-tabs-title">
    <!-- context menu -->
    <NDropdown
      placement="bottom-start"
      trigger="manual"
      :show="contextMenuState.show"
      :x="contextMenuState.x"
      :y="contextMenuState.y"
      :options="contextMenuOptions"
      @clickoutside="contextMenuState.show = false"
      size="small"
      @select="handleContextMenuSelect"
      :theme-overrides="{ fontSizeSmall: '13px', optionHeightSmall: '26px' }"
    />

    <template v-if="lcs.isConnected">
      <NScrollbar
        :class="$style['scrollbar']"
        x-scrollable
        :content-class="$style['scrollbar-content']"
        @wheel="handleWheel"
        ref="scrollbar"
      >
        <div class="mh-tabs">
          <div
            v-for="(tab, index) of pts.tabs"
            :key="tab.id"
            ref="tabs-ref"
            class="tab"
            :data-id="tab.id"
            draggable="true"
            :class="{
              active: pts.currentTabId === tab.id,
              'drag-hover': currentDragHoverTabId === tab.id
            }"
            @contextmenu="handleContextMenu($event, tab.id)"
            @click="handleTabChange(tab.id)"
            @dblclick="pts.closeTab(tab.id)"
            @mouseup="handleMouseUp($event, tab.id)"
            @dragstart="handleTabDragStart($event, tab.id)"
            @drop="handleTabDrop($event, tab.id)"
            @dragover="handleTabDragOver($event, tab.id)"
            @dragleave="handleTagDragLeave($event, tab.id)"
            @dragend="handleTagDragEnd($event, tab.id)"
          >
            <NBadge
              dot
              :show="tab.spectatorData !== null"
              :size="4"
              color="#00ff00"
              processing
              :offset="[-20, 2]"
            >
              <Transition name="fade" mode="out-in">
                <NSpin v-if="tabLoadingStateMap[tab.id]" :size="12" class="tab-icon" />
                <ChampionIcon
                  class="tab-icon"
                  v-else-if="ogs.championSelections && ogs.championSelections[tab.puuid]"
                  :stretched="false"
                  :champion-id="ogs.championSelections[tab.puuid]"
                />
                <LcuImage
                  class="tab-icon"
                  v-else-if="tab.summoner"
                  :src="profileIconUri(tab.summoner.profileIconId)"
                />
                <div v-else class="tab-icon tab-icon-placeholder"></div>
              </Transition>
            </NBadge>
            <div class="sgp-server" v-if="isNeedToShowSgpServer">
              {{
                sgps.leagueServers.serverNames[as.settings.locale]?.[tab.sgpServerId] ||
                tab.sgpServerId
              }}
            </div>
            <template v-if="tab.summoner">
              <StreamerModeMaskedText>
                <template #masked>
                  <div class="summoner-name">
                    <span class="game-name-line">{{ summonerName(tab.puuid, index) }}</span>
                  </div>
                </template>
                <div class="summoner-name">
                  <span class="game-name-line">{{ tab.summoner.gameName }}</span>
                  <span class="tag-line"> #{{ tab.summoner.tagLine }}</span>
                </div>
              </StreamerModeMaskedText>
            </template>
            <template v-else-if="tabLoadingStateMap[tab.id]">
              <span class="empty-placeholder-text">{{ t('PlayerTabsTitle.loading') }}.</span>
            </template>
            <template v-else>
              <span class="empty-placeholder-text">{{ tab.id.slice(0, 16) }}...</span>
            </template>
            <NIcon @click.stop="pts.closeTab(tab.id)" class="close-icon"><CloseIcon /></NIcon>
          </div>
        </div>
      </NScrollbar>

      <div class="divider" />

      <NPopconfirm
        :disabled="!as.settings.streamerMode || warningShown"
        @positive-click="handleShowSearchPaneInPopconfirm"
        :positive-button-props="{
          type: 'warning',
          size: 'tiny'
        }"
        :negative-button-props="{
          size: 'tiny'
        }"
      >
        <template #trigger>
          <div
            class="search-area"
            @click="(!as.settings.streamerMode || warningShown) && (searchPaneShow = true)"
          >
            <NIcon class="search-icon"><SearchIcon /></NIcon>
            <span class="search-label">{{ t('PlayerTabsTitle.search') }}</span>
          </div>
        </template>
        {{ t('PlayerTabsTitle.searchButtonStreamerModeWarning') }}
      </NPopconfirm>
    </template>

    <NModal v-model:show="searchPaneShow">
      <div class="h-[640px] max-h-[90vh] w-[800px] max-w-[90vw]">
        <SearchPane ref="searchPaneRef" @navigate-to-summoner="handleToSummoner" />
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import StreamerModeMaskedText from '@renderer-shared/components/StreamerModeMaskedText.vue'
import ChampionIcon from '@renderer-shared/components/widgets/ChampionIcon.vue'
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { Close as CloseIcon, Search as SearchIcon } from '@vicons/carbon'
import { CloseRound as CloseRoundIcon, RefreshRound as RefreshRoundIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NBadge, NDropdown, NIcon, NModal, NPopconfirm, NScrollbar, NSpin } from 'naive-ui'
import { DropdownMixedOption } from 'naive-ui/es/dropdown/src/interface'
import { computed, h, nextTick, reactive, ref, useTemplateRef, watch } from 'vue'

import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import SearchPane from '../search-pane/SearchPane.vue'

const { t } = useTranslation()

const pts = usePlayerTabsStore()
const sgps = useSgpStore()
const ogs = useOngoingGameStore()
const lcs = useLeagueClientStore()
const pt = useInstance(PlayerTabsRenderer)
const as = useAppCommonStore()

const scrollbarEl = useTemplateRef('scrollbar')

const handleWheel = (e: WheelEvent) => {
  scrollbarEl.value?.scrollBy({
    left: e.deltaY * 0.75 // 这个速度会舒服一点
  })
}

const searchPaneShow = ref(false)

const searchPaneRef = useTemplateRef('searchPaneRef')

watch(
  () => searchPaneShow.value,
  (show) => {
    if (show) {
      searchPaneRef.value?.reset()
    } else {
      searchPaneRef.value?.cancel()
    }
  }
)

const handleMouseUp = (event: MouseEvent, unionId: string) => {
  if (event.button === 1) {
    pts.closeTab(unionId)
  }
}

const tabLoadingStateMap = computed(() => {
  const map: Record<string, boolean> = {}
  for (const tab of pts.tabs) {
    map[tab.id] = tab.isLoading
  }

  return map
})

const { navigateToTab, navigateToTabByPuuidAndSgpServerId } = pt.useNavigateToTab()

const handleTabChange = async (unionId: string) => {
  navigateToTab(unionId)
}

const alignTabToVisibleArea = (tabId: string) => {
  const tabEl = document.querySelector(`.tab[data-id="${tabId}"]`)
  // @ts-ignore
  const parentEl = scrollbarEl.value?.scrollbarInstRef?.wrapperRef as HTMLElement

  if (!tabEl || !parentEl) {
    return
  }

  const tabRect = tabEl.getBoundingClientRect()
  const parentRect = parentEl.getBoundingClientRect()

  if (tabRect.left < parentRect.left) {
    tabEl.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'start'
    })
  } else if (tabRect.right > parentRect.right) {
    tabEl.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'end'
    })
  }
}

const AKARI_MIME_TYPE = 'x-league-akari-tab-drag'
const currentDragHoverTabId = ref<string | null>(null)

const handleTabDragStart = (event: DragEvent, id: string) => {
  event.dataTransfer?.setData(AKARI_MIME_TYPE, id)
  contextMenuState.show = false
}

const handleTabDragOver = (event: DragEvent, id: string) => {
  event.preventDefault()
  currentDragHoverTabId.value = id
}

const handleTagDragEnd = (_event: DragEvent, _id: string) => {
  currentDragHoverTabId.value = null
}

const handleTagDragLeave = (_event: DragEvent, _id: string) => {
  currentDragHoverTabId.value = null
}

const handleTabDrop = (event: DragEvent, id: string) => {
  const fromId = event.dataTransfer?.getData(AKARI_MIME_TYPE)
  if (fromId) {
    pts.moveTabBefore(fromId, id)
    nextTick(() => pts.currentTabId && alignTabToVisibleArea(pts.currentTabId))
  }

  currentDragHoverTabId.value = null
}

const handleContextMenu = (event: MouseEvent, id: string) => {
  event.preventDefault()

  contextMenuState.show = false

  // 根据 naive-ui 的官方用例
  // 但不加 nextTick 似乎也没问题
  nextTick(() => {
    const height =
      getComputedStyle(document.documentElement).getPropertyValue('--la-titlebar-height') || '0'
    contextMenuState.x = event.clientX
    contextMenuState.y = event.clientY - parseInt(height)
    contextMenuState.show = true
    contextMenuState.id = id
  })
}

const contextMenuState = reactive({
  x: 0,
  y: 0,
  show: false,
  id: ''
})

const contextMenuOptions: DropdownMixedOption[] = reactive([
  {
    label: computed(() => t('PlayerTabsTitle.refresh')),
    key: 'refresh',
    disabled: computed(() => {
      const tab = pts.tabs.find((t) => t.id === contextMenuState.id)
      if (tab) {
        return tab.isLoading
      }

      return true
    }),
    icon: () => h(NIcon, null, { default: () => h(RefreshRoundIcon) })
  },
  {
    type: 'divider',
    key: 'divider-1'
  },
  {
    label: computed(() => t('PlayerTabsTitle.close')),
    key: 'close',
    icon: () => h(NIcon, null, { default: () => h(CloseRoundIcon) })
  },
  {
    label: computed(() => t('PlayerTabsTitle.closeOthers')),
    key: 'close-others',
    disabled: computed(() => !pts.canCloseOtherTabs(contextMenuState.id))
  },
  {
    label: computed(() => t('PlayerTabsTitle.closeToTheRight')),
    key: 'close-to-the-right',
    disabled: computed(() => !pts.canCloseTabsToTheRight(contextMenuState.id))
  }
])

const handleContextMenuSelect = (key: string) => {
  switch (key) {
    case 'refresh':
      pts.getTab(contextMenuState.id)?.refresh?.()
      break
    case 'close':
      pts.closeTab(contextMenuState.id)
      break
    case 'close-others':
      pts.closeOtherTabs(contextMenuState.id)
      break
    case 'close-to-the-right':
      pts.closeToTheRight(contextMenuState.id)
      break
  }

  contextMenuState.show = false
}

// 是否需要显示服务器的名称
// - 当存在多个不同服务器
// - 仅剩的服务器不是当前服务器
const isNeedToShowSgpServer = computed(() => {
  const count: Record<string, number> = {}
  for (const tab of pts.tabs) {
    if (count[tab.sgpServerId]) {
      count[tab.sgpServerId]++
    } else {
      count[tab.sgpServerId] = 1
    }
  }

  return Object.keys(count).length > 1 || !count[sgps.availability.sgpServerId]
})

// 一些情况下需要隐藏右键菜单, 比如页面不存在
watch(
  () => contextMenuState.id,
  (id) => {
    if (!id || !pts.tabs.some((t) => t.id === id)) {
      contextMenuState.show = false
    }
  }
)

// 保证活动页面始终在可视区域内
watch(
  () => pts.currentTabId,
  (current) => {
    if (!current) {
      return
    }

    nextTick(() => alignTabToVisibleArea(current))
  },
  { immediate: true }
)

const currentTabSummoner = computed(() => {
  return pts.tabs.find((t) => t.id === pts.currentTabId)?.summoner
})

// 保证更新后的活动页面也在可视区域内
watch(
  () => currentTabSummoner.value,
  (summoner) => {
    if (summoner) {
      nextTick(() => pts.currentTabId && alignTabToVisibleArea(pts.currentTabId))
    }
  }
)

const handleToSummoner = (puuid: string, sgpServerId: string | null, setCurrent = true) => {
  if (!sgpServerId) {
    sgpServerId = sgps.availability.sgpServerId
  }

  if (setCurrent) {
    searchPaneShow.value = false
    navigateToTabByPuuidAndSgpServerId(puuid, sgpServerId)
  } else {
    // 先路由
    pt.createTab(puuid, sgpServerId, false)
  }
}

let warningShown = false
const handleShowSearchPaneInPopconfirm = () => {
  searchPaneShow.value = true
  warningShown = true
}

const { summonerName } = useStreamerModeMaskedText()
</script>

<style scoped>
.player-tabs-title {
  display: flex;
  align-items: center;
  height: 100%;
}

.mh-tabs {
  display: flex;
  padding-top: 4px;
  box-sizing: border-box;
  flex: 1;
  height: 100%;
  align-items: center;
  width: max-content;
  gap: 2px;
}

.tab {
  height: 100%;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 4px 0 8px;
  box-sizing: border-box;
  border-radius: 4px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  cursor: pointer;
  user-select: none;
  transition:
    background-color 0.2s,
    filter 0.2s;
  line-height: 1;
  filter: brightness(0.7);
  border: 1px solid rgba(0, 0, 0, 0);
  background-color: rgba(0, 0, 0, 0.1);

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:hover {
    filter: brightness(0.8);
    background-color: rgba(0, 0, 0, 0.1);

    [data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .tab-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
    width: 16px;
    height: 16px;
    border-radius: 2px;
  }

  .tab-icon-placeholder {
    border-radius: 2px;
    background-color: rgba(0, 0, 0, 0.1);

    [data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .close-icon {
    margin-left: 4px;
    font-size: 16px;
    cursor: pointer;
    border-radius: 2px;
    transition: background-color 0.2s;
    color: rgba(0, 0, 0, 0.8);

    &:hover {
      background-color: rgba(0, 0, 0, 0.2);
    }

    [data-theme='dark'] & {
      color: rgba(255, 255, 255, 0.8);

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
  }

  .sgp-server {
    font-size: 11px;
    font-weight: bold;
    margin-right: 4px;
    color: rgba(111, 151, 136, 0.9);

    [data-theme='dark'] & {
      color: rgba(174, 245, 219, 0.8);
    }
  }

  .summoner-name {
    display: flex;
    align-items: flex-end;
  }

  .empty-placeholder-text {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.8);

    [data-theme='dark'] & {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .game-name-line {
    font-size: 12px;
    font-weight: bold;
    margin-right: 4px;
    color: rgba(0, 0, 0, 1);

    [data-theme='dark'] & {
      color: rgba(255, 255, 255, 1);
    }
  }

  .tag-line {
    font-size: 11px;
    color: rgba(0, 0, 0, 0.8);

    [data-theme='dark'] & {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  &.active {
    filter: brightness(1);
    background-color: rgba(0, 0, 0, 0);
    border-top: 1px solid rgba(0, 0, 0, 0.2);
    border-left: 1px solid rgba(0, 0, 0, 0.2);
    border-right: 1px solid rgba(0, 0, 0, 0.2);

    [data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.12);
      border-top: 1px solid rgba(0, 0, 0, 0);
      border-left: 1px solid rgba(0, 0, 0, 0);
      border-right: 1px solid rgba(0, 0, 0, 0);
    }
  }

  &.drag-hover {
    filter: brightness(0.8);
    background-color: rgba(0, 0, 0, 0.4);

    [data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.4);
    }
  }
}

.search-area {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
  padding: 0px 12px 0px 10px;
  border-radius: 2px;
  height: 24px; /* same as tab height */
  box-sizing: border-box;
  cursor: pointer;
  line-height: 1;
  transition:
    border-color 0.2s,
    background-color 0.2s,
    color 0.2s;
  border: 1px solid rgba(0, 0, 0, 0);
  background-color: rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.8);

  [data-theme='dark'] & {
    border: 1px solid rgba(255, 255, 255, 0);
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
  }

  &:hover {
    border-color: rgba(0, 0, 0, 0.4);
    color: rgba(0, 0, 0, 1);

    [data-theme='dark'] & {
      border-color: rgba(255, 255, 255, 0.4);
      color: rgba(255, 255, 255, 1);
    }
  }

  &:active {
    background-color: rgba(0, 0, 0, 0.05);

    [data-theme='dark'] & {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }

  .search-icon {
    font-size: 12px;
    margin-right: 4px;
    transition: color 0.2s;
  }

  .search-label {
    font-size: 12px;
    transition: color 0.2s;
  }
}

.divider {
  width: 1px;
  height: 40%;
  box-sizing: border-box;
  margin: 0 8px;
  background-color: rgba(0, 0, 0, 0.15);

  [data-theme='dark'] & {
    background-color: rgba(255, 255, 255, 0.15);
  }
}

[data-theme-id='graphite'] {
  .tab {
    background-color: rgba(148, 173, 197, 0.08);
    border-color: rgba(148, 173, 197, 0);

    &:hover {
      background-color: rgba(78, 195, 255, 0.14);
    }

    .tab-icon-placeholder {
      background-color: rgba(148, 173, 197, 0.18);
    }

    .close-icon {
      color: rgba(221, 231, 241, 0.86);

      &:hover {
        background-color: rgba(78, 195, 255, 0.2);
      }
    }

    .sgp-server {
      color: rgba(120, 205, 248, 0.9);
    }

    .empty-placeholder-text {
      color: rgba(221, 231, 241, 0.86);
    }

    .game-name-line {
      color: rgba(221, 231, 241, 1);
    }

    .tag-line {
      color: rgba(158, 178, 198, 0.95);
    }

    &.active {
      background-color: rgba(78, 195, 255, 0.16);
      border-top: 1px solid rgba(148, 173, 197, 0.32);
      border-left: 1px solid rgba(148, 173, 197, 0.32);
      border-right: 1px solid rgba(148, 173, 197, 0.32);
    }

    &.drag-hover {
      background-color: rgba(78, 195, 255, 0.35);
    }
  }

  .search-area {
    border-color: rgba(148, 173, 197, 0);
    background-color: rgba(148, 173, 197, 0.12);
    color: rgba(221, 231, 241, 0.9);

    &:hover {
      border-color: rgba(148, 173, 197, 0.45);
      color: rgba(221, 231, 241, 1);
    }

    &:active {
      background-color: rgba(78, 195, 255, 0.1);
    }
  }

  .divider {
    background-color: rgba(148, 173, 197, 0.28);
  }
}
</style>

<style module>
.scrollbar {
  height: 100%;
  display: flex;
  align-items: center;

  :global(.n-scrollbar-container) {
    width: auto;
    -webkit-app-region: no-drag;
  }

  :global(.n-scrollbar-rail.n-scrollbar-rail--horizontal) {
    height: 4px;
  }

  :global(.n-scrollbar-rail.n-scrollbar-rail--horizontal .n-scrollbar-rail__scrollbar) {
    position: relative;
    bottom: -4px;
    height: 4px;
  }
}

.scrollbar-content {
  height: 100%;
  min-width: 0 !important;
}

.fade-enter-active {
  position: relative;
  transition: opacity 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
}

.fade-enter-to {
  opacity: 1;
}
</style>
