<template>
  <div
    class="app-sidebar"
    ref="sidebarEl"
    :class="{
      collapsed: mui.frontendSettings.sidebarCollapsed,
      'is-hovered': isSidebarHoveredDebounced
    }"
  >
    <div class="app-sidebar__head">
      <div class="app-sidebar__logo" @click="toggleCollapse">
        <NIcon class="app-sidebar__logo-icon">
          <AkariLogo />
        </NIcon>
        <NIcon class="app-sidebar__logo-toggle">
          <Transition name="fade">
            <SidebarCollapseRight v-if="mui.frontendSettings.sidebarCollapsed" />
            <SidebarCollapseLeft v-else />
          </Transition>
        </NIcon>
      </div>
      <div class="app-sidebar__logo-text">
        {{ t('appName', { ns: 'common' }) }}{{ as.isAdministrator ? ' X' : '' }}
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
  </div>
</template>

<script setup lang="ts">
import AkariLogo from '@renderer-shared/assets/icon/AkariLogo.vue'
import SidebarCollapseLeft from '@renderer-shared/assets/icon/SidebarCollapseLeft.vue'
import SidebarCollapseRight from '@renderer-shared/assets/icon/SidebarCollapseRight.vue'
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
import { refDebounced, useElementHover } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'
import { Component as ComponentC, computed, h, ref, useTemplateRef, watch, watchEffect } from 'vue'
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

const isSidebarHovered = useElementHover(useTemplateRef('sidebarEl'))
const isSidebarHoveredDebounced = refDebounced(isSidebarHovered, 100)
</script>

<style scoped>
.app-sidebar {
  --la-sidebar-width-collapsed: 52px;
  --la-sidebar-width-expanded: 176px;

  display: flex;
  flex-direction: column;
  height: 100%;
  width: var(--la-sidebar-width-expanded);
  transition: width 0.3s cubic-bezier(0, 0.9, 0.1, 1);

  &.collapsed {
    width: var(--la-sidebar-width-collapsed);
  }

  .app-sidebar__head {
    position: relative;
    display: flex;
    align-items: center;
    padding: 4px 8px;
    padding-top: calc(4px + var(--la-mac-sidebar-safe-top));
    gap: 4px;
    height: calc(48px + var(--la-mac-sidebar-safe-top));
    overflow: hidden;
  }

  .app-sidebar__logo {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    font-size: 20px;
    flex-shrink: 0;
    cursor: pointer;
  }

  &.is-hovered {
    .app-sidebar__logo-icon {
      opacity: 0;
    }

    .app-sidebar__logo-toggle {
      opacity: 1;
    }
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

    [data-theme-id='graphite'] & {
      color: #dff1ff;
    }
  }

  .app-sidebar__padding {
    flex: 1;
  }

  .app-sidebar__fixed {
    margin-bottom: 4px;
  }
}
</style>
