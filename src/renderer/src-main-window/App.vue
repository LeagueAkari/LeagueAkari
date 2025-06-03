<template>
  <div
    id="app-frame"
    :class="{
      'use-plain-bg': !backgroundImageUrl
    }"
  >
    <SettingsModal v-model:show="isShowingSettingModal" v-model:tab-name="settingModelTab" />
    <SetupInAppScope />
    <Transition name="bg-fade">
      <div
        v-if="backgroundImageUrl"
        :key="backgroundImageUrl"
        class="background-wallpaper"
        :class="{
          'no-image': !backgroundImageUrl
        }"
        :style="{
          backgroundImage: `url('${backgroundImageUrl}')`
        }"
      ></div>
    </Transition>
    <MainWindowTitleBar />
    <div id="app-content"><RouterView /></div>
    <div v-if="as.isRabiVersion" id="version-watermark">League Akari {{ as.version }}</div>
  </div>
</template>

<script setup lang="ts">
import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useKeyboardCombo } from '@renderer-shared/compositions/useKeyboardCombo'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/comp'
import { greeting } from '@renderer-shared/utils/greeting'
import { useTranslation } from 'i18next-vue'
import { useMessage, useNotification } from 'naive-ui'
import { provide, ref } from 'vue'
import { h } from 'vue'

import SettingsModal from './components/settings-modal/SettingsModal.vue'
import MainWindowTitleBar from './components/title-bar/MainWindowTitleBar.vue'
import { MainWindowUiRenderer } from './shards/main-window-ui'

const mui = useInstance(MainWindowUiRenderer)

const as = useAppCommonStore()

const app = useInstance(AppCommonRenderer)

const { t } = useTranslation()

greeting(as.version)

const appProvide = {
  openSettingsModal: (tabName?: string) => {
    isShowingSettingModal.value = true
    if (tabName) {
      settingModelTab.value = tabName
    }
  }
}

provide('app', appProvide)

const notification = useNotification()

const isShowingSettingModal = ref(false)
const settingModelTab = ref('basic')

app.onSecondInstance(() => {
  notification.info({
    title: 'League Akari',
    content: () => t('app.singleton'),
    duration: 10000
  })
})

const message = useMessage()

useKeyboardCombo('AKARI', {
  onFinish: () => {
    message.info(() => h(LeagueAkariSpan))
  },
  requireSameEl: true,
  caseSensitive: false,
  timeout: 250
})

const backgroundImageUrl = mui.usePreferredBackgroundImageUrl()
</script>

<style lang="less">
#app-frame {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: var(--app-min-width);
  min-height: var(--app-min-height);

  &.use-plain-bg {
    background-color: var(--background-color-primary);
  }

  > #app-content {
    z-index: 5;
    height: 0;
    flex: 1;
    overflow: hidden;
  }

  > #version-watermark {
    position: absolute;
    bottom: 8px;
    right: 16px;
    z-index: 10;
    font-size: 12px;
    opacity: 0.4;
    pointer-events: none;
  }
}

.background-wallpaper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  z-index: 0;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}

[data-theme='dark'] {
  .background-wallpaper::before {
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.8) 0%,
      rgba(0, 0, 0, 0.85) 75%,
      rgba(0, 0, 0, 0.85) 100%
    );
  }

  .background-wallpaper.no-image::before {
    background: none;
  }
}

[data-theme='light'] {
  .background-wallpaper::before {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(255, 255, 255, 0.95) 75%,
      rgba(255, 255, 255, 0.95) 100%
    );
  }

  .background-wallpaper.no-image::before {
    background: none;
  }
}

.bg-fade-enter-active,
.bg-fade-leave-active {
  transition: opacity 0.3s;
}

.bg-fade-enter-from,
.bg-fade-leave-to {
  opacity: 0;
}

.bg-fade-enter-to,
.bg-fade-leave-from {
  opacity: 1;
}
</style>
