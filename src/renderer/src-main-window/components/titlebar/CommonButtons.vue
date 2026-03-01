<template>
  <div class="common-buttons" :class="{ blurred: mws.focus === 'blurred' }">
    <!-- announcement -->
    <NPopover
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
          <div class="font-bold text-black/80 dark:text-white/80">
            {{ t('CommonButtons.announcementSummary') }}
          </div>
          <div class="my-2 h-px bg-black/10 dark:bg-white/10"></div>
          <div class="mb-2 max-w-[400px] text-xs text-black/80 dark:text-white/80">
            {{ sns.announcementSummary }}
          </div>
          <div class="flex justify-end gap-2">
            <NButton
              size="tiny"
              @click="setRead()"
              v-if="
                rcs.announcement?.frontMatter.alertLevel !== 'low' &&
                sns.lastAnnouncementUniqueId !== rcs.announcement?.uniqueId
              "
              >{{ t('CommonButtons.announcementOk') }}</NButton
            >
            <NButton size="tiny" type="primary" @click="sn.showAnnouncementModal()">{{
              t('CommonButtons.announcementSeeMore')
            }}</NButton>
          </div>
        </div>
      </template>
      <template v-else>
        {{ t('CommonButtons.announcement') }}
      </template>
    </NPopover>

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

    <!-- theme selector -->
    <NPopover placement="bottom-end" :z-index="TITLE_BAR_TOOLTIP_Z_INDEX" raw>
      <template #trigger>
        <div
          class="common-button-outer"
          v-bind:[FTUE_TARGET_ATTR]="FTUE_TARGET_THEME_SYSTEM_BUTTON"
        >
          <div class="common-button-inner">
            <NIcon><ColorPaletteOutline /></NIcon>
          </div>
        </div>
      </template>
      <div class="theme-selector-panel">
        <div class="theme-selector-title">{{ t('CommonButtons.themeSelector.title') }}</div>
        <div class="theme-selector-columns">
          <div v-for="column in themePresetColumns" :key="column.key" class="theme-selector-column">
            <div v-for="group in column.groups" :key="group.key" class="theme-selector-group">
              <div class="theme-selector-group__label">{{ group.label }}</div>
              <div
                v-for="option in group.options"
                :key="option.key"
                class="theme-selector-item"
                :class="{ active: option.key === activeThemePresetKey }"
                @click="handleApplyThemePreset(option.theme)"
              >
                <div class="theme-selector-item__label">{{ option.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NPopover>

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
import {
  FTUE_TARGET_ATTR,
  FTUE_TARGET_THEME_SYSTEM_BUTTON,
  getFtueTargetSelector
} from '@shared/constants/ftue'
import {
  AppThemeId,
  AppThemeSetting,
  BUILTIN_DARK_THEME_IDS,
  BUILTIN_LIGHT_THEME_IDS,
  getThemeColorTheme
} from '@shared/types/app-theme'
import { Notification } from '@vicons/carbon'
import { Window24Filled } from '@vicons/fluent'
import { ColorPaletteOutline, LogoGithub } from '@vicons/ionicons5'
import { useTranslation } from 'i18next-vue'
import { NBadge, NButton, NIcon, NPopover, NTooltip } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'

import { FTUE_KEY_THEME_SYSTEM_BUTTON } from '@main-window/shards/ftue/keys'
import { FtueTask, useFtueStore } from '@main-window/shards/ftue/store'
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
const ftue = useFtueStore()

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

const enqueueFtueWhenTargetReady = (task: FtueTask, retries = 40) => {
  const tryEnqueue = (remaining: number) => {
    if (ftue.isCompleted(task.id)) {
      return
    }

    if (document.querySelector(task.targetSelector)) {
      ftue.enqueue(task)
      return
    }

    if (remaining <= 0) {
      return
    }

    window.setTimeout(() => {
      tryEnqueue(remaining - 1)
    }, 80)
  }

  tryEnqueue(retries)
}

onMounted(() => {
  enqueueFtueWhenTargetReady({
    id: FTUE_KEY_THEME_SYSTEM_BUTTON,
    title: t('Ftue.themeSystem.button.title'),
    description: t('Ftue.themeSystem.button.description'),
    targetSelector: getFtueTargetSelector(FTUE_TARGET_THEME_SYSTEM_BUTTON),
    placement: 'bottom'
  })
})

const handleShowAuxWindow = () => {
  wm.auxWindow.show()
}

const handleShowOpggWindow = () => {
  wm.opggWindow.show()
}

const handleToGithub = () => {
  window.open(LEAGUE_AKARI_GITHUB, '_blank')
}

const themeToneLabel = (id: AppThemeId) => {
  const colorTheme = getThemeColorTheme(id)
  return t(`CommonButtons.themeSelector.tone.${colorTheme}`)
}

const themeLabel = (id: AppThemeId) => {
  return `${t(`CommonButtons.themeSelector.presets.${id}`, { defaultValue: id })} · ${themeToneLabel(id)}`
}

const themePresetGroups = computed(() => {
  return [
    {
      key: 'system',
      label: t('CommonButtons.themeSelector.groups.system'),
      options: [
        {
          key: 'default',
          theme: 'default' as AppThemeSetting,
          label: t('CommonButtons.themeSelector.presets.followSystem')
        }
      ]
    },
    {
      key: 'bright-core',
      label: t('CommonButtons.themeSelector.groups.brightBuiltin'),
      options: BUILTIN_LIGHT_THEME_IDS.map((id) => ({
        key: id,
        theme: id,
        label: themeLabel(id)
      }))
    },
    {
      key: 'dark-core',
      label: t('CommonButtons.themeSelector.groups.darkBuiltin'),
      options: BUILTIN_DARK_THEME_IDS.map((id) => ({
        key: id,
        theme: id,
        label: themeLabel(id)
      }))
    }
  ]
})

const themePresetColumns = computed(() => {
  return [
    {
      key: 'builtin',
      groups: themePresetGroups.value
    }
  ]
})

const themePresetOptions = computed(() => {
  return themePresetGroups.value.flatMap((group) => group.options)
})

const activeThemePresetKey = computed(() => {
  const current = themePresetOptions.value.find((option) => {
    return option.theme === as.settings.theme
  })

  if (current) {
    return current.key
  }

  return 'dark'
})

const handleApplyThemePreset = (theme: AppThemeSetting) => {
  app.setTheme(theme)
}

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
    rcs.announcement.frontMatter.alertLevel === 'medium' &&
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

.theme-selector-panel {
  width: 280px;
  max-width: calc(100vw - 16px);
  max-height: 72vh;
  overflow: auto;
  padding: 6px;
  border-radius: 8px;
  backdrop-filter: blur(8px);
  background-color: rgba(22, 34, 49, 0.92);
  border: 1px solid rgba(148, 173, 197, 0.24);
}

.theme-selector-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.theme-selector-column {
  min-width: 0;
}

.theme-selector-title {
  padding: 4px 6px 6px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(158, 178, 198, 0.95);
}

.theme-selector-item {
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(78, 195, 255, 0.12);
  }

  &.active {
    background-color: rgba(78, 195, 255, 0.22);
  }

  .theme-selector-item__label {
    font-size: 12px;
    font-weight: 700;
    color: #dde7f1;
    line-height: 1.15;
  }

  .theme-selector-item__desc {
    margin-top: 2px;
    font-size: 11px;
    color: rgba(158, 178, 198, 0.95);
    line-height: 1.15;
  }
}

.theme-selector-group {
  &:not(:first-of-type) {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid rgba(148, 173, 197, 0.18);
  }
}

.theme-selector-group__label {
  padding: 2px 6px 4px;
  font-size: 10px;
  font-weight: 700;
  color: rgba(158, 178, 198, 0.74);
  opacity: 0.7;
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
  .theme-selector-panel {
    background-color: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(41, 57, 78, 0.14);
  }

  .theme-selector-title {
    color: rgba(41, 57, 78, 0.76);
  }

  .theme-selector-item {
    &:hover {
      background-color: rgba(59, 111, 152, 0.08);
    }

    &.active {
      background-color: rgba(59, 111, 152, 0.16);
    }

    .theme-selector-item__label {
      color: rgba(26, 35, 48, 0.92);
    }

    .theme-selector-item__desc {
      color: rgba(41, 57, 78, 0.62);
    }
  }

  .theme-selector-group {
    &:not(:first-of-type) {
      border-top-color: rgba(41, 57, 78, 0.12);
    }
  }

  .theme-selector-group__label {
    color: rgba(41, 57, 78, 0.58);
  }

  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(59, 111, 152, 0.14);
      color: rgba(26, 35, 48, 0.98);
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(59, 111, 152, 0.1);
    }

    .common-button-inner {
      color: rgba(26, 35, 48, 0.86);
    }
  }
}

[data-theme-id='dark'] {
  .theme-selector-panel {
    background-color: rgba(33, 40, 54, 0.95);
    border: 1px solid rgba(210, 223, 242, 0.18);
  }

  .theme-selector-title {
    color: rgba(195, 208, 228, 0.9);
  }

  .theme-selector-item {
    &:hover {
      background-color: rgba(103, 198, 227, 0.1);
    }

    &.active {
      background-color: rgba(103, 198, 227, 0.18);
    }

    .theme-selector-item__label {
      color: rgba(241, 246, 255, 0.9);
    }

    .theme-selector-item__desc {
      color: rgba(195, 208, 228, 0.68);
    }
  }

  .theme-selector-group {
    &:not(:first-of-type) {
      border-top-color: rgba(210, 223, 242, 0.12);
    }
  }

  .theme-selector-group__label {
    color: rgba(195, 208, 228, 0.72);
  }

  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(103, 198, 227, 0.14);
      color: rgba(241, 246, 255, 0.96);
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(103, 198, 227, 0.1);
    }

    .common-button-inner {
      color: rgba(241, 246, 255, 0.86);
    }
  }
}

[data-theme-id]:not([data-theme-id='light']):not([data-theme-id='dark']) {
  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: color-mix(in oklch, var(--la-color-link) 18%, transparent);
      color: var(--la-color-text-themed);
    }

    .common-button-outer:active .common-button-inner {
      background-color: color-mix(in oklch, var(--la-color-link) 12%, transparent);
    }

    .common-button-inner {
      color: color-mix(in oklch, var(--la-color-text-themed) 92%, transparent);
    }
  }

  .theme-selector-panel {
    background-color: var(--la-color-select-menu-bg);
    border: 1px solid var(--la-color-popover-border);
  }

  .theme-selector-title {
    color: color-mix(in oklch, var(--la-color-text-themed) 78%, transparent);
  }

  .theme-selector-item {
    &:hover {
      background-color: rgb(var(--la-card-tint-rgb) / 0.14);
    }

    &.active {
      background-color: rgb(var(--la-card-tint-rgb) / 0.24);
    }

    .theme-selector-item__label {
      color: var(--la-color-text-themed);
    }
  }

  .theme-selector-group {
    &:not(:first-of-type) {
      border-top-color: color-mix(in oklch, var(--la-color-text-themed) 16%, transparent);
    }
  }

  .theme-selector-group__label {
    color: color-mix(in oklch, var(--la-color-text-themed) 58%, transparent);
  }
}

[data-theme-id='graphite'] {
  .theme-selector-panel {
    background-color: rgba(16, 28, 44, 0.95);
    border: 1px solid rgba(148, 173, 197, 0.24);
  }

  .theme-selector-title {
    color: rgba(226, 237, 247, 0.9);
  }

  .theme-selector-item {
    &:hover {
      background-color: rgba(105, 202, 255, 0.12);
    }

    &.active {
      background-color: rgba(105, 202, 255, 0.22);
    }
  }

  .theme-selector-group {
    &:not(:first-of-type) {
      border-top-color: rgba(148, 173, 197, 0.2);
    }
  }

  .theme-selector-group__label {
    color: rgba(162, 182, 204, 0.78);
  }

  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(105, 202, 255, 0.2);
      color: #e2edf7;
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(105, 202, 255, 0.14);
    }

    .common-button-inner {
      color: rgba(226, 237, 247, 0.9);
    }
  }
}

[data-theme-id='sakura'] {
  .theme-selector-panel {
    background-color: rgba(255, 250, 251, 0.97);
    border: 1px solid rgba(200, 88, 135, 0.24);
  }

  .theme-selector-title {
    color: rgba(76, 69, 78, 0.86);
  }

  .theme-selector-item {
    &:hover {
      background-color: rgba(212, 90, 134, 0.14);
    }

    &.active {
      background-color: rgba(212, 90, 134, 0.22);
    }

    .theme-selector-item__label {
      color: rgba(49, 44, 52, 0.92);
    }
  }

  .theme-selector-group {
    &:not(:first-of-type) {
      border-top-color: rgba(200, 88, 135, 0.16);
    }
  }

  .theme-selector-group__label {
    color: rgba(108, 99, 109, 0.72);
  }

  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(212, 90, 134, 0.18);
      color: rgba(49, 44, 52, 0.95);
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(212, 90, 134, 0.12);
    }

    .common-button-inner {
      color: rgba(49, 44, 52, 0.86);
    }
  }
}

[data-theme-id='mint'] {
  .theme-selector-panel {
    background-color: rgba(251, 253, 252, 0.97);
    border: 1px solid rgba(50, 142, 108, 0.24);
  }

  .theme-selector-title {
    color: rgba(58, 70, 67, 0.86);
  }

  .theme-selector-item {
    &:hover {
      background-color: rgba(36, 136, 115, 0.12);
    }

    &.active {
      background-color: rgba(36, 136, 115, 0.2);
    }

    .theme-selector-item__label {
      color: rgba(33, 45, 42, 0.94);
    }
  }

  .theme-selector-group {
    &:not(:first-of-type) {
      border-top-color: rgba(50, 142, 108, 0.16);
    }
  }

  .theme-selector-group__label {
    color: rgba(92, 104, 101, 0.72);
  }

  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(36, 136, 115, 0.16);
      color: rgba(33, 45, 42, 0.95);
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(36, 136, 115, 0.12);
    }

    .common-button-inner {
      color: rgba(33, 45, 42, 0.88);
    }
  }
}

[data-theme-id='aurora'] {
  .theme-selector-panel {
    background-color: rgba(45, 42, 66, 0.95);
    border: 1px solid rgba(167, 149, 226, 0.28);
  }

  .theme-selector-title {
    color: rgba(243, 242, 248, 0.88);
  }

  .theme-selector-item {
    &:hover {
      background-color: rgba(193, 168, 255, 0.14);
    }

    &.active {
      background-color: rgba(193, 168, 255, 0.22);
    }

    .theme-selector-item__label {
      color: #f3f2f8;
    }
  }

  .theme-selector-group {
    &:not(:first-of-type) {
      border-top-color: rgba(167, 149, 226, 0.18);
    }
  }

  .theme-selector-group__label {
    color: rgba(201, 201, 210, 0.78);
  }

  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(193, 168, 255, 0.2);
      color: #f3f2f8;
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(193, 168, 255, 0.14);
    }

    .common-button-inner {
      color: rgba(243, 242, 248, 0.88);
    }
  }
}

[data-theme-id='butter'] {
  .theme-selector-panel {
    background-color: rgba(253, 251, 247, 0.97);
    border: 1px solid rgba(182, 121, 27, 0.24);
  }

  .theme-selector-title {
    color: rgba(89, 78, 68, 0.84);
  }

  .theme-selector-item {
    &:hover {
      background-color: rgba(194, 127, 34, 0.12);
    }

    &.active {
      background-color: rgba(194, 127, 34, 0.2);
    }

    .theme-selector-item__label {
      color: rgba(66, 57, 48, 0.93);
    }
  }

  .theme-selector-group {
    &:not(:first-of-type) {
      border-top-color: rgba(182, 121, 27, 0.16);
    }
  }

  .theme-selector-group__label {
    color: rgba(120, 107, 94, 0.72);
  }

  .common-buttons {
    .common-button-outer:hover .common-button-inner {
      background-color: rgba(194, 127, 34, 0.16);
      color: rgba(66, 57, 48, 0.95);
    }

    .common-button-outer:active .common-button-inner {
      background-color: rgba(194, 127, 34, 0.12);
    }

    .common-button-inner {
      color: rgba(66, 57, 48, 0.88);
    }
  }
}

@layer components {
  .all-finished {
    @apply text-green-700! dark:text-green-300!;
  }
}
</style>
