<template>
  <div
    class="app-frame"
    :class="{
      mica: preferMica,
      'use-plain-bg': !backgroundImageUrl
    }"
  >
    <SettingsModal v-model:show="isShowingSettingModal" v-model:tab-name="settingModelTab" />
    <SetupInAppScope />

    <div class="app-frame__left">
      <Sidebar />
    </div>

    <div class="app-frame__right">
      <MainWindowTitleBar />

      <div class="app-frame__right-content">
        <RouterView v-slot="{ Component }">
          <Transition name="fade">
            <KeepAlive>
              <component :is="Component" />
            </KeepAlive>
          </Transition>
        </RouterView>
      </div>
    </div>

    <!--transition background profile skin -->
    <Transition name="bg-fade">
      <div
        v-if="backgroundImageUrl && !preferMica"
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

    <!-- watermark -->
    <div v-if="as.isRabiVersion" class="version-watermark">
      {{ t('appName', { ns: 'common' }) }} {{ as.version }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { SetupInAppScope } from '@renderer-shared/shards/setup-in-app-scope/comp'
import { greeting } from '@renderer-shared/utils/greeting'
import { useTranslation } from 'i18next-vue'
import { provide, ref } from 'vue'

import Sidebar from '@main-window/components/sidebar/Sidebar.vue'

import SettingsModal from './components/settings-modal/SettingsModal.vue'
import MainWindowTitleBar from './components/title-bar/MainWindowTitleBar.vue'
import { useMicaAvailability } from './composables/useMicaAvailability'
import { MainWindowUiRenderer } from './shards/main-window-ui'

const mui = useInstance(MainWindowUiRenderer)

const as = useAppCommonStore()

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

const isShowingSettingModal = ref(false)
const settingModelTab = ref('basic')

const preferMica = useMicaAvailability()
const backgroundImageUrl = mui.usePreferredBackgroundImageUrl()
</script>

<style scoped>
.app-frame {
  position: relative;
  height: 100%;
  display: flex;
  min-width: var(--la-app-min-width);
  min-height: var(--la-app-min-height);

  &.use-plain-bg:not(.mica) {
    background-color: var(--la-background-color-primary);
  }

  .app-frame__left {
    background-color: rgba(189, 189, 189, 0.2);
    z-index: 5;

    [data-theme='dark'] & {
      background-color: rgba(0, 0, 0, 0.2);
    }
  }

  .app-frame__right {
    display: flex;
    flex-direction: column;
    z-index: 5;
    width: 0;
    flex: 1;
    overflow: hidden;

    .app-frame__right-content {
      height: 0;
      flex: 1;
      overflow: hidden;
    }
  }

  .version-watermark {
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

    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(255, 255, 255, 0.95) 75%,
      rgba(255, 255, 255, 0.95) 100%
    );
  }

  &.no-image::before {
    background: none;
  }

  [data-theme='dark'] &::before {
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.8) 0%,
      rgba(0, 0, 0, 0.85) 75%,
      rgba(0, 0, 0, 0.85) 100%
    );
  }
}

.app-background {
  position: relative;
  height: 100%;
  display: flex;
  min-width: var(--la-app-min-width);
  min-height: var(--la-app-min-height);

  &.use-plain-bg:not(.mica) {
    background-color: var(--la-background-color-primary);
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
