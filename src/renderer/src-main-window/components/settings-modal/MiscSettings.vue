<template>
  <NScrollbar style="height: 65vh">
    <NCard size="small">
      <template #header>
        <span class="card-header-title">{{ t('MiscSettings.respawnTimer.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('MiscSettings.respawnTimer.enabled.label')"
        :label-description="t('MiscSettings.respawnTimer.enabled.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="rts.settings.enabled"
          @update:value="(val) => rt.setEnabled(val)"
        />
      </ControlItem>
    </NCard>
    <NCard size="small" style="margin-top: 8px">
      <template #header>
        <span class="card-header-title">{{ t('MiscSettings.streamerMode.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('MiscSettings.streamerMode.streamerMode.label')"
        :label-description="t('MiscSettings.streamerMode.streamerMode.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="as.settings.streamerMode"
          @update:value="(val) => a.setStreamerMode(val)"
        />
      </ControlItem>
      <NCollapseTransition :show="as.settings.streamerMode">
        <ControlItem
          class="control-item-margin"
          :label="t('MiscSettings.streamerMode.useAkariStyledName.label')"
          :label-description="t('MiscSettings.streamerMode.useAkariStyledName.description')"
          :label-width="400"
        >
          <NSwitch
            size="small"
            :value="as.settings.streamerModeUseAkariStyledName"
            @update:value="(val) => a.setStreamerModeUseAkariStyledName(val)"
          />
        </ControlItem>
      </NCollapseTransition>
      <ControlItem
        class="control-item-margin"
        :label="t('MiscSettings.streamerMode.contentProtection.label')"
        :label-description="t('MiscSettings.streamerMode.contentProtection.description')"
        :label-width="400"
      >
        <NSwitch
          size="small"
          :value="wms.settings.contentProtection"
          @update:value="(val) => wm.setContentProtection(val)"
        />
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useInstance } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import { RespawnTimerRenderer } from '@renderer-shared/shards/respawn-timer'
import { useRespawnTimerStore } from '@renderer-shared/shards/respawn-timer/store'
import { WindowManagerRenderer } from '@renderer-shared/shards/window-manager'
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { useTranslation } from 'i18next-vue'
import { NCard, NCollapseTransition, NScrollbar, NSwitch } from 'naive-ui'

const { t } = useTranslation()

const a = useInstance(AppCommonRenderer)
const as = useAppCommonStore()
const rts = useRespawnTimerStore()
const rt = useInstance(RespawnTimerRenderer)

const wm = useInstance(WindowManagerRenderer)
const wms = useWindowManagerStore()
</script>

<style scoped>
.card-header-title.disabled {
  color: rgba(255, 255, 255, 0.35);
}
</style>
