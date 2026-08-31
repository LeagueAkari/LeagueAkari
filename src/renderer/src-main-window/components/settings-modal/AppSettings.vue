<template>
  <NScrollbar class="h-full">
    <div class="flex flex-col gap-6">
      <SettingsSection setting-id="app.basic" :title="t('settings.app.basic.title')">
        <SettingsRow
          setting-id="app.basic.close-action"
          :label="t('settings.app.basic.mainWindowCloseAction.label')"
          :label-description="t('settings.app.basic.mainWindowCloseAction.description')"
          :label-width="400"
        >
          <NSelect
            class="w-40!"
            size="small"
            :value="mws.settings.closeAction"
            @update:value="(val) => wm.mainWindow.setCloseAction(val)"
            :options="closeActions"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="app.basic.locale"
          :label="t('settings.app.basic.locale.label')"
          :label-description="t('settings.app.basic.locale.description')"
          :label-width="400"
        >
          <NSelect
            class="w-40!"
            size="small"
            :value="as.settings.locale"
            @update:value="(val) => app.setLocale(val)"
            :options="locales"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="app.basic.preferred-lol-source"
          :label="t('settings.app.basic.preferredLolSource.label')"
          :label-description="t('settings.app.basic.preferredLolSource.description')"
          :label-width="400"
          align="start"
        >
          <div class="flex max-w-full flex-col items-end gap-2">
            <NSelect
              class="w-40!"
              size="small"
              :value="as.settings.preferredLolSource"
              @update:value="(val) => app.setPreferredLolSource(val)"
              :options="lolSourceOptions"
            />
            <NPopover>
              <template #trigger>
                <div class="hover-text">
                  {{ t('settings.app.basic.preferredLolSource.howToChoose') }}
                </div>
              </template>
              <div class="max-w-[320px]">
                <div class="mb-2">
                  <div class="flex h-5.5 items-center">
                    <span class="text-xs font-bold">{{
                      t('settings.app.basic.preferredLolSource.tip.sgp.title')
                    }}</span>
                  </div>
                  <div class="text-[11px] leading-relaxed">
                    <div class="text-neutral-600 dark:text-gray-200">
                      · {{ t('settings.app.basic.preferredLolSource.tip.sgp.feature1') }}
                    </div>
                    <div class="text-neutral-600 dark:text-gray-200">
                      · {{ t('settings.app.basic.preferredLolSource.tip.sgp.feature2') }}
                    </div>
                    <div class="text-neutral-600 dark:text-gray-200">
                      · {{ t('settings.app.basic.preferredLolSource.tip.sgp.feature3') }}
                    </div>
                  </div>
                  <div class="mt-1 text-[11px] text-orange-600 dark:text-orange-400">
                    ⚠️ {{ t('settings.app.basic.preferredLolSource.tip.sgp.warning') }}
                  </div>
                </div>
                <div>
                  <div class="mb-1 flex h-5.5 items-center">
                    <span class="text-xs font-bold">{{
                      t('settings.app.basic.preferredLolSource.tip.lcu.title')
                    }}</span>
                  </div>
                  <div class="text-[11px] leading-relaxed">
                    <div class="text-neutral-600 dark:text-gray-200">
                      · {{ t('settings.app.basic.preferredLolSource.tip.lcu.feature1') }}
                    </div>
                    <div class="text-neutral-600 dark:text-gray-200">
                      · {{ t('settings.app.basic.preferredLolSource.tip.lcu.feature2') }}
                    </div>
                  </div>
                  <div class="mt-1 text-[11px] text-orange-500 dark:text-orange-400">
                    ⚠️ {{ t('settings.app.basic.preferredLolSource.tip.lcu.warning') }}
                  </div>
                </div>
              </div>
            </NPopover>
            <div
              v-if="
                sgps.availability.sgpServerId &&
                as.settings.preferredLolSource === 'sgp' &&
                !sgps.availability.serversSupported.matchHistory
              "
              class="max-w-[320px] text-right text-sm font-bold text-orange-500 dark:text-orange-300"
            >
              {{
                t('settings.app.basic.preferredLolSource.unsupported', {
                  server: sgps.availability.sgpServerId
                })
              }}
            </div>
          </div>
        </SettingsRow>
        <SettingsRow
          setting-id="app.basic.theme"
          :label="t('settings.app.basic.theme.label')"
          :label-description="t('settings.app.basic.theme.description')"
          :label-width="400"
        >
          <NSelect
            class="w-40!"
            size="small"
            :value="as.settings.theme"
            @update:value="(val) => app.setTheme(val)"
            :options="themes"
          />
        </SettingsRow>
      </SettingsSection>
      <SettingsSection
        setting-id="app.self-update"
        :title="t('settings.app.selfUpdate.title')"
        :footer="
          sus.isUpdateSupportedOnCurrentPlatform
            ? undefined
            : t('settings.app.selfUpdate.temporarilyUnsupported')
        "
      >
        <SettingsRow
          setting-id="app.self-update.auto-check"
          :label="t('settings.app.selfUpdate.autoCheckUpdates.label')"
          :label-description="t('settings.app.selfUpdate.autoCheckUpdates.description')"
          :label-width="400"
          :disabled="!sus.isUpdateSupportedOnCurrentPlatform"
        >
          <NSwitch
            size="small"
            :value="sus.settings.autoCheckUpdates"
            :disabled="!sus.isUpdateSupportedOnCurrentPlatform"
            @update:value="(val: boolean) => su.setAutoCheckUpdates(val)"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="app.self-update.auto-download"
          :label="t('settings.app.selfUpdate.autoDownloadUpdates.label')"
          :label-description="t('settings.app.selfUpdate.autoDownloadUpdates.description')"
          :label-width="400"
          :disabled="!sus.isUpdateSupportedOnCurrentPlatform"
        >
          <NSwitch
            size="small"
            :value="sus.settings.autoDownloadUpdates"
            :disabled="!sus.isUpdateSupportedOnCurrentPlatform"
            @update:value="(val: boolean) => su.setAutoDownloadUpdates(val)"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="app.self-update.check"
          :label="t('settings.app.selfUpdate.checkUpdates')"
          :label-width="400"
          :disabled="!sus.isUpdateSupportedOnCurrentPlatform"
        >
          <NFlex align="center" class="max-w-full justify-end">
            <NButton
              size="small"
              :loading="sus.isCheckingUpdates"
              :disabled="!sus.isUpdateSupportedOnCurrentPlatform"
              secondary
              type="primary"
              @click="() => handleCheckUpdates()"
              >{{ t('settings.app.selfUpdate.checkUpdates') }}</NButton
            >
            <NButton
              size="small"
              v-if="sus.releaseInfo"
              :disabled="!sus.isUpdateSupportedOnCurrentPlatform"
              secondary
              @click="() => handleShowUpdateModal()"
            >
              <template v-if="sus.releaseInfo.isNew">
                {{ t('settings.app.selfUpdate.newRelease') }}
              </template>
              <template v-else>
                {{ t('settings.app.selfUpdate.currentRelease') }}
              </template>
            </NButton>
            <NButton
              size="small"
              v-if="sus.releaseInfo?.isNew && sus.releaseInfo.isUpdateSupported"
              :disabled="!sus.isUpdateSupportedOnCurrentPlatform || sus.updateProgressInfo !== null"
              secondary
              @click="() => su.startUpdate()"
            >
              {{ t('settings.app.selfUpdate.downloadRelease') }}
            </NButton>
            <NButton
              size="small"
              v-if="sus.updateProgressInfo"
              :disabled="!sus.isUpdateSupportedOnCurrentPlatform"
              secondary
              type="warning"
              @click="() => su.cancelUpdate()"
            >
              {{ t('settings.app.selfUpdate.cancelUpdate') }}
            </NButton>
          </NFlex>
        </SettingsRow>
        <SettingsRow
          v-if="sus.updateProgressInfo"
          :label="t('settings.app.selfUpdate.updateProgress.label')"
          :label-description="t('settings.app.selfUpdate.updateProgress.description')"
          :label-width="400"
          align="start"
          :disabled="!sus.isUpdateSupportedOnCurrentPlatform"
        >
          <NSteps
            class="w-full"
            :vertical="lessThan1024px"
            size="small"
            :current="processStatus.current"
            :status="processStatus.status"
          >
            <NStep>
              <template #title>
                <span class="step-title">{{
                  t('settings.app.selfUpdate.updateProgress.downloading')
                }}</span>
              </template>
              <div class="step-description">
                {{
                  t('settings.app.selfUpdate.updateProgress.finished', {
                    progress: (sus.updateProgressInfo.downloadingProgress * 100).toFixed()
                  })
                }}
              </div>
              <div class="step-description" v-if="sus.updateProgressInfo.phase === 'downloading'">
                {{
                  t('settings.app.selfUpdate.updateProgress.remain', {
                    time: formatSeconds(sus.updateProgressInfo.downloadTimeLeft, 1)
                  })
                }}
              </div>
              <div
                class="step-description"
                v-if="sus.updateProgressInfo.phase === 'download-failed'"
              >
                {{ t('settings.app.selfUpdate.updateProgress.downloadFailed') }}
              </div>
            </NStep>
            <NStep>
              <template #title>
                <span class="step-title">{{
                  t('settings.app.selfUpdate.updateProgress.waitingForRestart')
                }}</span>
              </template>
              <div class="step-description">
                {{ t('settings.app.selfUpdate.updateProgress.waitingForRestartDescription') }}
              </div>
            </NStep>
          </NSteps>
        </SettingsRow>
        <SettingsRow
          :label="t('settings.app.selfUpdate.updateDir.label')"
          :label-description="t('settings.app.selfUpdate.updateDir.description')"
          :label-width="400"
          v-if="processStatus.current === 1 && processStatus.status !== 'error'"
          :disabled="!sus.isUpdateSupportedOnCurrentPlatform"
        >
          <NButton
            size="small"
            secondary
            :disabled="!sus.isUpdateSupportedOnCurrentPlatform"
            @click="() => su.openNewUpdatesDir()"
            >{{ t('settings.app.selfUpdate.updateDir.open') }}</NButton
          >
        </SettingsRow>
      </SettingsSection>
      <SettingsSection
        setting-id="app.main-window-ui"
        :title="t('settings.app.mainWindowUi.title')"
      >
        <SettingsRow
          setting-id="app.main-window-ui.background"
          :label="t('settings.app.mainWindowUi.background.label')"
          :label-description="t('settings.app.mainWindowUi.background.description')"
          :label-width="400"
        >
          <NRadioGroup
            size="small"
            :value="mainWindowBackgroundMode"
            @update:value="handleMainWindowBackgroundModeUpdate"
          >
            <NFlex :size="12">
              <NTooltip
                v-for="option in mainWindowBackgroundModeOptions"
                :key="option.value"
                placement="top"
                :disabled="!option.tooltip"
              >
                <template #trigger>
                  <span class="inline-flex">
                    <NRadio :value="option.value" :disabled="option.disabled">{{
                      option.label
                    }}</NRadio>
                  </span>
                </template>
                <div v-if="option.tooltip" class="max-w-64 text-xs">
                  {{ option.tooltip }}
                </div>
              </NTooltip>
            </NFlex>
          </NRadioGroup>
        </SettingsRow>
        <NCollapseTransition :show="mainWindowBackgroundMode === 'custom-image'">
          <SettingsRow
            setting-id="app.main-window-ui.custom-background"
            :label="t('settings.app.mainWindowUi.customBackground.label')"
            :label-description="t('settings.app.mainWindowUi.customBackground.description')"
            control-full-line
            align="start"
          >
            <div class="flex w-full flex-col gap-3">
              <div>
                <div class="mb-1 text-xs text-black/60 dark:text-white/60">
                  {{ t('settings.app.mainWindowUi.customBackground.filePath') }}
                </div>
                <div class="flex gap-2">
                  <NInput
                    class="min-w-0 flex-1"
                    size="small"
                    readonly
                    :value="customBackgroundFilePath"
                    :placeholder="t('settings.app.mainWindowUi.customBackground.filePlaceholder')"
                  />
                  <NButton size="small" secondary @click="() => mui.selectCustomBackgroundFile()">
                    {{ t('settings.app.mainWindowUi.customBackground.browse') }}
                  </NButton>
                </div>
              </div>
              <div>
                <div class="mb-1 text-xs text-black/60 dark:text-white/60">
                  {{ t('settings.app.mainWindowUi.customBackground.overlayStrength') }}
                </div>
                <NSlider
                  :min="0"
                  :max="1"
                  :step="0.01"
                  :value="customBackgroundOverlayStrength"
                  :format-tooltip="(value) => `${Math.round(value * 100)}%`"
                  @update:value="(value) => mui.setCustomBackgroundOverlayStrength(value)"
                />
              </div>
            </div>
          </SettingsRow>
        </NCollapseTransition>
      </SettingsSection>
      <SettingsSection
        setting-id="app.lcu-connection"
        :title="t('settings.app.lcConnection.title')"
      >
        <SettingsRow
          setting-id="app.lcu-connection.auto-connect"
          :label="t('settings.app.lcConnection.autoConnect.label')"
          :label-description="t('settings.app.lcConnection.autoConnect.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="lcs.settings.autoConnect"
            @update:value="(val: boolean) => lc.setAutoConnect(val)"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="app.lcu-connection.use-wmi"
          v-if="as.isWindows"
          :label="t('settings.app.lcConnection.useWmi.label')"
          :label-description="t('settings.app.lcConnection.useWmi.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="lcus.settings.useWmi"
            @update:value="(val: boolean) => lcu.setUseWmi(val)"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="app.lcu-connection.rebuild-wmi"
          v-if="as.isWindows"
          :label="t('settings.app.lcConnection.rebuildWmi.label')"
          :label-description="t('settings.app.lcConnection.rebuildWmi.description')"
          :label-width="400"
        >
          <NButton size="small" @click="() => lcu.rebuildWmi()" type="warning">
            {{ t('settings.app.lcConnection.rebuildWmi.rebuildButton') }}
          </NButton>
        </SettingsRow>
      </SettingsSection>
      <SettingsSection setting-id="app.misc" :title="t('settings.app.misc.title')">
        <SettingsRow
          setting-id="app.misc.log-level"
          :label="t('settings.app.misc.logLevel.label')"
          :label-description="t('settings.app.misc.logLevel.description')"
          :label-width="400"
        >
          <NSelect
            class="w-40!"
            size="small"
            :value="ls.logLevel"
            @update:value="(val) => lg.setLogLevel(val)"
            :options="logLevels"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="app.misc.http-proxy.strategy"
          :label="t('settings.app.misc.httpProxy.strategy.label')"
          :label-description="t('settings.app.misc.httpProxy.strategy.description')"
          :label-width="400"
        >
          <NSelect
            :options="httpProxyStrategies"
            class="w-40!"
            size="small"
            :value="as.settings.httpProxy.strategy"
            @update:value="(val) => updateHttpProxySettings({ strategy: val })"
          />
        </SettingsRow>
        <NCollapseTransition :show="as.settings.httpProxy.strategy === 'force'">
          <SettingsRow
            setting-id="app.misc.http-proxy.host"
            :label="t('settings.app.misc.httpProxy.host.label')"
            :label-description="t('settings.app.misc.httpProxy.host.description')"
            :label-width="400"
          >
            <NInput
              :value="as.settings.httpProxy.host"
              class="w-40!"
              size="small"
              placeholder="Host"
              :status="as.settings.httpProxy.host.trim() ? 'success' : 'warning'"
              @update:value="(val) => updateHttpProxySettings({ host: val })"
            />
          </SettingsRow>
          <SettingsRow
            setting-id="app.misc.http-proxy.port"
            :label="t('settings.app.misc.httpProxy.port.label')"
            :label-description="t('settings.app.misc.httpProxy.port.description')"
            :label-width="400"
          >
            <NInputNumber
              :show-button="false"
              :min="1"
              :max="65535"
              :value="as.settings.httpProxy.port"
              class="w-40!"
              size="small"
              @update:value="(val) => updateHttpProxySettings({ port: val || 1 })"
            />
          </SettingsRow>
        </NCollapseTransition>
        <SettingsRow
          setting-id="app.misc.disable-hardware-acceleration"
          :label="t('settings.app.misc.disableHardwareAcceleration.label')"
          :label-description="t('settings.app.misc.disableHardwareAcceleration.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="as.baseConfig?.disableHardwareAcceleration ?? false"
            @update:value="(val: boolean) => handleDisableHardwareAcceleration(val)"
          />
        </SettingsRow>
        <SettingsRow
          setting-id="app.misc.uninstall"
          :label="t('settings.app.misc.uninstallApp.label')"
          :label-description="t('settings.app.misc.uninstallApp.description')"
          :label-width="400"
        >
          <NButton size="small" type="error" @click="() => handleUninstallApp()">
            {{ t('settings.app.misc.uninstallApp.button') }}
          </NButton>
        </SettingsRow>
      </SettingsSection>
    </div>
  </NScrollbar>
</template>

<script setup lang="ts">
import SettingsRow from '@main-window/settings-navigation/NavigableSettingsRow.vue'
import SettingsSection from '@main-window/settings-navigation/NavigableSettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { useAkariNavigationStep } from '@renderer-shared/shards/akari-navigation'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { HttpProxySetting, useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LeagueClientUxRenderer } from '@renderer-shared/shards/league-client-ux'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { useLoggerStore } from '@renderer-shared/shards/logger/store'
import { SelfUpdateRenderer } from '@renderer-shared/shards/self-update'
import { useSelfUpdateStore } from '@renderer-shared/shards/self-update/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import {
  useMainWindowStore,
  useWindowManagerStore
} from '@renderer-shared/shards/window-manager/store'
import {
  AppThemeId,
  BUILTIN_DARK_THEME_IDS,
  BUILTIN_LIGHT_THEME_IDS,
  getThemeColorTheme
} from '@shared/types/app-theme'
import { formatSeconds } from '@shared/utils/format'
import { useMediaQuery } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NCollapseTransition,
  NFlex,
  NInput,
  NInputNumber,
  NPopover,
  NRadio,
  NRadioGroup,
  NScrollbar,
  NSelect,
  NSlider,
  NStep,
  NSteps,
  NSwitch,
  NTooltip,
  useDialog,
  useMessage
} from 'naive-ui'
import { computed } from 'vue'

import {
  MainWindowUiRenderer,
  type MainWindowBackgroundMode
} from '@main-window/shards/main-window-ui'
import { SimpleNotificationsRenderer } from '@main-window/shards/simple-notifications'

import { APP_SETTINGS_NAVIGATION_STEP_KEY, type AppSettingsNavigationPayload } from './navigation'

const { t } = useTranslation()

const lcus = useLeagueClientUxStore()
const lcs = useLeagueClientStore()
const sus = useSelfUpdateStore()
const sgps = useSgpStore()
const wms = useWindowManagerStore()
const as = useAppCommonStore()
const mws = useMainWindowStore()
const ls = useLoggerStore()
const su = useInstance(SelfUpdateRenderer)
const wm = useInstance(WindowManagerRenderer)
const mui = useInstance(MainWindowUiRenderer)
const app = useInstance(AppCommonRenderer)
const lcu = useInstance(LeagueClientUxRenderer)
const lc = useInstance(LeagueClientRenderer)
const lg = useInstance(LoggerRenderer)
const sn = useInstance(SimpleNotificationsRenderer)

useAkariNavigationStep<AppSettingsNavigationPayload>({
  key: APP_SETTINGS_NAVIGATION_STEP_KEY,
  activate: (payload) => {
    if (payload === 'windows-only' && !as.isWindows) {
      return { status: 'unavailable', reason: 'windows-only-setting' }
    }
    if (payload === 'forced-http-proxy' && as.settings.httpProxy.strategy !== 'force') {
      return { status: 'unavailable', reason: 'http-proxy-fields-hidden' }
    }

    return undefined
  }
})

const closeActions = computed(() => {
  return [
    {
      label: t('settings.app.basic.mainWindowCloseAction.options.minimize-to-tray'),
      value: 'minimize-to-tray'
    },
    { label: t('settings.app.basic.mainWindowCloseAction.options.quit'), value: 'quit' },
    { label: t('settings.app.basic.mainWindowCloseAction.options.ask'), value: 'ask' }
  ]
})

const locales = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en' }
]

const lolSourceOptions = [
  { label: 'SGP', value: 'sgp' },
  { label: 'LCU', value: 'lcu' }
]

const themeToneLabel = (id: AppThemeId) => {
  const colorTheme = getThemeColorTheme(id)
  return t(`settings.app.basic.theme.tone.${colorTheme}`)
}

const themeLabel = (id: AppThemeId) => {
  return `${t(`settings.app.basic.theme.options.${id}`, { defaultValue: id })} · ${themeToneLabel(id)}`
}

const themes = computed(() => {
  return [
    {
      type: 'group',
      key: 'system',
      label: t('settings.app.basic.theme.groups.system'),
      children: [{ label: t('settings.app.basic.theme.options.default'), value: 'default' }]
    },
    {
      type: 'group',
      key: 'bright-core',
      label: t('settings.app.basic.theme.groups.brightBuiltin'),
      children: BUILTIN_LIGHT_THEME_IDS.map((id) => ({ label: themeLabel(id), value: id }))
    },
    {
      type: 'group',
      key: 'dark-core',
      label: t('settings.app.basic.theme.groups.darkBuiltin'),
      children: BUILTIN_DARK_THEME_IDS.map((id) => ({ label: themeLabel(id), value: id }))
    }
  ]
})

const logLevels = [
  { label: 'Info', value: 'info' },
  { label: 'Warn', value: 'warn' },
  { label: 'Error', value: 'error' },
  { label: 'Debug', value: 'debug' }
]

const mainWindowBackgroundMode = mui.useBackgroundMode()
const { filePath: customBackgroundFilePath, overlayStrength: customBackgroundOverlayStrength } =
  mui.useCustomBackgroundSettings()

const mainWindowBackgroundModeOptions = computed(() => {
  return [
    {
      label: t('settings.app.mainWindowUi.background.options.profileSkin'),
      value: 'profile-skin',
      tooltip: t('settings.app.mainWindowUi.background.tooltips.profileSkin')
    },
    {
      label: t('settings.app.mainWindowUi.background.options.customImage'),
      value: 'custom-image'
    },
    {
      label: t('settings.app.mainWindowUi.background.options.none'),
      value: 'none'
    },
    {
      label: t('settings.app.mainWindowUi.background.options.system'),
      value: 'system',
      tooltip: t('settings.app.mainWindowUi.background.tooltips.system'),
      disabled: !wms.supportsSystemBackgroundMaterial
    }
  ]
})

const handleMainWindowBackgroundModeUpdate = (value: string | number | boolean) => {
  void mui.setBackgroundMode(value as MainWindowBackgroundMode)
}

const dialog = useDialog()
const handleDisableHardwareAcceleration = (val: boolean) => {
  dialog.warning({
    title: val
      ? t('settings.app.misc.disableHardwareAccelerationDialog.disableText')
      : t('settings.app.misc.disableHardwareAccelerationDialog.enableText'),
    content: val
      ? t('settings.app.misc.disableHardwareAccelerationDialog.disableConfirmation')
      : t('settings.app.misc.disableHardwareAccelerationDialog.enableConfirmation'),
    positiveText: t('settings.app.misc.disableHardwareAccelerationDialog.positiveText'),
    negativeText: t('settings.app.misc.disableHardwareAccelerationDialog.negativeText'),
    onPositiveClick: async () => {
      await app.setDisableHardwareAcceleration(val)
    }
  })
}

const handleUninstallApp = () => {
  dialog.warning({
    title: t('settings.app.misc.uninstallApp.title'),
    content: t('settings.app.misc.uninstallApp.content'),
    positiveText: t('settings.app.misc.uninstallApp.positiveText'),
    negativeText: t('settings.app.misc.uninstallApp.negativeText'),
    onPositiveClick: async () => {
      if (!import.meta.env.DEV) {
        await su.uninstallApp()
      }
    }
  })
}

const httpProxyStrategies = computed(() => {
  return [
    // {
    //   label: t('settings.app.misc.httpProxy.strategy.options.auto'),
    //   value: 'auto'
    // },
    {
      label: t('settings.app.misc.httpProxy.strategy.options.disable'),
      value: 'disable'
    },
    {
      label: t('settings.app.misc.httpProxy.strategy.options.force'),
      value: 'force'
    }
  ]
})

const updateHttpProxySettings = (obj: Partial<HttpProxySetting>) => {
  app.setHttpProxy({ ...as.settings.httpProxy, ...obj })
}

const message = useMessage()

const handleCheckUpdates = async () => {
  const { result, reason } = await su.checkUpdates()
  switch (result) {
    case 'no-updates':
      message.success(() => t('settings.app.selfUpdate.checkUpdatesResult.no-updates'))
      break
    case 'new-updates':
      message.success(() => t('settings.app.selfUpdate.checkUpdatesResult.new-updates'))
      break
    case 'failed':
      message.warning(() => t('settings.app.selfUpdate.checkUpdatesResult.failed', { reason }))
      break
  }
}

const handleShowUpdateModal = () => {
  sn.showNewReleaseModal()
}

const processStatus = computed(() => {
  if (!sus.updateProgressInfo) {
    return {
      current: 0,
      status: 'wait' as const
    }
  }

  switch (sus.updateProgressInfo.phase) {
    case 'downloading':
      return {
        current: 1,
        status: 'process' as const
      }
    case 'download-failed':
      return {
        current: 1,
        status: 'error' as const
      }
    case 'waiting-for-restart':
      return {
        current: 2,
        status: 'process' as const
      }
    default:
      return {
        current: 0,
        status: 'wait' as const
      }
  }
})

const lessThan1024px = useMediaQuery('(max-width: 1024px)')
</script>

<style scoped>
@reference '@renderer-shared/assets/css/tailwind.css';

@layer components {
  .hover-text {
    @apply cursor-pointer text-xs text-black/60 transition-[color] duration-300 hover:text-black dark:text-white/60 dark:hover:text-white;
  }

  .step-title {
    @apply text-xs;
  }

  .step-description {
    @apply text-[11px];
  }
}
</style>
