<template>
  <NScrollbar class="h-full">
    <div class="flex flex-col gap-6">
      <SettingsSection :title="t('settings.app.basic.title')">
        <SettingsRow
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
          label="语言 / Language"
          label-description="设置应用的主语言 / Set primary language for League Akari"
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
        <SettingsRow
          :label="t('settings.app.basic.dataSource.label')"
          :label-description="t('settings.app.basic.dataSource.description')"
          :label-width="400"
        >
          <div class="flex max-w-full flex-col items-end gap-2">
            <NSelect
              class="w-40!"
              size="small"
              :value="rcs.settings.preferredSource"
              @update:value="(val) => rc.setPreferredSource(val)"
              :options="remoteConfigSource"
            />
            <NPopover>
              <template #trigger>
                <div class="hover-text">
                  {{ t('settings.app.basic.dataSource.howToChoose') }}
                </div>
              </template>
              <div>
                <div class="flex h-5.5 items-center">
                  <NIcon class="mr-2">
                    <GiteeSvg />
                  </NIcon>
                  <span class="text-xs font-bold">Gitee</span>
                  <span class="ml-1">
                    <template v-if="isTestingLatency">
                      {{ t('settings.app.basic.dataSource.testingSpeed') }}
                    </template>
                    <template v-else-if="latency">
                      ({{
                        latency.giteeLatency === -1
                          ? t('settings.app.basic.dataSource.timeout')
                          : `${latency.giteeLatency.toFixed(1)} ms`
                      }})

                      <span
                        class="rounded bg-black/10 px-1 text-xs text-emerald-500 dark:bg-white/10 dark:text-emerald-400"
                        v-if="latency.giteeLatency < latency.githubLatency"
                        >{{ t('settings.app.basic.dataSource.better') }}</span
                      >
                    </template>
                  </span>
                </div>
                <div>{{ t('settings.app.basic.dataSource.tip.gitee') }}</div>
              </div>
              <div class="mt-2">
                <div class="flex h-5.5 items-center">
                  <NIcon class="mr-2">
                    <GithubIcon />
                  </NIcon>
                  <span class="text-xs font-bold">GitHub</span>
                  <span class="ml-1">
                    <template v-if="isTestingLatency">
                      {{ t('settings.app.basic.dataSource.testingSpeed') }}
                    </template>
                    <template v-else-if="latency">
                      ({{
                        latency.githubLatency === -1
                          ? t('settings.app.basic.dataSource.timeout')
                          : `${latency.githubLatency.toFixed(1)} ms`
                      }})

                      <span
                        class="rounded bg-black/10 px-1 text-xs text-emerald-500 dark:bg-white/10 dark:text-emerald-400"
                        v-if="latency.githubLatency < latency.giteeLatency"
                        >{{ t('settings.app.basic.dataSource.better') }}</span
                      >
                    </template>
                  </span>
                </div>
                <div>{{ t('settings.app.basic.dataSource.tip.github') }}</div>
              </div>
              <div class="mt-2 flex justify-center">
                <NButton
                  size="tiny"
                  secondary
                  @click="() => handleTestRepoLatency()"
                  :loading="isTestingLatency"
                >
                  {{ t('settings.app.basic.dataSource.testButton') }}
                </NButton>
              </div>
            </NPopover>
          </div>
        </SettingsRow>
      </SettingsSection>
      <SettingsSection :title="t('settings.app.selfUpdate.title')">
        <SettingsRow
          :label="t('settings.app.selfUpdate.updateLatestRelease.label')"
          :label-description="t('settings.app.selfUpdate.updateLatestRelease.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="rcs.settings.updateLatestRelease"
            @update:value="(val: boolean) => rc.setUpdateLatestRelease(val)"
          />
        </SettingsRow>
        <SettingsRow
          :label="t('settings.app.selfUpdate.autoDownloadUpdates.label')"
          :label-description="t('settings.app.selfUpdate.autoDownloadUpdates.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="sus.settings.autoDownloadUpdates"
            @update:value="(val: boolean) => su.setAutoDownloadUpdates(val)"
          />
        </SettingsRow>
        <SettingsRow
          :label="t('settings.app.selfUpdate.checkUpdates')"
          :label-description="
            t('settings.app.selfUpdate.checkFrom', {
              source: UPDATE_SOURCE_MAP[rcs.settings.preferredSource]
            })
          "
          :label-width="400"
        >
          <NFlex align="center" class="max-w-full justify-end">
            <NButton
              size="small"
              :loading="rcs.isUpdatingLatestRelease"
              secondary
              type="primary"
              @click="() => handleCheckUpdates()"
              >{{ t('settings.app.selfUpdate.checkUpdates') }}</NButton
            >
            <NButton
              size="small"
              v-if="rcs.latestRelease"
              secondary
              @click="() => handleShowUpdateModal()"
            >
              <template v-if="rcs.latestRelease.isNew">
                {{ t('settings.app.selfUpdate.newRelease') }}
              </template>
              <template v-else>
                {{ t('settings.app.selfUpdate.currentRelease') }}
              </template>
            </NButton>
            <NButton
              size="small"
              v-if="rcs.latestRelease && rcs.latestRelease.isNew"
              :disabled="sus.updateProgressInfo !== null"
              secondary
              @click="() => su.startUpdate()"
            >
              {{ t('settings.app.selfUpdate.downloadRelease') }}
            </NButton>
            <NButton
              size="small"
              v-if="sus.updateProgressInfo"
              secondary
              type="warning"
              @click="() => su.cancelUpdate()"
            >
              {{ t('settings.app.selfUpdate.cancelUpdate') }}
            </NButton>
            <span v-if="sus.lastCheckAt" class="text-xs"
              >{{ t('settings.app.selfUpdate.lastCheckAt') }}
              {{ dayjs(sus.lastCheckAt).locale(as.settings.locale.toLowerCase()).fromNow() }}</span
            >
          </NFlex>
        </SettingsRow>
        <SettingsRow
          v-if="sus.updateProgressInfo"
          :label="t('settings.app.selfUpdate.updateProgress.label')"
          :label-description="t('settings.app.selfUpdate.updateProgress.description')"
          :label-width="400"
          align="start"
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
        >
          <NButton size="small" secondary @click="() => su.openNewUpdatesDir()">{{
            t('settings.app.selfUpdate.updateDir.open')
          }}</NButton>
        </SettingsRow>
      </SettingsSection>
      <SettingsSection :title="t('settings.app.mainWindowUi.title')">
        <SettingsRow
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
      </SettingsSection>
      <SettingsSection :title="t('settings.app.lcConnection.title')">
        <SettingsRow
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
      <SettingsSection :title="t('settings.app.misc.title')">
        <SettingsRow
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
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import GiteeSvg from '@renderer-shared/components/icons/GiteeSvg.vue'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { HttpProxySetting, useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { LeagueClientUxRenderer } from '@renderer-shared/shards/league-client-ux'
import { useLeagueClientUxStore } from '@renderer-shared/shards/league-client-ux/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { useLoggerStore } from '@renderer-shared/shards/logger/store'
import { RemoteConfigRenderer } from '@renderer-shared/shards/remote-config'
import { useRemoteConfigStore } from '@renderer-shared/shards/remote-config/store'
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
import { Github as GithubIcon } from '@vicons/fa'
import { useMediaQuery } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NCollapseTransition,
  NFlex,
  NIcon,
  NInput,
  NInputNumber,
  NPopover,
  NRadio,
  NRadioGroup,
  NScrollbar,
  NSelect,
  NStep,
  NSteps,
  NSwitch,
  NTooltip,
  useDialog,
  useMessage
} from 'naive-ui'
import { computed, ref } from 'vue'

import { useMainWindowUiStore } from '@main-window/shards/main-window-ui/store'
import { SimpleNotificationsRenderer } from '@main-window/shards/simple-notifications'

const { t } = useTranslation()

const lcus = useLeagueClientUxStore()
const lcs = useLeagueClientStore()
const sus = useSelfUpdateStore()
const sgps = useSgpStore()
const wms = useWindowManagerStore()
const as = useAppCommonStore()
const muis = useMainWindowUiStore()
const mws = useMainWindowStore()
const ls = useLoggerStore()
const rcs = useRemoteConfigStore()
const su = useInstance(SelfUpdateRenderer)
const wm = useInstance(WindowManagerRenderer)
const app = useInstance(AppCommonRenderer)
const lcu = useInstance(LeagueClientUxRenderer)
const lc = useInstance(LeagueClientRenderer)
const lg = useInstance(LoggerRenderer)
const rc = useInstance(RemoteConfigRenderer)
const sn = useInstance(SimpleNotificationsRenderer)

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

const remoteConfigSource = [
  { label: 'Gitee', value: 'gitee' },
  { label: 'GitHub', value: 'github' }
]

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

type MainWindowBackgroundMode = 'profile-skin' | 'none' | 'mica'

const mainWindowBackgroundMode = computed<MainWindowBackgroundMode>(() => {
  if (wms.settings.backgroundMaterial === 'mica') {
    return 'mica'
  }

  if (muis.frontendSettings.useProfileSkinAsBackground) {
    return 'profile-skin'
  }

  return 'none'
})

const mainWindowBackgroundModeOptions = computed(() => {
  return [
    {
      label: t('settings.app.mainWindowUi.background.options.profileSkin'),
      value: 'profile-skin',
      tooltip: t('settings.app.mainWindowUi.background.tooltips.profileSkin')
    },
    {
      label: t('settings.app.mainWindowUi.background.options.none'),
      value: 'none'
    },
    {
      label: t('settings.app.mainWindowUi.background.options.mica'),
      value: 'mica',
      tooltip: t('settings.app.mainWindowUi.background.tooltips.mica'),
      disabled: !wms.supportsMica
    }
  ]
})

const handleMainWindowBackgroundModeUpdate = (value: string | number | boolean) => {
  const mode = value as MainWindowBackgroundMode

  if (mode === 'profile-skin') {
    muis.frontendSettings.useProfileSkinAsBackground = true
    void wm.setBackgroundMaterial('none')
    return
  }

  muis.frontendSettings.useProfileSkinAsBackground = false
  void wm.setBackgroundMaterial(mode === 'mica' ? 'mica' : 'none')
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

const UPDATE_SOURCE_MAP = {
  github: 'GitHub',
  gitee: 'Gitee'
}

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
      status: 'wait' as any // utilize 'any' to suppress type error
    }
  }

  switch (sus.updateProgressInfo.phase) {
    case 'downloading':
      return {
        current: 1,
        status: 'process'
      }
    case 'download-failed':
      return {
        current: 1,
        status: 'error'
      }
    case 'waiting-for-restart':
      return {
        current: 2,
        status: 'process'
      }
    default:
      return {
        current: 0,
        status: 'wait'
      }
  }
})

const isTestingLatency = ref(false)
const latency = ref<{ githubLatency: number; giteeLatency: number } | null>(null)

const handleTestRepoLatency = async () => {
  isTestingLatency.value = true
  latency.value = await rc.testRepoLatency()
  isTestingLatency.value = false
}

handleTestRepoLatency()

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
