<template>
  <TabbedPage
    :icon="AiStatus"
    :title="t('Automation.title')"
    :tabs="tabs"
    route-name="automation"
    default-tab="auto-gameflow"
  />
</template>

<script setup lang="ts">
import { SettingFilled } from '@vicons/antd'
import { AiStatus, Cursor1, UserProfile } from '@vicons/carbon'
import { TextBulletListTree20Filled } from '@vicons/fluent'
import { useTranslation } from 'i18next-vue'
import { computed } from 'vue'

import TabbedPage, { TabConfig } from '@main-window/components/TabbedPage.vue'

import AutoChampConfig from './AutoChampConfig.vue'
import AutoGameflow from './AutoGameflow.vue'
import AutoMisc from './AutoMisc.vue'
import AutoSelect from './AutoSelect.vue'

const { t } = useTranslation()

const tabs = computed<TabConfig[]>(() => [
  {
    key: 'auto-gameflow',
    name: t('Automation.autoGameflow'),
    icon: TextBulletListTree20Filled,
    component: AutoGameflow
  },
  {
    key: 'auto-select',
    name: t('Automation.autoSelect'),
    icon: Cursor1,
    component: AutoSelect
  },
  {
    key: 'auto-champ-config',
    name: t('Automation.autoChampConfig'),
    icon: UserProfile,
    component: AutoChampConfig
  },
  {
    key: 'misc',
    name: t('Automation.autoMisc'),
    icon: SettingFilled,
    component: AutoMisc
  }
])
</script>
