<template>
  <div class="h-full w-full">
    <NScrollbar class="relative h-full max-w-full">
      <div class="mx-auto max-w-[800px] p-6">
        <SettingsSection :title="t('AutoChampConfig.title')">
          <SettingsRow
            :label="t('AutoChampConfig.enabled.label')"
            :label-description="t('AutoChampConfig.enabled.description')"
            :label-width="260"
          >
            <NSwitch
              @update:value="(v) => ac.setEnabled(v)"
              :value="acs.settings.enabled"
              size="small"
            ></NSwitch>
          </SettingsRow>
          <SettingsRow
            :label="t('AutoChampConfig.configure.label')"
            :label-width="260"
            align="start"
          >
            <ChampionConfig />
          </SettingsRow>
        </SettingsSection>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import SettingsRow from '@renderer-shared/components/SettingsRow.vue'
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { useInstance } from '@renderer-shared/shards'
import { AutoChampConfigRenderer } from '@renderer-shared/shards/auto-champ-config'
import { useAutoChampConfigStore } from '@renderer-shared/shards/auto-champ-config/store'
import { useTranslation } from 'i18next-vue'
import { NScrollbar, NSwitch } from 'naive-ui'

import ChampionConfig from './components/auto-champ-config/ChampionConfig.vue'

const { t } = useTranslation()

const acs = useAutoChampConfigStore()
const ac = useInstance(AutoChampConfigRenderer)
</script>
