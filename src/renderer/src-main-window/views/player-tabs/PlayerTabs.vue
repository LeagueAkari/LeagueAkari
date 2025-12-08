<template>
  <div class="h-full max-w-full" ref="tabs-wrapper">
    <!-- tab show -->
    <template v-if="pts.currentTabId">
      <PlayerTab
        v-for="tab of pts.tabs"
        :id="tab.id"
        :puuid="tab.puuid"
        :sgpServerId="tab.sgpServerId"
        :key="tab.id"
        v-show="tab.id === pts.currentTabId"
      />
    </template>

    <!-- if no tab... -->
    <div v-else class="h-full flex relative">
      <div
        class="flex flex-col items-center absolute top-48% left-50% -translate-x-1/2 -translate-y-1/2 gap-4"
      >
        <LeagueAkariSpan bold class="text-22px" />

        <!-- disconnect -->
        <template v-if="lcs.connectionState !== 'connected'">
          <span class="text-sm dark:text-white/40 text-black/40">{{
            t('PlayerTabs.disconnected')
          }}</span>
          <EasyToLaunch />
        </template>

        <!-- queueing -->
        <template v-if="lcs.login.loginQueueState">
          <span class="text-sm dark:text-white/40 text-black/40">{{
            t('PlayerTabs.queueing')
          }}</span>
        </template>

        <!-- no active tab -->
        <template v-if="lcs.summoner.me && pts.tabs.length === 0">
          <div class="text-sm dark:text-white/40 text-black/40 mt-2">
            {{ t('PlayerTabs.noActiveTab') }}
          </div>
          <div
            class="flex items-center mt-4 bg-white/6 dark:bg-black/6 py-2 px-4 rounded cursor-pointer transition-colors backdrop-blur-xs hover:bg-black/12 dark:hover:bg-white/12"
            @click="handleOpenSelfTab"
          >
            <LcuImage
              class="size-8 rounded-full"
              :src="profileIconUri(lcs.summoner.me.profileIconId)"
            />
            <StreamerModeMaskedText>
              <template #masked>
                <span class="text-sm font-bold text-dark/95 dark:text-white/95">{{
                  t('summoner', { ns: 'common' })
                }}</span>
                <span class="ml-1 text-sm dark:text-white/40 text-black/40">#####</span>
              </template>
              <span class="text-sm font-bold text-dark/95 dark:text-white/95">{{
                lcs.summoner.me.gameName
              }}</span>
              <span class="ml-1 text-sm dark:text-white/40 text-black/40"
                >#{{ lcs.summoner.me.tagLine }}</span
              >
            </StreamerModeMaskedText>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import EasyToLaunch from '@renderer-shared/components/EasyToLaunch.vue'
import LcuImage from '@renderer-shared/components/LcuImage.vue'
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import StreamerModeMaskedText from '@renderer-shared/components/StreamerModeMaskedText.vue'
import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useKeyboardCombo } from '@renderer-shared/composables/useKeyboardCombo'
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { profileIconUri } from '@renderer-shared/shards/league-client/utils'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { useTranslation } from 'i18next-vue'
import { useMessage } from 'naive-ui'
import { computed, onActivated, onDeactivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import PlayerTab from './player-tab/PlayerTab.vue'

const { t } = useTranslation()

const lcs = useLeagueClientStore()

const route = useRoute()
const router = useRouter()

const componentName = useComponentName()

const pts = usePlayerTabsStore()
const ogs = useOngoingGameStore()
const log = useInstance(LoggerRenderer)
const pt = useInstance(PlayerTabsRenderer)

const playerTabRoute = computed(() => {
  if (route.name !== 'player-tabs') {
    return null
  }

  const puuid = route.params.puuid as string
  const sgpServerId = route.params.sgpServerId as string

  if (typeof puuid === 'string' && typeof sgpServerId === 'string' && puuid && sgpServerId) {
    return { puuid, sgpServerId }
  }

  return null
})

// 路由 ==> 页面
watch(
  () => playerTabRoute.value,
  (route) => {
    if (!route) {
      return
    }

    pt.setCurrentOrCreateTab(route.puuid, route.sgpServerId)
  },
  { immediate: true }
)

// 路由 <== 页面
watch(
  () => pts.currentTabId,
  (id) => {
    if (!id) {
      router.replace({ name: 'player-tabs' })
      return
    }

    const { sgpServerId, puuid } = pt.parseUnionId(id)

    if (
      playerTabRoute.value &&
      playerTabRoute.value.puuid === puuid &&
      playerTabRoute.value.sgpServerId === sgpServerId
    ) {
      return
    }

    router.replace({
      name: 'player-tabs',
      params: { puuid, sgpServerId }
    })
  },
  { immediate: true }
)

const isEndOfGame = computed(
  () => lcs.gameflow.phase === 'EndOfGame' || lcs.gameflow.phase === 'PreEndOfGame'
)

// 页面在游戏结束后刷新对应 tab 的战绩
// 当该页面被 KeepAlive, 即使页面不可见也会触发
watch(
  () => isEndOfGame.value,
  (is, _prevP) => {
    if (pts.frontendSettings.refreshTabsAfterGameEnds && is) {
      if (!ogs.teams) {
        return
      }

      const allPlayerPuuids = Object.values(ogs.teams).flat()

      pts.tabs.forEach((tab) => {
        if (allPlayerPuuids.includes(tab.puuid) && tab.refresh) {
          tab.refresh()
        }
      })

      log.info(componentName, `eog refresh`, allPlayerPuuids)
    }
  }
)

const { navigateToTabByPuuid } = pt.useNavigateToTab()

const handleOpenSelfTab = () => {
  if (lcs.summoner.me) {
    navigateToTabByPuuid(lcs.summoner.me.puuid)
  }
}

const message = useMessage()

const { stop, start } = useKeyboardCombo('PUUID', {
  requireSameEl: true,
  onFinish: () => {
    if (pts.currentTab) {
      navigator.clipboard.writeText(pts.currentTab.puuid)
      message.success(t('PlayerTabs.copiedToClipboard'))
    }
  },
  immediate: false
})

onActivated(() => start())
onDeactivated(() => stop())
</script>
