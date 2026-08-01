<template>
  <NScrollbar class="h-full">
    <div class="flex flex-col gap-6">
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
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { useTranslation } from 'i18next-vue'
import { NCollapseTransition, NScrollbar, NSwitch } from 'naive-ui'

import { MISC_SETTINGS_NAVIGATION_STEP_KEY, type MiscSettingsNavigationPayload } from './navigation'

const { t } = useTranslation()

const a = useInstance(AppCommonRenderer)
const as = useAppCommonStore()
const rts = useRespawnTimerStore()
const rt = useInstance(RespawnTimerRenderer)

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
