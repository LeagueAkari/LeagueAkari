<template>
  <NScrollbar style="height: 65vh">
    <NCard size="small">
      <template #header>
        <span class="card-header-title">{{ t('AppSettings.basic.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.basic.mainWindowCloseAction.label')"
        :label-description="t('AppSettings.basic.mainWindowCloseAction.description')"
        :label-width="400"
      >
        <NSelect
          style="width: 160px"
          size="small"
          :value="mws.settings.closeAction"
          @update:value="(val) => wm.mainWindow.setCloseAction(val)"
          :options="closeActions"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="语言 / Language"
        label-description="设置应用的主语言 / Set primary language for League Akari"
        :label-width="400"
      >
        <NSelect
          style="width: 160px"
          size="small"
          :value="as.settings.locale"
          @update:value="(val) => app.setLocale(val)"
          :options="locales"
        />
      </ControlItem>
      <ControlItem
        v-if="as.settings.isInKyokoMode"
        class="control-item-margin"
        label="Theme Color (experimental)"
        label-description="Theme color for League Akari (!!DEBUG ONLY!!)"
        :label-width="400"
      >
        <NSelect
          style="width: 160px"
          size="small"
          :value="as.settings.theme"
          @update:value="(val) => app.setTheme(val)"
          :options="themes"
        />
      </ControlItem>
      <ControlItem
        v-if="isDev && as.settings.isInKyokoMode"
        class="control-item-margin"
        :label="t('AppSettings.basic.backgroundMaterial.label')"
        :label-description="t('AppSettings.basic.backgroundMaterial.description')"
        :label-width="400"
      >
        <NSelect
          style="width: 160px"
          size="small"
          :value="wms.settings.backgroundMaterial"
          @update:value="(val) => wm.setBackgroundMaterial(val)"
          :options="backgroundMaterials"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        label="远程数据源"
        label-description="通过 GitHub / Gitee 获取或更新数据"
        :label-width="400"
      >
        <NFlex align="center">
          <NSelect
            style="width: 160px"
            size="small"
            :value="rcs.settings.preferredSource"
            @update:value="(val) => rc.setRemoteConfigSource(val)"
            :options="remoteConfigSource"
          />
          <NTooltip>
            <template #trigger>
              <div class="hover-text">
                {{ t('AppSettings.basic.dataSource.howToChoose') }}
              </div>
            </template>
            <div>
              <div style="display: flex; align-items: center; height: 22px">
                <NIcon style="margin-right: 8px; font-size: 16px">
                  <GiteeSvg />
                </NIcon>
                <span style="font-weight: bold; font-size: 12px">Gitee</span>
                <span style="margin-left: 4px">
                  <template v-if="isTestingLatency">
                    {{ t('AppSettings.basic.dataSource.testingSpeed') }}
                  </template>
                  <template v-else-if="latency">
                    ({{
                      latency.giteeLatency === -1
                        ? t('AppSettings.basic.dataSource.timeout')
                        : `${latency.giteeLatency} ms`
                    }})
                  </template>
                </span>
              </div>
              <div>{{ t('AppSettings.basic.dataSource.tip.gitee') }}</div>
            </div>
            <div style="margin-top: 8px">
              <div style="display: flex; align-items: center; height: 22px">
                <NIcon style="margin-right: 8px">
                  <GithubIcon />
                </NIcon>
                <span style="font-size: 12px; font-weight: bold">GitHub</span>
                <span style="margin-left: 4px">
                  <template v-if="isTestingLatency">
                    {{ t('AppSettings.basic.dataSource.testingSpeed') }}
                  </template>
                  <template v-else-if="latency">
                    ({{
                      latency.githubLatency === -1
                        ? t('AppSettings.basic.dataSource.timeout')
                        : `${latency.githubLatency} ms`
                    }})
                  </template>
                </span>
              </div>
              <div>{{ t('AppSettings.basic.dataSource.tip.github') }}</div>
            </div>
            <div style="margin-top: 8px; display: flex; justify-content: center">
              <NButton
                size="tiny"
                secondary
                @click="() => handleTestLatency()"
                :loading="isTestingLatency"
              >
                {{ t('AppSettings.basic.dataSource.testButton') }}
              </NButton>
            </div>
          </NTooltip>
        </NFlex>
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('AppSettings.selfUpdate.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.selfUpdate.autoDownloadUpdates.label')"
        :label-description="t('AppSettings.selfUpdate.autoDownloadUpdates.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="sus.settings.autoDownloadUpdates"
          @update:value="(val: boolean) => su.setAutoDownloadUpdates(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.selfUpdate.checkUpdates')"
        :label-description="
          t('AppSettings.selfUpdate.checkFrom', {
            source: UPDATE_SOURCE_MAP[rcs.settings.preferredSource]
          })
        "
        :label-width="400"
      >
        <NFlex align="center">
          <NButton
            size="small"
            :loading="rcs.isUpdatingLatestRelease"
            secondary
            type="primary"
            @click="() => handleCheckUpdates()"
            >{{ t('AppSettings.selfUpdate.checkUpdates') }}</NButton
          >
          <NButton
            size="small"
            v-if="rcs.latestRelease"
            secondary
            @click="() => handleShowUpdateModal()"
          >
            <template v-if="rcs.latestRelease.isNew">
              {{ t('AppSettings.selfUpdate.newRelease') }}
            </template>
            <template v-else>
              {{ t('AppSettings.selfUpdate.currentRelease') }}
            </template>
          </NButton>
          <NButton
            size="small"
            v-if="rcs.latestRelease && rcs.latestRelease.isNew"
            :disabled="sus.updateProgressInfo !== null"
            secondary
            @click="() => su.startUpdate()"
          >
            {{ t('AppSettings.selfUpdate.downloadRelease') }}
          </NButton>
          <NButton
            size="small"
            v-if="sus.updateProgressInfo"
            secondary
            type="warning"
            @click="() => su.cancelUpdate()"
          >
            {{ t('AppSettings.selfUpdate.cancelUpdate') }}
          </NButton>
          <span v-if="sus.lastCheckAt" style="font-size: 12px"
            >{{ t('AppSettings.selfUpdate.lastCheckAt') }}
            {{ dayjs(sus.lastCheckAt).locale(as.settings.locale.toLowerCase()).fromNow() }}</span
          >
        </NFlex>
      </ControlItem>
      <ControlItem
        v-if="sus.updateProgressInfo"
        class="control-item-margin"
        :label="t('AppSettings.selfUpdate.updateProgress.label')"
        :label-description="t('AppSettings.selfUpdate.updateProgress.description')"
        :label-width="400"
      >
        <NSteps
          :vertical="lessThan1024px"
          size="small"
          :current="processStatus.current"
          :status="processStatus.status"
        >
          <NStep>
            <template #title>
              <span class="step-title">{{
                t('AppSettings.selfUpdate.updateProgress.downloading')
              }}</span>
            </template>
            <div class="step-description">
              {{
                t('AppSettings.selfUpdate.updateProgress.finished', {
                  progress: (sus.updateProgressInfo.downloadingProgress * 100).toFixed()
                })
              }}
            </div>
            <div class="step-description" v-if="sus.updateProgressInfo.phase === 'downloading'">
              {{
                t('AppSettings.selfUpdate.updateProgress.remain', {
                  time: formatSeconds(sus.updateProgressInfo.downloadTimeLeft, 1)
                })
              }}
            </div>
            <div class="step-description" v-if="sus.updateProgressInfo.phase === 'download-failed'">
              {{ t('AppSettings.selfUpdate.updateProgress.downloadFailed') }}
            </div>
          </NStep>
          <NStep>
            <template #title>
              <span class="step-title">{{
                t('AppSettings.selfUpdate.updateProgress.unpacking')
              }}</span>
            </template>
            <div class="step-description">
              {{
                t('AppSettings.selfUpdate.updateProgress.finished', {
                  progress: (sus.updateProgressInfo.unpackingProgress * 100).toFixed()
                })
              }}
            </div>
            <div class="step-description" v-if="sus.updateProgressInfo.phase === 'unpack-failed'">
              {{ t('AppSettings.selfUpdate.updateProgress.unpackFailed') }}
            </div>
          </NStep>
          <NStep>
            <template #title>
              <span class="step-title">{{
                t('AppSettings.selfUpdate.updateProgress.waitingForRestart')
              }}</span>
            </template>
            <div class="step-description">
              {{ t('AppSettings.selfUpdate.updateProgress.waitingForRestartDescription') }}
            </div>
          </NStep>
        </NSteps>
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.selfUpdate.updateDir.label')"
        :label-description="t('AppSettings.selfUpdate.updateDir.description')"
        :label-width="400"
        v-if="
          processStatus.current >= 2 ||
          (processStatus.current === 1 && processStatus.status !== 'error')
        "
      >
        <NButton size="small" secondary @click="() => su.openNewUpdatesDir()">{{
          t('AppSettings.selfUpdate.updateDir.open')
        }}</NButton>
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('AppSettings.mainWindowUi.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.mainWindowUi.useProfileSkinAsBackground.label')"
        :label-description="t('AppSettings.mainWindowUi.useProfileSkinAsBackground.description')"
        :label-width="400"
        :disabled="preferMica"
      >
        <NSwitch
          :disabled="preferMica"
          size="small"
          v-model:value="muis.frontendSettings.useProfileSkinAsBackground"
        />
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('AppSettings.lcConnection.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.lcConnection.autoConnect.label')"
        :label-description="t('AppSettings.lcConnection.autoConnect.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="lcs.settings.autoConnect"
          @update:value="(val: boolean) => lc.setAutoConnect(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.lcConnection.useWmic.label')"
        :label-description="t('AppSettings.lcConnection.useWmic.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="lcus.settings.useWmic"
          @update:value="(val: boolean) => lcu.setUseWmic(val)"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.lcConnection.rebuildWmi.label')"
        :label-description="t('AppSettings.lcConnection.rebuildWmi.description')"
        :label-width="400"
      >
        <NButton size="small" @click="() => lcu.rebuildWmi()" type="warning">
          {{ t('AppSettings.lcConnection.rebuildWmi.rebuildButton') }}
        </NButton>
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('AppSettings.misc.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.misc.logLevel.label')"
        :label-description="t('AppSettings.misc.logLevel.description')"
        :label-width="400"
      >
        <NSelect
          style="width: 160px"
          size="small"
          :value="ls.logLevel"
          @update:value="(val) => lg.setLogLevel(val)"
          :options="logLevels"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.misc.httpProxy.strategy.label')"
        :label-description="t('AppSettings.misc.httpProxy.strategy.description')"
        :label-width="400"
      >
        <NSelect
          :options="httpProxyStrategies"
          style="width: 160px"
          size="small"
          :value="as.settings.httpProxy.strategy"
          @update:value="(val) => updateHttpProxySettings({ strategy: val })"
        />
      </ControlItem>
      <NCollapseTransition
        class="control-item-margin"
        :show="as.settings.httpProxy.strategy === 'force'"
      >
        <ControlItem
          class="control-item-margin"
          :label="t('AppSettings.misc.httpProxy.host.label')"
          :label-description="t('AppSettings.misc.httpProxy.host.description')"
          :label-width="400"
        >
          <NInput
            :value="as.settings.httpProxy.host"
            style="width: 160px"
            size="small"
            placeholder="Host"
            :status="as.settings.httpProxy.host.trim() ? 'success' : 'warning'"
            @update:value="(val) => updateHttpProxySettings({ host: val })"
          />
        </ControlItem>
        <ControlItem
          class="control-item-margin"
          :label="t('AppSettings.misc.httpProxy.port.label')"
          :label-description="t('AppSettings.misc.httpProxy.port.description')"
          :label-width="400"
        >
          <NInputNumber
            :show-button="false"
            :min="1"
            :max="65535"
            :value="as.settings.httpProxy.port"
            style="width: 160px"
            size="small"
            @update:value="(val) => updateHttpProxySettings({ port: val || 1 })"
          />
        </ControlItem>
      </NCollapseTransition>
      <ControlItem
        class="control-item-margin"
        :label="t('AppSettings.misc.disableHardwareAcceleration.label')"
        :label-description="t('AppSettings.misc.disableHardwareAcceleration.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="as.baseConfig?.disableHardwareAcceleration ?? false"
          @update:value="(val: boolean) => handleDisableHardwareAcceleration(val)"
        />
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
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
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import {
  useMainWindowStore,
  useWindowManagerStore
} from '@renderer-shared/shards/window-manager/store'
import { formatSeconds } from '@shared/utils/format'
import { Github as GithubIcon } from '@vicons/fa'
import { useMediaQuery } from '@vueuse/core'
import dayjs from 'dayjs'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NCard,
  NCollapseTransition,
  NFlex,
  NIcon,
  NInput,
  NInputNumber,
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

import { useMicaAvailability } from '@main-window/compositions/useMicaAvailability'
import { useMainWindowUiStore } from '@main-window/shards/main-window-ui/store'
import { SimpleNotificationsRenderer } from '@main-window/shards/simple-notifications'

const { t } = useTranslation()

const isDev = import.meta.env.DEV

const lcus = useLeagueClientUxStore()
const lcs = useLeagueClientStore()
const sus = useSelfUpdateStore()
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

const preferMica = useMicaAvailability()

const closeActions = computed(() => {
  return [
    {
      label: t('AppSettings.basic.mainWindowCloseAction.options.minimize-to-tray'),
      value: 'minimize-to-tray'
    },
    { label: t('AppSettings.basic.mainWindowCloseAction.options.quit'), value: 'quit' },
    { label: t('AppSettings.basic.mainWindowCloseAction.options.ask'), value: 'ask' }
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

const themes = [
  { label: '跟随系统', value: 'default' },
  { label: '亮色', value: 'light' },
  { label: '暗色', value: 'dark' }
]

const logLevels = [
  { label: 'Info', value: 'info' },
  { label: 'Warn', value: 'warn' },
  { label: 'Error', value: 'error' },
  { label: 'Debug', value: 'debug' }
]

const backgroundMaterials = computed(() => {
  return [
    { label: '默认', value: 'none' },
    { label: 'Mica', value: 'mica', disabled: !wms.supportsMica }
  ]
})
const dialog = useDialog()
const handleDisableHardwareAcceleration = (val: boolean) => {
  dialog.warning({
    title: val
      ? t('AppSettings.misc.disableHardwareAccelerationDialog.disableText')
      : t('AppSettings.misc.disableHardwareAccelerationDialog.enableText'),
    content: val
      ? t('AppSettings.misc.disableHardwareAccelerationDialog.disableConfirmation')
      : t('AppSettings.misc.disableHardwareAccelerationDialog.enableConfirmation'),
    positiveText: t('AppSettings.misc.disableHardwareAccelerationDialog.positiveText'),
    negativeText: t('AppSettings.misc.disableHardwareAccelerationDialog.negativeText'),
    onPositiveClick: async () => {
      await app.setDisableHardwareAcceleration(val)
    }
  })
}

const httpProxyStrategies = computed(() => {
  return [
    {
      label: t('AppSettings.misc.httpProxy.strategy.options.auto'),
      value: 'auto'
    },
    {
      label: t('AppSettings.misc.httpProxy.strategy.options.disable'),
      value: 'disable'
    },
    {
      label: t('AppSettings.misc.httpProxy.strategy.options.force'),
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
      message.success(() => t('AppSettings.selfUpdate.checkUpdatesResult.no-updates'))
      break
    case 'new-updates':
      message.success(() => t('AppSettings.selfUpdate.checkUpdatesResult.new-updates'))
      break
    case 'failed':
      message.warning(() => t('AppSettings.selfUpdate.checkUpdatesResult.failed', { reason }))
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
    case 'unpacking':
      return {
        current: 2,
        status: 'process'
      }
    case 'unpack-failed':
      return {
        current: 2,
        status: 'error'
      }
    case 'waiting-for-restart':
      return {
        current: 3,
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

const handleTestLatency = async () => {
  isTestingLatency.value = true
  latency.value = await rc.testLatency()
  isTestingLatency.value = false
}

handleTestLatency()

const lessThan1024px = useMediaQuery('(max-width: 1024px)')
</script>

<style lang="less" scoped>
.hover-text {
  font-size: 12px;
  color: #aaa;
  cursor: pointer;
  transition: color 0.3s;

  &:hover {
    color: #fff;
  }
}

.step-title {
  font-size: 12px;
}

.step-description {
  font-size: 11px;
}
</style>
