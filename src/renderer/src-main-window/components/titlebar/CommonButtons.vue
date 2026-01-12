<template>
  <div class="common-buttons" :class="{ blurred: mws.focus === 'blurred' }">
    <!-- announcement -->
    <NTooltip
      :z-index="TITLE_BAR_TOOLTIP_Z_INDEX"
      :show="shouldShowAnnouncementTooltip || announcementTooltipShow"
      @update:show="(v) => (announcementTooltipShow = v)"
    >
      <template #trigger>
        <div class="common-button-outer" @click="sn.showAnnouncementModal()">
          <NBadge dot :show="shouldShowAnnouncementBadge" :offset="[-4, 4]">
            <div class="common-button-inner">
              <NIcon><Notification /></NIcon>
            </div>
          </NBadge>
        </div>
      </template>

      <template v-if="sns.announcementSummary">
        <div>
          <div class="font-bold text-black/60 dark:text-white/60">
            {{ t('CommonButtons.announcementSummary') }}
          </div>
          <div class="my-2 h-px bg-black/10 dark:bg-white/10"></div>
          <div class="mb-1 max-w-[400px] text-xs text-black/80 dark:text-white/80">
            {{ sns.announcementSummary }}
          </div>
          <div class="flex justify-end gap-2">
            <NButton size="tiny" @click="setRead()">{{
              t('CommonButtons.announcementOk')
            }}</NButton>
            <NButton size="tiny" type="primary" @click="sn.showAnnouncementModal()">{{
              t('CommonButtons.announcementSeeMore')
            }}</NButton>
          </div>
        </div>
      </template>
      <template v-else>
        {{ t('CommonButtons.announcement') }}
      </template>
    </NTooltip>

    <!-- github -->
    <NTooltip :z-index="TITLE_BAR_TOOLTIP_Z_INDEX">
      <template #trigger>
        <div class="common-button-outer" @click="handleToGithub">
          <div class="common-button-inner">
            <NIcon><LogoGithub /></NIcon>
          </div>
        </div>
      </template>
      {{ t('CommonButtons.github') }}
    </NTooltip>

    <!-- aux window -->
    <HorizontalExpand :show="aws.settings.enabled" class="h-full">
      <NTooltip :z-index="TITLE_BAR_TOOLTIP_Z_INDEX">
        <template #trigger>
          <div class="common-button-outer" @click="handleShowAuxWindow">
            <div class="common-button-inner">
              <NIcon><Window24Filled /></NIcon>
            </div>
          </div>
        </template>
        {{ t('CommonButtons.auxWindow') }}
      </NTooltip>
    </HorizontalExpand>

    <!-- op.gg -->
    <HorizontalExpand :show="ows.settings.enabled" class="h-full">
      <NTooltip :z-index="TITLE_BAR_TOOLTIP_Z_INDEX">
        <template #trigger>
          <div class="common-button-outer" @click="handleShowOpggWindow">
            <OpggIcon class="common-button-inner common-button-inner-img" />
          </div>
        </template>
        {{ t('CommonButtons.opggWindow') }}
      </NTooltip>
    </HorizontalExpand>

    <!-- toggle theme -->
    <NTooltip :z-index="TITLE_BAR_TOOLTIP_Z_INDEX">
      <template #trigger>
        <div class="common-button-outer" @click="handleToggleTheme">
          <div class="common-button-inner">
            <NIcon><component :is="themeIcon" /></NIcon>
          </div>
        </div>
      </template>
      {{
        as.colorTheme === 'dark'
          ? t('CommonButtons.toggleTheme.toLight')
          : t('CommonButtons.toggleTheme.toDark')
      }}
    </NTooltip>

    <!-- tasks -->
    <HorizontalExpand :show="bts.tasks.length !== 0" class="h-full">
      <NPopover placement="bottom-end" :z-index="TITLE_BAR_TOOLTIP_Z_INDEX" raw>
        <template #trigger>
          <div class="common-button-outer">
            <SpinningIcon
              :spinning="overallProgress !== 1"
              :count="bts.tasks.length"
              :progress="overallProgress"
              :class="{ 'all-finished': overallProgress === 1 }"
              class="common-button-inner common-button-inner-img"
            />
          </div>
        </template>
        <BackgroundTasks />
      </NPopover>
    </HorizontalExpand>
  </div>
</template>

<script setup lang="ts">
import OpggIcon from '@renderer-shared/assets/icon/OpggIcon.vue'
import SpinningIcon from '@renderer-shared/assets/icon/SpinningIcon.vue'
import HorizontalExpand from '@renderer-shared/components/HorizontalExpand.vue'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useBackgroundTasksStore } from '@renderer-shared/shards/background-tasks/store'
import { useRemoteConfigStore } from '@renderer-shared/shards/remote-config/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import {
  useAuxWindowStore,
  useMainWindowStore,
  useOpggWindowStore
} from '@renderer-shared/shards/window-manager/store'
import { LEAGUE_AKARI_GITHUB } from '@shared/constants/common'
import { Moon, Notification, Sun } from '@vicons/carbon'
import { Window24Filled } from '@vicons/fluent'
import { LogoGithub } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NBadge, NButton, NIcon, NPopover, NTooltip } from 'naive-ui'
import { computed, ref } from 'vue'

import { SimpleNotificationsRenderer } from '@main-window/shards/simple-notifications'
import { useSimpleNotificationsStore } from '@main-window/shards/simple-notifications/store'

import BackgroundTasks from '../BackgroundTasks.vue'

const { t } = useTranslation()

const mws = useMainWindowStore()
const aws = useAuxWindowStore()
const ows = useOpggWindowStore()
const rcs = useRemoteConfigStore()
const sns = useSimpleNotificationsStore()
const as = useAppCommonStore()

const wm = useInstance(WindowManagerRenderer)
const sn = useInstance(SimpleNotificationsRenderer)
const app = useInstance(AppCommonRenderer)

const bts = useBackgroundTasksStore()

const overallProgress = computed(() => {
  let total = 0

  for (const task of bts.tasks) {
    if (task.progress !== null) {
      total += task.progress
    } else {
      total += 1
    }
  }

  return total / bts.tasks.length
})

const TITLE_BAR_TOOLTIP_Z_INDEX = 75000

const handleShowAuxWindow = () => {
  wm.auxWindow.show()
}

const handleShowOpggWindow = () => {
  wm.opggWindow.show()
}

const handleToGithub = () => {
  window.open(LEAGUE_AKARI_GITHUB, '_blank')
}

const handleToggleTheme = () => {
  const currentTheme = as.colorTheme
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
  app.setTheme(newTheme)
}

const themeIcon = computed(() => {
  return as.colorTheme === 'dark' ? Moon : Sun
})

const shouldShowAnnouncementBadge = computed(() => {
  return (
    rcs.announcement !== null && // announcement exists
    (rcs.announcement.frontMatter.alertLevel === 'medium' ||
      rcs.announcement.frontMatter.alertLevel === 'high') && // medium or high announcement
    sns.lastAnnouncementUniqueId !== rcs.announcement.uniqueId // unread
  )
})

const announcementTooltipShow = ref(false)
const shouldShowAnnouncementTooltip = computed(() => {
  return (
    rcs.announcement !== null &&
    rcs.announcement.frontMatter.summary &&
    (rcs.announcement.frontMatter.alertLevel === 'low' ||
      rcs.announcement.frontMatter.alertLevel === 'medium' ||
      rcs.announcement.frontMatter.alertLevel === 'high') &&
    sns.lastAnnouncementUniqueId !== rcs.announcement.uniqueId
  )
})

const setRead = () => {
  sns.lastAnnouncementUniqueId = rcs.announcement?.uniqueId ?? null
}
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

.common-buttons {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;

  &.blurred {
    filter: brightness(0.8);
  }

  .common-button-outer {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 100%;
    cursor: pointer;
    -webkit-app-region: no-drag;
  }

  .common-button-inner {
    padding: 4px;
    border-radius: 2px;
    transition:
      background-color 0.3s,
      color 0.3s;
    font-size: 16px;

    i {
      display: block;
    }
  }

  .common-button-inner-img {
    width: 16px;
    height: 16px;
  }
}

[data-theme='dark'] {
  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 1);
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .common-button-inner {
      color: rgba(255, 255, 255, 0.86);
    }
  }
}

[data-theme='light'] {
  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(0, 0, 0, 0.15);
      color: rgba(0, 0, 0, 1);
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(0, 0, 0, 0.1);
    }

    .common-button-inner {
      color: rgba(0, 0, 0, 0.86);
    }
  }
}

@layer components {
  .all-finished {
    @apply text-green-700! dark:text-green-300!;
  }
}
</style>
