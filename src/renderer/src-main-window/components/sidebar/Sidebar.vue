<template>
  <div
    class="app-sidebar"
    :class="{
      collapsed: mui.frontendSettings.sidebarCollapsed
    }"
    :style="{
      '--la-sidebar-width-collapsed': as.isMacOS ? '68px' : '52px',
      '--la-sidebar-width-expanded': as.isMacOS ? '192px' : '176px',
      '--la-sidebar-icon-height': as.isMacOS ? '40px' : '36px',
      '--la-sidebar-icon-horizontal-padding': as.isMacOS ? '8px' : '4px'
    }"
  >
    <!-- macOS 的 logo 区留给交通等 -->
    <div class="app-sidebar__head-safe-area" v-if="as.isMacOS"></div>
    <div class="app-sidebar__head" v-else>
      <div class="app-sidebar__logo">
        <NIcon class="app-sidebar__logo-icon">
          <AkariLogo />
        </NIcon>
      </div>
      <div class="app-sidebar__logo-text">
        {{ t('appName', { ns: 'common' }) }}{{ as.isElevated ? ' X' : '' }}
      </div>

      <!-- drag zone -->
      <div class="absolute top-0 right-0 left-0 h-4 [-webkit-app-region:drag]"></div>
    </div>

    <SidebarMenu
      class="app-sidebar__menu"
      :items="menu"
      :current="currentMenu"
      @update:current="(key) => handleMenuChange(key)"
      :is-collapsed="mui.frontendSettings.sidebarCollapsed"
    />

    <div class="app-sidebar__padding"></div>

    <SidebarFixed
      class="app-sidebar__fixed"
      :is-collapsed="mui.frontendSettings.sidebarCollapsed"
    />

    <!-- 一个展开和缩小的按钮 -->
    <div class="app-sidebar__expand-line" ref="expandLineEl" @mousedown="toggleCollapse">
      <div class="app-sidebar__expand-line-inner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AkariLogo from '@renderer-shared/assets/icon/AkariLogo.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { ToolFilled as ToolFilledIcon } from '@vicons/antd'
import { AiStatus as AiStatusIcon } from '@vicons/carbon'
import {
  AnimalRabbit28Filled as AnimalRabbit28FilledIcon,
  Games24Filled as Games24FilledIcon
} from '@vicons/fluent'
import { AnalyticsRound as AnalyticsRoundIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'
import { Component as ComponentC, computed, h, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useMainWindowUiStore } from '@main-window/shards/main-window-ui/store'

import SidebarFixed from './SidebarFixed.vue'
import SidebarMenu from './SidebarMenu.vue'

const { t } = useTranslation()

const as = useAppCommonStore()
const ogs = useOngoingGameStore()
const mui = useMainWindowUiStore()
const lcs = useLeagueClientStore()

const renderIcon = (icon: ComponentC) => {
  return () => h(NIcon, null, () => h(icon))
}

const router = useRouter()
const route = useRoute()

const shouldShowOngoingGameBadge = ref(false)
const isInCombatPhase = computed(() => {
  return ogs.queryStage.phase !== 'unavailable' && ogs.queryStage.phase !== 'lobby'
})

const toggleCollapse = () => {
  mui.frontendSettings.sidebarCollapsed = !mui.frontendSettings.sidebarCollapsed
}

watch(
  () => isInCombatPhase.value,
  (yes) => {
    if (yes && currentMenu.value !== 'ongoing-game') {
      shouldShowOngoingGameBadge.value = true
    } else {
      shouldShowOngoingGameBadge.value = false
    }
  }
)

const currentMenu = ref('match-history')
const menu = computed(() => {
  return [
    {
      key: 'player-tabs',
      icon: renderIcon(AnalyticsRoundIcon),
      name: t('SideBarMenu.match-history')
    },
    {
      key: 'ongoing-game',
      icon: renderIcon(Games24FilledIcon),
      name: t('SideBarMenu.ongoing-game'),
      inProgress: shouldShowOngoingGameBadge.value,
      isDisabled: !lcs.isConnected
    },
    {
      key: 'automation',
      icon: renderIcon(AiStatusIcon),
      name: t('SideBarMenu.automation')
    },
    {
      key: 'toolkit',
      icon: renderIcon(ToolFilledIcon),
      name: t('SideBarMenu.toolkit')
    },
    {
      key: 'test',
      icon: renderIcon(AnimalRabbit28FilledIcon),
      name: t('SideBarMenu.test'),
      show: mui.frontendSettings.showTestPage
    }
  ]
})

const handleMenuChange = async (val: string | undefined) => {
  try {
    await router.replace({ name: val })
  } catch (error) {
    console.error('routing', error)
  }
}

watchEffect(() => {
  currentMenu.value = route.name as string

  if (route.name === 'ongoing-game') {
    shouldShowOngoingGameBadge.value = false
  }
})

watch(
  () => lcs.isConnected,
  (isConnected) => {
    if (!isConnected && route.name === 'ongoing-game') {
      router.replace({ name: 'player-tabs' })
    }
  }
)
</script>

<style scoped>
.app-sidebar {
  --la-sidebar-macos-safe-top: 36px;

  display: flex;
  flex-direction: column;
  height: 100%;
  width: var(--la-sidebar-width-expanded);
  transition: width 0.3s cubic-bezier(0, 0.9, 0.1, 1);
  position: relative;

  &.collapsed {
    width: var(--la-sidebar-width-collapsed);
  }

  .app-sidebar__head-safe-area {
    height: var(--la-sidebar-macos-safe-top);
  }

  .app-sidebar__head {
    position: relative;
    display: flex;
    align-items: center;
    padding: 4px var(--la-sidebar-icon-horizontal-padding);
    gap: 4px;
    overflow: hidden;
    height: 48px;
  }

  .app-sidebar__logo {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--la-sidebar-width-collapsed) - var(--la-sidebar-icon-horizontal-padding) * 2);
    height: var(--la-sidebar-icon-height);
    font-size: 20px;
    flex-shrink: 0;
  }

  .app-sidebar__logo-icon {
    color: rgba(248, 63, 111);
    filter: drop-shadow(0 0 8px rgba(248, 63, 111, 0.3));
    transition:
      filter 0.2s,
      opacity 0.2s;
  }

  .app-sidebar__logo-text {
    font-size: 14px;
    font-weight: bold;
    font-family: 'Comfortaa', sans-serif;
    text-wrap-mode: nowrap;
    transition: opacity 0.2s;

    .collapsed & {
      opacity: 0;
    }
  }

  .app-sidebar__logo-toggle {
    position: absolute;
    color: rgba(0, 0, 0, 1);
    transition:
      opacity 0.2s ease,
      color 0.2s ease,
      transform 0.2s ease;
    opacity: 0;

    &:active {
      transform: scale(0.9);
    }

    [data-theme='dark'] & {
      color: rgba(255, 255, 255, 1);
    }

    [data-theme-id]:not([data-theme-id='light']):not([data-theme-id='dark']) & {
      color: color-mix(in oklch, var(--la-color-text-themed) 92%, transparent);
    }
  }

  .app-sidebar__padding {
    flex: 1;
  }

  .app-sidebar__fixed {
    margin-bottom: var(--la-sidebar-icon-horizontal-padding);
  }

  .app-sidebar__expand-line {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    padding: 0 4px;
    transform: translateX(50%);
    cursor: ew-resize;

    &:hover .app-sidebar__expand-line-inner {
      background-color: #f83f6f;
    }

    .app-sidebar__expand-line-inner {
      width: 2px;
      height: 100%;
      background-color: transparent;
      transition: background-color 0.4s;
    }
  }
}
</style>
