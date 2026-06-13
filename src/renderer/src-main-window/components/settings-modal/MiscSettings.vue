<template>
  <NScrollbar class="h-full">
    <div class="flex flex-col gap-6">
      <SettingsSection :title="t('MiscSettings.respawnTimer.title')">
        <SettingsRow
          :label="t('MiscSettings.respawnTimer.enabled.label')"
          :label-description="t('MiscSettings.respawnTimer.enabled.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="rts.settings.enabled"
            @update:value="(val) => rt.setEnabled(val)"
          />
        </SettingsRow>
      </SettingsSection>
      <SettingsSection :title="t('MiscSettings.streamerMode.title')">
        <SettingsRow
          :label="t('MiscSettings.streamerMode.streamerMode.label')"
          :label-description="t('MiscSettings.streamerMode.streamerMode.description')"
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
            :label="t('MiscSettings.streamerMode.useAkariStyledName.label')"
            :label-description="t('MiscSettings.streamerMode.useAkariStyledName.description')"
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
          :label="t('MiscSettings.streamerMode.contentProtection.label')"
          :label-description="t('MiscSettings.streamerMode.contentProtection.description')"
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
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { RespawnTimerRenderer } from '@renderer-shared/shards/respawn-timer'
import { useRespawnTimerStore } from '@renderer-shared/shards/respawn-timer/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { useTranslation } from 'i18next-vue'
import { NCollapseTransition, NScrollbar, NSwitch } from 'naive-ui'

const { t } = useTranslation()

const a = useInstance(AppCommonRenderer)
const as = useAppCommonStore()
const rts = useRespawnTimerStore()
const rt = useInstance(RespawnTimerRenderer)

const wm = useInstance(WindowManagerRenderer)
const wms = useWindowManagerStore()
</script>
