<template>
  <NScrollbar class="h-full">
    <SettingsSection :title="t('settings.matchHistory.title')">
      <SettingsRow
        :label="t('settings.matchHistory.refreshTabsAfterGameEnds.label')"
        :label-description="t('settings.matchHistory.refreshTabsAfterGameEnds.description')"
        :label-width="400"
      >
        <NSwitch size="small" v-model:value="pts.frontendSettings.refreshTabsAfterGameEnds" />
      </SettingsRow>
      <SettingsRow
        :label="t('settings.matchHistory.loadCount.label')"
        :label-description="t('settings.matchHistory.loadCount.description')"
        :label-width="400"
      >
        <NSelect
          class="w-30!"
          size="small"
          v-model:value="pts.frontendSettings.loadCount"
          :options="pageSizeOptions"
        />
      </SettingsRow>
    </SettingsSection>
  </NScrollbar>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useTranslation } from 'i18next-vue'
import { NScrollbar, NSelect, NSwitch } from 'naive-ui'

import { usePageSizeOptions } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

const { t } = useTranslation()

const pts = usePlayerTabsStore()

const pageSizeOptions = usePageSizeOptions()
</script>
