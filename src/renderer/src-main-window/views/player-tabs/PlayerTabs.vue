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
    <StartupPane v-else class="h-full" />
  </div>
</template>

<script setup lang="ts">
import { useKeyboardCombo } from '@renderer-shared/composables/useKeyboardCombo'
import { useInstance } from '@renderer-shared/shards'
import { useTranslation } from 'i18next-vue'
import { useMessage } from 'naive-ui'
import { computed, onActivated, onDeactivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { PlayerTabsRenderer } from '@main-window/shards/player-tabs'
import { parseInitParamsFromQuery } from '@main-window/shards/player-tabs/init-params'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import StartupPane from './components/StartupPane.vue'
import PlayerTab from './components/player-tab/PlayerTab.vue'

const { t } = useTranslation()

const route = useRoute()
const router = useRouter()

const pts = usePlayerTabsStore()
const pt = useInstance(PlayerTabsRenderer)

const playerTabRoute = computed(() => {
  if (route.name !== 'player-tabs') {
    return null
  }

  const puuid = route.params.puuid as string
  const sgpServerId = route.params.sgpServerId as string
  const initParams = parseInitParamsFromQuery(route.query)

  if (typeof puuid === 'string' && typeof sgpServerId === 'string' && puuid && sgpServerId) {
    return { puuid, sgpServerId, initParams }
  }

  return null
})

// 路由 ==> 页面
watch(
  () => playerTabRoute.value,
  (targetRoute) => {
    if (!targetRoute) {
      return
    }

    pt.createTabAndSetCurrent(targetRoute.puuid, targetRoute.sgpServerId, targetRoute.initParams)

    // route query 只作为一次性 initParams 通道，交给 tab 后立即清掉。
    if (targetRoute.initParams) {
      void router.replace({
        name: 'player-tabs',
        params: { puuid: targetRoute.puuid, sgpServerId: targetRoute.sgpServerId }
      })
    }
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
