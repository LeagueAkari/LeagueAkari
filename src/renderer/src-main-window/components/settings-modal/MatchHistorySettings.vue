<template>
  <NScrollbar style="height: 65vh">
    <NCard size="small">
      <template #header>
        <span class="card-header-title">{{ t('MatchHistorySettings.title') }}</span>
      </template>
      <ControlItem
        class="control-item-margin"
        :label="t('MatchHistorySettings.refreshTabsAfterGameEnds.label')"
        :label-description="t('MatchHistorySettings.refreshTabsAfterGameEnds.description')"
        :label-width="400"
      >
        <NSwitch size="small" v-model:value="pts.frontendSettings.refreshTabsAfterGameEnds" />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('MatchHistorySettings.loadCount.label')"
        :label-description="t('MatchHistorySettings.loadCount.description')"
        :label-width="400"
      >
        <NSelect
          style="width: 120px"
          size="small"
          v-model:value="pts.frontendSettings.loadCount"
          :options="pageSizeOptions"
        />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('MatchHistorySettings.showJunglePathing.label')"
        :label-description="t('MatchHistorySettings.showJunglePathing.description')"
        :label-width="400"
      >
        <NSwitch size="small" v-model:value="pts.frontendSettings.showJunglePathing" />
      </ControlItem>
      <ControlItem
        class="control-item-margin"
        :label="t('MatchHistorySettings.junglePathingFtue.label')"
        :label-description="t('MatchHistorySettings.junglePathingFtue.description')"
        :label-width="400"
      >
        <NButton size="small" @click="resetJunglePathingFtue">
          {{ t('MatchHistorySettings.junglePathingFtue.button') }}
        </NButton>
      </ControlItem>
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useTranslation } from 'i18next-vue'
import { NButton, NCard, NScrollbar, NSelect, NSwitch, useMessage } from 'naive-ui'

import { FTUE_KEY_JUNGLE_PATHING_MATCH_HISTORY_DETAILS } from '@main-window/shards/ftue/keys'
import { useFtueStore } from '@main-window/shards/ftue/store'
import { usePageSizeOptions } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

const { t } = useTranslation()

const ftue = useFtueStore()
const pts = usePlayerTabsStore()
const message = useMessage()

const pageSizeOptions = usePageSizeOptions()

const resetJunglePathingFtue = () => {
  ftue.reset(FTUE_KEY_JUNGLE_PATHING_MATCH_HISTORY_DETAILS)
  message.success(() => t('MatchHistorySettings.junglePathingFtue.resetDone'))
}
</script>

<style scoped>
[data-theme='dark'] {
  .sgp-server-hint-ok {
    color: #63e2b7;
  }

  .sgp-server-hint-not-ok {
    color: rgb(230, 114, 41);
  }
}

[data-theme='light'] {
  .sgp-server-hint-ok {
    color: rgb(24, 129, 94);
  }

  .sgp-server-hint-not-ok {
    color: rgb(166, 116, 58);
  }
}
</style>
