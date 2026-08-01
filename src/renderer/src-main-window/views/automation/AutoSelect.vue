<template>
  <div class="h-full w-full">
    <NScrollbar class="relative h-full max-w-full">
      <div class="mx-auto max-w-200 p-6">
        <SettingsSection
          setting-id="automation.champ-select"
          :title="$t('automation.champSelect.title')"
        >
          <div class="p-3">
            <AutoSelectEditor class="transition-opacity duration-200" />
          </div>
        </SettingsSection>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import SettingsSection from '@main-window/settings-navigation/NavigableSettingsSection.vue'
import { NScrollbar } from 'naive-ui'

import AutoSelectEditor from './AutoSelectEditor.vue'
</script>
