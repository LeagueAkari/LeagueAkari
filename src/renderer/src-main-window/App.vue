<template>
  <div
    class="app-frame"
    :class="{
      mica: preferMica,
      'use-plain-bg': !backgroundImageUrl
    }"
  >
    <SettingsModal v-model:show="isShowingSettingModal" v-model:tab-name="settingModelTab" />
    <MainWindowCloseConfirmModal />

    <SetupInAppScope />

    <div class="app-frame__left">
      <Sidebar />
    </div>

    <div class="app-frame__right">
      <MainWindowTitlebar />

      <div class="app-frame__right-content" ref="contentEl">
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
import { useElementSize } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { onBeforeUnmount, ref, useTemplateRef, watchEffect } from 'vue'

import Sidebar from '@main-window/components/sidebar/Sidebar.vue'

import MainWindowCloseConfirmModal from './components/MainWindowCloseConfirmModal.vue'
import SettingsModal from './components/settings-modal/SettingsModal.vue'
import MainWindowTitlebar from './components/titlebar/MainWindowTitlebar.vue'
import { useMicaAvailability } from './composables/useMicaAvailability'
import { provideMainWindowAppContext } from './context'
import { MainWindowUiRenderer } from './shards/main-window-ui'

const mui = useInstance(MainWindowUiRenderer)

const as = useAppCommonStore()

const { t } = useTranslation()

greeting(as.version)

const contentEl = useTemplateRef('contentEl')
const { width, height } = useElementSize(contentEl)

provideMainWindowAppContext({
  contentWidth: width,
  contentHeight: height,
  openSettingsModal: (tabName?: string) => {
    isShowingSettingModal.value = true
    if (tabName) {
      settingModelTab.value = tabName
    }
  }
})

const isShowingSettingModal = ref(false)
const settingModelTab = ref('basic')

const preferMica = useMicaAvailability()
const backgroundImageUrl = mui.usePreferredBackgroundImageUrl()

const toggleMicaClass = (enabled: boolean) => {
  document.documentElement.classList.toggle('mica-enabled', enabled)
  document.body.classList.toggle('mica-enabled', enabled)
}

watchEffect(() => {
  toggleMicaClass(preferMica.value)
})

onBeforeUnmount(() => {
  toggleMicaClass(false)
})
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

    [data-theme-id]:not([data-theme-id='light']):not([data-theme-id='dark']) & {
      background-color: var(--la-sidebar-bg);
      border-right: 1px solid var(--la-sidebar-border);
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
      oklch(98.5% 0.002 247.839 / 0.9) 0%,
      oklch(98.5% 0.002 247.839 / 0.95) 75%,
      oklch(98.5% 0.002 247.839 / 0.95) 100%
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

  [data-theme-id]:not([data-theme-id='light']):not([data-theme-id='dark']) &::before {
    background: linear-gradient(
      180deg,
      var(--la-wallpaper-overlay-start) 0%,
      var(--la-wallpaper-overlay-mid) 72%,
      var(--la-wallpaper-overlay-end) 100%
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
