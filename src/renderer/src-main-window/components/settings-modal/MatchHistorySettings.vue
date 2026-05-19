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
    </NCard>
  </NScrollbar>
</template>

<script setup lang="ts">
import ControlItem from '@renderer-shared/components/ControlItem.vue'
import { useTranslation } from 'i18next-vue'
import { NCard, NScrollbar, NSelect, NSwitch } from 'naive-ui'

import { usePageSizeOptions } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

const { t } = useTranslation()

const pts = usePlayerTabsStore()

const pageSizeOptions = usePageSizeOptions()
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
