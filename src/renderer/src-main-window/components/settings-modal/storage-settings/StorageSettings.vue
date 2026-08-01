<template>
  <NTabs
    v-model:value="tabName"
    size="small"
    class="h-full"
    placement="left"
    :tabs-padding="4"
    :tab-style="{
      padding: '6px 24px 6px 12px'
    }"
    :pane-style="{
      'padding-left': '16px',
      'border-left': '1px solid var(--n-border-color)'
    }"
  >
    <NTabPane
      :tab="t('settings.storage.tabs.tagged-players')"
      name="tagged-players"
      display-directive="show"
    >
      <TaggedPlayers />
    </NTabPane>
    <NTabPane :tab="t('settings.storage.tabs.settings')" name="settings" display-directive="show">
      <SavedSettings />
    </NTabPane>
  </NTabs>
</template>

<script setup lang="ts">
import { useAkariNavigationStep } from '@renderer-shared/shards/akari-navigation'
import { useTranslation } from 'i18next-vue'
import { NTabPane, NTabs } from 'naive-ui'
import { nextTick } from 'vue'

import SavedSettings from './SavedSettings.vue'
import TaggedPlayers from './TaggedPlayers.vue'
import { STORAGE_SETTINGS_NAVIGATION_STEP_KEY, type StorageSettingsTabName } from './navigation'

const { t } = useTranslation()
const tabName = defineModel<StorageSettingsTabName>('tabName', { default: 'tagged-players' })

useAkariNavigationStep<StorageSettingsTabName>({
  key: STORAGE_SETTINGS_NAVIGATION_STEP_KEY,
  activate: async (payload) => {
    tabName.value = payload
    await nextTick()
    return undefined
  }
})
</script>
