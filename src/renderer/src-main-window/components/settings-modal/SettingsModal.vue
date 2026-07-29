<template>
  <NModal
    transform-origin="center"
    size="small"
    preset="card"
    v-model:show="show"
    :class="styles['settings-modal']"
    @after-enter="handleAfterEnter"
  >
    <template #header>
      <span class="card-header-title">{{ t('settings.modal.title') }}</span>
    </template>
    <NTabs
      ref="tabs"
      class="settings-modal-tabs"
      type="line"
      :animated="tabsAnimated"
      size="medium"
      v-model:value="tabName"
      :theme-overrides="{ tabGapMediumLine: '18px' }"
    >
      <NTabPane name="basic">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><Settings16FilledIcon /> </NIcon>
            <span>{{ t('settings.app.title') }}</span>
          </div>
        </template>
        <AppSettings />
      </NTabPane>
      <NTabPane name="player-tabs">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><LayersIcon /> </NIcon>
            <span>{{ t('settings.matchHistory.title') }}</span>
          </div>
        </template>
        <MatchHistorySettings />
      </NTabPane>
      <NTabPane name="ongoing-game">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><Games24FilledIcon /> </NIcon>
            <span>{{ t('settings.ongoingGame.title') }}</span>
          </div>
        </template>
        <OngoingGameSettings />
      </NTabPane>
      <NTabPane name="multi-window">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><WindowMultiple20RegularIcon /> </NIcon>
            <span>{{ t('settings.multiWindow.title') }}</span>
          </div>
        </template>
        <MultiWindowSettings />
      </NTabPane>
      <NTabPane name="storage">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><Storage24FilledIcon /> </NIcon>
            <span>{{ t('settings.storage.title') }}</span>
          </div>
        </template>
        <StorageSettings v-model:tab-name="storageTabName" />
      </NTabPane>
      <NTabPane name="misc" :tab="t('settings.misc.title')">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><ToolFilledIcon /> </NIcon>
            <span>{{ t('settings.misc.title') }}</span>
          </div>
        </template>
        <MiscSettings />
      </NTabPane>
      <NTabPane name="debug">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><DebugIcon /> </NIcon>
            <span>{{ t('settings.debug.title') }}</span>
          </div>
        </template>
        <DebugSettings />
      </NTabPane>
      <NTabPane name="about">
        <template #tab>
          <div class="tab-icon-title">
            <NIcon class="icon"><InfoSharpIcon /> </NIcon>
            <span>{{ t('settings.about.title') }}</span>
          </div>
        </template>
        <AboutPane />
      </NTabPane>
    </NTabs>
  </NModal>
</template>

<script setup lang="ts">
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { useAkariNavigationBoundary } from '@renderer-shared/composables/useAkariNavigation'
import { ToolFilled as ToolFilledIcon } from '@vicons/antd'
import { Debug as DebugIcon, Layers as LayersIcon } from '@vicons/carbon'
import {
  Games24Filled as Games24FilledIcon,
  Settings16Filled as Settings16FilledIcon,
  Storage24Filled as Storage24FilledIcon,
  WindowMultiple20Regular as WindowMultiple20RegularIcon
} from '@vicons/fluent'
import { InfoSharp as InfoSharpIcon } from '@vicons/material'
import { useTranslation } from 'i18next-vue'
import { NIcon, NModal, NTabPane, NTabs } from 'naive-ui'
import { nextTick, onBeforeUnmount, ref, useCssModule, useTemplateRef, watch } from 'vue'

import {
  SETTINGS_MODAL_NAVIGATION_SCOPE,
  isSettingsTabName,
  type SettingsTabName,
  type StorageSettingsTabName
} from '@main-window/shards/akari-navigation'

import AboutPane from './AboutPane.vue'
import AppSettings from './AppSettings.vue'
import DebugSettings from './DebugSettings.vue'
import MatchHistorySettings from './MatchHistorySettings.vue'
import MiscSettings from './MiscSettings.vue'
import MultiWindowSettings from './MultiWindowSettings.vue'
import OngoingGameSettings from './OngoingGameSettings.vue'
import StorageSettings from './storage-settings/StorageSettings.vue'

const { t } = useTranslation()

const styles = useCssModule()

const show = defineModel<boolean>('show', { default: false })
const tabName = defineModel<SettingsTabName>('tabName', { default: 'basic' })
const storageTabName = defineModel<StorageSettingsTabName>('storageTabName', {
  default: 'tagged-players'
})
const tabsEl = useTemplateRef('tabs')
const tabsAnimated = ref(true)
const modalEntered = ref(false)
const enterWaiters = new Set<() => void>()
let navigationActivationSequence = 0

const handleAfterEnter = () => {
  modalEntered.value = true
  for (const resolve of enterWaiters) {
    resolve()
  }
  enterWaiters.clear()
}

const waitUntilEntered = (signal: AbortSignal) => {
  if ((show.value && modalEntered.value) || signal.aborted) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    const finish = () => {
      enterWaiters.delete(finish)
      signal.removeEventListener('abort', finish)
      resolve()
    }

    enterWaiters.add(finish)
    signal.addEventListener('abort', finish, { once: true })
  })
}

useAkariNavigationBoundary({
  scope: SETTINGS_MODAL_NAVIGATION_SCOPE,
  activate: async (destination, { signal }) => {
    if (!isSettingsTabName(destination)) {
      return { status: 'unavailable', reason: 'unknown-settings-tab' }
    }

    if (tabName.value === destination) {
      await nextTick()
      return { status: 'ready' }
    }

    const sequence = ++navigationActivationSequence
    tabsAnimated.value = false
    tabName.value = destination
    await nextTick()

    if (sequence === navigationActivationSequence) {
      tabsAnimated.value = true
    }
    if (!signal.aborted) {
      await nextTick()
    }
    return { status: 'ready' }
  }
})

defineExpose({ waitUntilEntered })

const as = useAppCommonStore()

watch(
  () => show.value,
  (visible) => {
    if (!visible) {
      modalEntered.value = false
    }
  }
)

watch(
  () => as.settings.locale,
  () => {
    requestAnimationFrame(() => {
      tabsEl.value?.syncBarPosition()
    })
  }
)

onBeforeUnmount(() => {
  for (const resolve of enterWaiters) {
    resolve()
  }
  enterWaiters.clear()
})
</script>

<style scoped>
.about-para {
  text-indent: 2em;
  font-size: 13px;
}

.about-para-2 {
  display: flex;
  align-items: center;
  margin-top: 4px;
  text-indent: 2em;
  font-size: 13px;

  img {
    display: block;
  }
}

.copyright {
  margin-top: 8px;
  font-size: 12px;
  color: rgb(87, 87, 87);
}

.divider {
  height: 1px;
  background-color: rgb(54, 54, 54);
  margin: 12px 24px;
}

.tab-icon-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px 0 4px;
  vertical-align: middle;

  .icon {
    font-size: 18px;
  }

  .opgg-icon {
    width: 16px;
    height: 16px;
  }
}
</style>

<style module>
.settings-modal {
  width: 90%;
  min-width: 720px;
  max-width: 920px;
  height: min(84vh, 760px);
  display: flex;
  flex-direction: column;
}

.settings-modal :global(.n-card-header) {
  flex-shrink: 0;
}

.settings-modal :global(.n-card-content) {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-modal :global(.settings-modal-tabs) {
  flex: 1 1 0;
  height: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-modal :global(.settings-modal-tabs > .n-tabs-nav) {
  flex-shrink: 0;
}

.settings-modal :global(.settings-modal-tabs > .n-tabs-pane-wrapper) {
  flex: 1 1 0;
  height: 0;
  min-height: 0;
  overflow: hidden;
}

.settings-modal :global(.settings-modal-tabs > .n-tabs-pane-wrapper > .n-tab-pane) {
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
