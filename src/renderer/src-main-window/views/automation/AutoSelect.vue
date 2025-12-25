<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <NCard size="small">
          <template #header>
            <span class="card-header-title">{{ $t('AutoSelect.title') }}</span>
          </template>
          <AutoSelectEditor class="auto-select-editor" />
        </NCard>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { NCard, NScrollbar } from 'naive-ui'

import AutoSelectEditor from './AutoSelectEditor.vue'
</script>

<style scoped>
@import './automation-styles.css';

.auto-select-editor {
  transition: opacity 0.2s;
}
</style>
