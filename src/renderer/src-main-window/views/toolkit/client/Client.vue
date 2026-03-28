<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <NCard size="small">
          <template #header>
            <span class="card-header-title">{{ t('Client.gameClient.title') }}</span>
          </template>
          <ControlItem
            class="control-item-margin"
            :disabled="!as.nativeSupport.nativeInput.available"
            :label="
              nativeInputRequiresElevation
                ? t('Client.gameClient.terminateGameClientWithShortcut.labelAdminRequired')
                : t('Client.gameClient.terminateGameClientWithShortcut.label')
            "
            :label-width="320"
          >
            <template #labelDescription>
              <div>{{ t('Client.gameClient.terminateGameClientWithShortcut.description') }}</div>
              <div
                v-if="!as.nativeSupport.nativeInput.available"
                class="mt-1 text-xs text-yellow-700/80 dark:text-yellow-300/80"
              >
                {{ nativeInputStatusDescription }}
              </div>
            </template>
            <NSwitch
              :disabled="!as.nativeSupport.nativeInput.available"
              size="small"
              type="warning"
              :value="gcs.settings.terminateGameClientWithShortcut"
              @update:value="(v) => gc.setTerminateGameClientWithShortcut(v)"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :disabled="!as.nativeSupport.nativeInput.available"
            :label="
              nativeInputRequiresElevation
                ? t('Client.gameClient.terminateShortcut.labelAdminRequired')
                : t('Client.gameClient.terminateShortcut.label')
            "
            :label-width="320"
          >
            <template #labelDescription>
              <div>{{ t('Client.gameClient.terminateShortcut.description') }}</div>
              <div
                v-if="!as.nativeSupport.nativeInput.available"
                class="mt-1 text-xs text-yellow-700/80 dark:text-yellow-300/80"
              >
                {{ nativeInputStatusDescription }}
              </div>
            </template>
            <ShortcutSelector
              :target-id="GameClientRenderer.SHORTCUT_ID_TERMINATE_GAME_CLIENT"
              :shortcut-id="gcs.settings.terminateShortcut"
              @update:shortcut-id="(v) => gc.setTerminateShortcut(v)"
            />
          </ControlItem>
          <ControlItem
            class="control-item-margin"
            :label="t('Client.gameClient.settingsFileMode.label')"
            :label-description="t('Client.gameClient.settingsFileMode.description')"
            :label-width="320"
          >
            <div style="display: flex; gap: 4px; align-items: center">
              <NButton
                :disabled="lcs.connectionState !== 'connected'"
                size="small"
                @click="() => handleSetSettingsFileMode('readonly')"
                >{{ t('Client.gameClient.settingsFileMode.setReadonlyButton') }}</NButton
              >
              <NButton
                :disabled="lcs.connectionState !== 'connected'"
                size="small"
                @click="() => handleSetSettingsFileMode('writable')"
                >{{ t('Client.gameClient.settingsFileMode.setWritableButton') }}</NButton
              >
              <div class="settings-file-mode-indicator" v-if="settingFileMode !== 'unavailable'">
                {{ t(`Client.gameClient.settingsFileMode.${settingFileMode}`) }}
              </div>
            </div>
          </ControlItem>
        </NCard>
        <NCard size="small" style="margin-top: 8px">
          <template #header>
            <span class="card-header-title">{{ t('Client.leagueClientUx.title') }}</span>
          </template>
          <ControlItem
            class="control-item-margin"
            :disabled="!adjustLeagueClientWindowSizeSupported"
            :label="
              adjustWindowRequiresElevation
                ? t('Client.leagueClientUx.fixWindowMethodAOptions.labelAdminRequired')
                : t('Client.leagueClientUx.fixWindowMethodAOptions.label')
            "
            :label-width="320"
          >
            <template #labelDescription>
              <div v-html="t('Client.leagueClientUx.fixWindowMethodAOptions.description')"></div>
              <div
                v-if="!adjustLeagueClientWindowSizeSupported"
                class="mt-1 text-xs text-yellow-700/80 dark:text-yellow-300/80"
              >
                {{ adjustWindowStatusDescription }}
              </div>
            </template>
            <div class="control" style="display: flex; gap: 4px; align-items: baseline">
              <NInputNumber
                style="width: 80px"
                size="small"
                :disabled="
                  !adjustLeagueClientWindowSizeSupported || lcs.connectionState !== 'connected'
                "
                :show-button="false"
                :min="1"
                @update:value="(val) => (fixWindowMethodAOptions.baseWidth = val || 0)"
                :value="fixWindowMethodAOptions.baseWidth"
                @keyup.enter="() => fixWindowInputButton2?.focus()"
              >
                <template #prefix>W</template>
              </NInputNumber>
              <NInputNumber
                ref="input-2"
                style="width: 80px"
                :disabled="
                  !adjustLeagueClientWindowSizeSupported || lcs.connectionState !== 'connected'
                "
                size="small"
                :show-button="false"
                :min="1"
                @update:value="(val) => (fixWindowMethodAOptions.baseHeight = val || 0)"
                :value="fixWindowMethodAOptions.baseHeight"
                @keyup.enter="() => handleFixWindowMethodA()"
                ><template #prefix>H</template>
              </NInputNumber>
              <NButton
                :disabled="
                  !adjustLeagueClientWindowSizeSupported || lcs.connectionState !== 'connected'
                "
                size="small"
                secondary
                type="warning"
                @click="handleFixWindowMethodA"
                >{{ t('Client.leagueClientUx.fixWindowMethodAOptions.button') }}</NButton
              >
            </div>
          </ControlItem>
        </NCard>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { GameClientRenderer } from '@renderer-shared/shards/game-client'
import { useGameClientStore } from '@renderer-shared/shards/game-client/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NInputNumber, NScrollbar, NSwitch, useDialog, useMessage } from 'naive-ui'
import { computed, reactive, ref, toRaw, useTemplateRef, watch } from 'vue'

import ShortcutSelector from '@main-window/components/ShortcutSelector.vue'

const { t } = useTranslation()

const as = useAppCommonStore()
const lcs = useLeagueClientStore()
const gcs = useGameClientStore()

const lc = useInstance(LeagueClientRenderer)
const gc = useInstance(GameClientRenderer)

const dialog = useDialog()

const nativeInputRequiresElevation = computed(
  () => as.nativeSupport.nativeInput.requiresElevation && !as.isElevated
)
const nativeInputStatusDescription = computed(() =>
  as.nativeSupport.nativeInput.availableOnCurrentPlatform
    ? t('Client.gameClient.nativeAddonRequiresAdministrator')
    : t('Client.gameClient.windowsOnlyNativeAddon')
)

const adjustWindowRequirement = computed(() => as.nativeSupport.adjustLeagueClientWindowSize)
const adjustWindowRequiresElevation = computed(
  () => adjustWindowRequirement.value.requiresElevation && !as.isElevated
)
const adjustLeagueClientWindowSizeSupported = computed(
  () => adjustWindowRequirement.value.available
)
const adjustWindowStatusDescription = computed(() =>
  adjustWindowRequirement.value.availableOnCurrentPlatform
    ? t('Client.leagueClientUx.fixWindowMethodAOptions.requiresAdministrator')
    : t('Client.leagueClientUx.fixWindowMethodAOptions.unsupportedCurrentPlatform')
)

const fixWindowInputButton2 = useTemplateRef('input-2')

const fixWindowMethodAOptions = reactive({
  baseWidth: 1280,
  baseHeight: 720
})

const handleFixWindowMethodA = async () => {
  dialog.warning({
    title: t('Client.leagueClientUx.fixWindowMethodAOptions.dialog.title'),
    content: t('Client.leagueClientUx.fixWindowMethodAOptions.dialog.content'),
    positiveText: t('Client.leagueClientUx.fixWindowMethodAOptions.dialog.positiveText'),
    negativeText: t('Client.leagueClientUx.fixWindowMethodAOptions.dialog.negativeText'),
    onPositiveClick: async () => {
      try {
        await lc.fixWindowMethodA(toRaw(fixWindowMethodAOptions))
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const message = useMessage()

const settingFileMode = ref<'readonly' | 'writable' | 'unavailable'>('unavailable')

watch(
  () => lcs.isConnected,
  async (isConnected) => {
    if (isConnected) {
      settingFileMode.value = await gc
        .getSettingsFileReadonlyOrWritable()
        .catch(() => 'unavailable')
    } else {
      settingFileMode.value = 'unavailable'
    }
  },
  { immediate: true }
)

const handleSetSettingsFileMode = async (mode: 'readonly' | 'writable') => {
  try {
    await gc.setSettingsFileReadonlyOrWritable(mode)
    settingFileMode.value = await gc.getSettingsFileReadonlyOrWritable()

    if (mode === 'readonly') {
      message.success(t('Client.gameClient.settingsFileMode.setToReadonly'))
    } else {
      message.success(t('Client.gameClient.settingsFileMode.setToWritable'))
    }
  } catch (error: any) {
    message.warning(
      t('Client.gameClient.settingsFileMode.failedToSet', {
        reason: error.message
      })
    )
    settingFileMode.value = 'unavailable'
  }
}
</script>

<style scoped>
@import '../toolkit-styles.css';

.outer-wrapper {
  position: relative;
  height: 100%;
  max-width: 100%;
}

.inner-wrapper {
  padding: 24px;
  margin: 0 auto;
  max-width: 800px;

  :deep(.n-card) {
    background-color: transparent;
  }
}

.settings-file-mode-indicator {
  font-size: 12px;
  font-weight: bold;
  margin-left: 8px;
}

[data-theme='dark'] {
  .settings-file-mode-indicator {
    color: #46ff90d0;
  }
}

[data-theme='light'] {
  .settings-file-mode-indicator {
    color: rgba(0, 122, 49, 0.816);
  }
}
</style>
