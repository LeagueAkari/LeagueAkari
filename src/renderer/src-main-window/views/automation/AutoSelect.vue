<template>
  <div class="h-full w-full">
    <NScrollbar class="relative h-full max-w-full">
      <div class="mx-auto max-w-[800px] p-6">
        <SettingsSection :title="$t('AutoSelect.title')">
          <div class="p-3">
            <AutoSelectEditor class="transition-opacity duration-200" />
          </div>
        </SettingsSection>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import SettingsSection from '@renderer-shared/components/SettingsSection.vue'
import { NScrollbar } from 'naive-ui'

import AutoSelectEditor from './AutoSelectEditor.vue'
</script>
