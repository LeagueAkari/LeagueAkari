<template>
  <NScrollbar class="h-full">
    <div class="flex flex-col gap-6">
      <SettingsSection setting-id="misc.lan-web" :title="t('settings.misc.lanWeb.title')">
        <SettingsRow
          setting-id="misc.lan-web.enabled"
          :label="t('settings.misc.lanWeb.enabled.label')"
          :label-description="t('settings.misc.lanWeb.enabled.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="lws.settings.enabled"
            @update:value="(val) => lanWeb.setEnabled(val)"
          />
        </SettingsRow>
        <NCollapseTransition :show="lws.settings.enabled">
          <SettingsRow
            setting-id="misc.lan-web.port"
            :label="t('settings.misc.lanWeb.port.label')"
            :label-description="t('settings.misc.lanWeb.port.description')"
            :label-width="400"
          >
            <NInputNumber
              v-model:value="draftPort"
              size="small"
              :min="1024"
              :max="65535"
              :precision="0"
              class="w-28"
              @blur="commitPort"
              @keyup.enter="commitPort"
            />
          </SettingsRow>
          <SettingsRow
            setting-id="misc.lan-web.status"
            :label="t('settings.misc.lanWeb.status.label')"
            :label-description="t('settings.misc.lanWeb.status.description')"
            :label-width="400"
          >
            <div class="flex min-w-0 flex-col items-end gap-2 py-2">
              <NTag size="small" :type="statusTagType">
                {{ t(`settings.misc.lanWeb.status.${lws.state.status}`) }}
              </NTag>
              <NText v-if="lws.state.errorMessage" type="error" class="max-w-96 text-right text-xs">
                {{ lws.state.errorMessage }}
              </NText>
              <div
                v-for="url in lws.state.accessUrls"
                :key="url"
                class="flex max-w-[34rem] items-center gap-2"
              >
                <NText code class="min-w-0 text-xs break-all">{{ url }}</NText>
                <NButton size="tiny" secondary @click="copyUrl(url)">
                  {{ t('settings.misc.lanWeb.copy') }}
                </NButton>
              </div>
            </div>
          </SettingsRow>
        </NCollapseTransition>
      </SettingsSection>
      <SettingsSection
        setting-id="misc.respawn-timer"
        :title="t('settings.misc.respawnTimer.title')"
      >
        <SettingsRow
          setting-id="misc.respawn-timer.enabled"
          :label="t('settings.misc.respawnTimer.enabled.label')"
          :label-description="t('settings.misc.respawnTimer.enabled.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="rts.settings.enabled"
            @update:value="(val) => rt.setEnabled(val)"
          />
        </SettingsRow>
      </SettingsSection>
      <SettingsSection
        setting-id="misc.streamer-mode"
        :title="t('settings.misc.streamerMode.title')"
      >
        <SettingsRow
          setting-id="misc.streamer-mode.enabled"
          :label="t('settings.misc.streamerMode.streamerMode.label')"
          :label-description="t('settings.misc.streamerMode.streamerMode.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="as.settings.streamerMode"
            @update:value="(val) => a.setStreamerMode(val)"
          />
        </SettingsRow>
        <NCollapseTransition :show="as.settings.streamerMode">
          <SettingsRow
            setting-id="misc.streamer-mode.akari-name"
            :label="t('settings.misc.streamerMode.useAkariStyledName.label')"
            :label-description="t('settings.misc.streamerMode.useAkariStyledName.description')"
            :label-width="400"
            style="border-bottom-width: 1px"
          >
            <NSwitch
              size="small"
              :value="as.settings.streamerModeUseAkariStyledName"
              @update:value="(val) => a.setStreamerModeUseAkariStyledName(val)"
            />
          </SettingsRow>
        </NCollapseTransition>
        <SettingsRow
          setting-id="misc.streamer-mode.content-protection"
          :label="t('settings.misc.streamerMode.contentProtection.label')"
          :label-description="t('settings.misc.streamerMode.contentProtection.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="wms.settings.contentProtection"
            @update:value="(val) => wm.setContentProtection(val)"
          />
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
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { RespawnTimerRenderer } from '@renderer-shared/shards/respawn-timer'
import { useRespawnTimerStore } from '@renderer-shared/shards/respawn-timer/store'
import { LanWebRenderer } from '@renderer-shared/shards/lan-web'
import { useLanWebStore } from '@renderer-shared/shards/lan-web/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { useTranslation } from 'i18next-vue'
import {
  NButton,
  NCollapseTransition,
  NInputNumber,
  NScrollbar,
  NSwitch,
  NTag,
  NText,
  useMessage
} from 'naive-ui'
import { computed, ref, watch } from 'vue'

import { MISC_SETTINGS_NAVIGATION_STEP_KEY, type MiscSettingsNavigationPayload } from './navigation'

const { t } = useTranslation()

const a = useInstance(AppCommonRenderer)
const as = useAppCommonStore()
const rts = useRespawnTimerStore()
const rt = useInstance(RespawnTimerRenderer)
const lanWeb = useInstance(LanWebRenderer)
const lws = useLanWebStore()
const message = useMessage()
const draftPort = ref(lws.settings.port)

watch(
  () => lws.settings.port,
  (port) => (draftPort.value = port)
)

const statusTagType = computed(() => {
  if (lws.state.status === 'running') return 'success'
  if (lws.state.status === 'error') return 'error'
  if (lws.state.status === 'starting') return 'warning'
  return 'default'
})

const commitPort = () => {
  if (draftPort.value !== null && draftPort.value !== lws.settings.port) {
    void lanWeb.setPort(draftPort.value)
  }
}

const copyUrl = async (url: string) => {
  await navigator.clipboard.writeText(url)
  message.success(t('settings.misc.lanWeb.copied'))
}

const wm = useInstance(WindowManagerRenderer)
const wms = useWindowManagerStore()

useAkariNavigationStep<MiscSettingsNavigationPayload>({
  key: MISC_SETTINGS_NAVIGATION_STEP_KEY,
  activate: () => {
    if (!as.settings.streamerMode) {
      return { status: 'unavailable', reason: 'streamer-mode-details-hidden' }
    }

    return undefined
  }
})
</script>
