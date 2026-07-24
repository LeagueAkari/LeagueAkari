<template>
  <div class="player-tabs-title">
    <PlayerTabStrip
      v-if="leagueClient.isConnected"
      :tabs="tabItems"
      :active-tab-id="playerTabs.currentTabId"
      :context-menu-offset-y="contextMenuOffsetY"
      :require-search-confirmation="requireSearchConfirmation"
      @activate="navigateToTab"
      @close="playerTabs.closeTab"
      @refresh="handleRefresh"
      @close-others="playerTabs.closeOtherTabs"
      @close-to-right="playerTabs.closeToTheRight"
      @reorder="handleReorder"
      @search="handleShowSearchPane"
    />

    <NModal v-model:show="searchPaneShow">
      <div class="h-160 max-h-[90vh] w-200 max-w-[90vw]">
        <SearchPane ref="searchPaneRef" @navigate-to-summoner="handleToSummoner" />
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { useStreamerModeMaskedText } from '@renderer-shared/composables/useStreamerModeMaskedText'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { NModal } from 'naive-ui'
import { computed, ref, useTemplateRef, watch } from 'vue'

import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import SearchPane from '../../search-pane/SearchPane.vue'
import PlayerTabStrip from './PlayerTabStrip.vue'
import type { PlayerTabStripItem, PlayerTabStripReorderEvent } from './types'

const playerTabs = usePlayerTabsStore()
const sgp = useSgpStore()
const ongoingGame = useOngoingGameStore()
const leagueClient = useLeagueClientStore()
const playerTabsRenderer = useInstance(PlayerTabsRenderer)
const appCommon = useAppCommonStore()

const { navigateToTab, navigateToTabByPuuidAndSgpServerId } = playerTabsRenderer.useNavigateToTab()
const { summonerName } = useStreamerModeMaskedText()

const contextMenuOffsetY =
  Number.parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--la-titlebar-height') || '0'
  ) || 0

const searchPaneShow = ref(false)
const searchWarningShown = ref(false)
const searchPaneRef = useTemplateRef('searchPaneRef')

watch(searchPaneShow, (show) => {
  if (show) {
    searchPaneRef.value?.reset()
  } else {
    searchPaneRef.value?.cancel()
  }
})

const requireSearchConfirmation = computed(
  () => appCommon.settings.streamerMode && !searchWarningShown.value
)

const showSgpServer = computed(() => {
  const serverIds = new Set(playerTabs.tabs.map((tab) => tab.sgpServerId))

  return serverIds.size > 1 || !serverIds.has(sgp.availability.sgpServerId)
})

const tabItems = computed<PlayerTabStripItem[]>(() =>
  playerTabs.tabs.map((tab, index) => {
    const summoner = tab.summoner
    const masked = appCommon.settings.streamerMode

    return {
      id: tab.id,
      loading: tab.isLoading,
      championId: ongoingGame.championSelections?.[tab.puuid] || null,
      profileIconId: summoner?.profileIconId,
      serverLabel: showSgpServer.value
        ? sgp.leagueServers.serverNames[appCommon.settings.locale]?.[tab.sgpServerId] ||
          tab.sgpServerId
        : undefined,
      gameName: summoner
        ? masked
          ? summonerName(tab.puuid, index)
          : summoner.gameName
        : undefined,
      tagLine: summoner && !masked ? summoner.tagLine : undefined
    }
  })
)

const handleRefresh = (id: string) => {
  playerTabs.getTab(id)?.refresh?.()
}

const handleReorder = ({ id, toIndex }: PlayerTabStripReorderEvent) => {
  playerTabs.moveTabToIndex(id, toIndex)
}

const handleShowSearchPane = (confirmed: boolean) => {
  if (confirmed) {
    searchWarningShown.value = true
  }

  searchPaneShow.value = true
}

const handleToSummoner = (puuid: string, sgpServerId: string | null, setCurrent = true) => {
  const targetSgpServerId = sgpServerId || sgp.availability.sgpServerId

  if (setCurrent) {
    searchPaneShow.value = false
    navigateToTabByPuuidAndSgpServerId(puuid, targetSgpServerId)
  } else {
    playerTabsRenderer.createTab(puuid, targetSgpServerId, { setCurrent: false })
  }
}
</script>

<style scoped>
.player-tabs-title {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  height: 100%;
}
</style>
