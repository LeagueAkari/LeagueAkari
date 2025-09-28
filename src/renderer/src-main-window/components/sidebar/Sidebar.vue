<template>
  <div class="app-sidebar" :class="{ collapsed: isCollapsed }">
    <div class="app-sidebar__head">
      <div class="app-sidebar__logo" @click="toggleCollapse">
        <NIcon class="app-sidebar__logo-icon">
          <AkariLogo />
        </NIcon>
        <NIcon class="app-sidebar__logo-toggle">
          <SidebarCollapseRight v-if="isCollapsed" />
          <SidebarCollapseLeft v-else />
        </NIcon>
      </div>
      <div class="app-sidebar__logo-text">{{ t('appName', { ns: 'common' }) }}</div>
    </div>
    <SidebarMenu
      class="app-sidebar__menu"
      :items="menu"
      :current="currentMenu"
      @update:current="(key) => handleMenuChange(key)"
      :is-collapsed="isCollapsed"
    />
    <div class="app-sidebar__padding"></div>
    <SidebarFixed :is-collapsed="isCollapsed" />
  </div>
</template>

<script setup lang="ts">
import AkariLogo from '@renderer-shared/assets/icon/AkariLogo.vue'
import SidebarCollapseLeft from '@renderer-shared/assets/icon/SidebarCollapseLeft.vue'
import SidebarCollapseRight from '@renderer-shared/assets/icon/SidebarCollapseRight.vue'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { AiStatus as AiStatusIcon } from '@vicons/carbon'
import { Tools as ToolsIcon } from '@vicons/fa'
import {
  AnimalRabbit28Filled as AnimalRabbit28FilledIcon,
  Games24Filled as Games24FilledIcon
} from '@vicons/fluent'
import { AnalyticsRound as AnalyticsRoundIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NIcon } from 'naive-ui'
import { NTooltip } from 'naive-ui'
import { Component as ComponentC, computed, h, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SidebarFixed from './SidebarFixed.vue'
import SidebarMenu from './SidebarMenu.vue'

const { t } = useTranslation()

const as = useAppCommonStore()
const ogs = useOngoingGameStore()

const renderIcon = (icon: ComponentC) => {
  return () => h(NIcon, null, () => h(icon))
}

const isCollapsed = ref(false)

// @ts-ignore
window.cp = () => {
  isCollapsed.value = !isCollapsed.value
}

const router = useRouter()
const route = useRoute()

const shouldShowOngoingGameBadge = ref(false)
const isInOngoingStage = computed(() => {
  return ogs.queryStage.phase !== 'unavailable'
})

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

watch(
  () => isInOngoingStage.value,
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
      key: 'match-history',
      icon: renderIcon(AnalyticsRoundIcon),
      name: t('SideBarMenu.match-history')
    },
    {
      key: 'ongoing-game',
      icon: renderIcon(Games24FilledIcon),
      name: t('SideBarMenu.ongoing-game'),
      inProgress: shouldShowOngoingGameBadge.value
    },
    {
      key: 'automation',
      icon: renderIcon(AiStatusIcon),
      name: t('SideBarMenu.automation')
    },
    {
      key: 'toolkit',
      icon: renderIcon(ToolsIcon),
      name: t('SideBarMenu.toolkit')
    },
    {
      key: 'test',
      icon: renderIcon(AnimalRabbit28FilledIcon),
      name: t('SideBarMenu.test'),
      show: import.meta.env.DEV || as.version.includes('rabi')
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

const lcs = useLeagueClientStore()
const lcuxs = useLeagueClientUxStore()

const isClientsPreviewShow = ref(false)

// 善意的提醒，以防用户一直在等
watchEffect(() => {
  if (lcs.connectionState === 'disconnected' && lcuxs.launchedClients.length > 1) {
    isClientsPreviewShow.value = true
  }
})
</script>

<style scoped>
.app-sidebar {
  --la-sidebar-width-collapsed: 52px;
  --la-sidebar-width-expanded: 200px;

  display: flex;
  flex-direction: column;
  height: 100%;
  width: var(--la-sidebar-width-expanded);
  transition: width 0.2s;

  &.collapsed {
    width: var(--la-sidebar-width-collapsed);
  }

  .app-sidebar__head {
    position: relative;
    display: flex;
    align-items: center;
    padding: 4px 8px;
    gap: 4px;
    height: 48px;
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

    &:hover {
      .app-sidebar__logo-toggle {
        color: rgba(255, 255, 255, 1);
      }
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
    position: relative;
    top: 1px; /* 微调位置符合视觉中心 */
    font-size: 14px;
    font-weight: bold;
    font-family: 'Comfortaa', sans-serif;
    text-wrap-mode: nowrap;
    transition: opacity 0.2s;

    .collapsed & {
      opacity: 0;
    }
  }

  .app-sidebar__collapse {
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    width: 36px;
    color: rgba(255, 255, 255, 0.6);
    transition: color 0.2s ease;

    &:hover {
      color: rgba(255, 255, 255, 1);
    }
  }

  .app-sidebar__logo-toggle {
    position: absolute;
    color: rgba(255, 255, 255, 0.8);
    transition:
      opacity 0.2s ease,
      color 0.2s ease;
    opacity: 0;
  }

  &:hover {
    .app-sidebar__logo-icon {
      opacity: 0;
    }

    .app-sidebar__logo-toggle {
      opacity: 1;
    }
  }

  .app-sidebar__padding {
    flex: 1;
  }
}
</style>
