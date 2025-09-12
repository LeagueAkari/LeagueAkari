<template>
  <div class="single-root">
    <NScrollbar class="outer-wrapper">
      <div class="inner-wrapper">
        <NCard size="small">
          <template #header>
            <span class="card-header-title">[自动英雄选择与禁用]</span>
          </template>
          <AutoSelectEditor class="auto-select-editor" />
        </NCard>
      </div>
    </NScrollbar>
  </div>
</template>

<script setup lang="ts">
import { NCard, NScrollbar } from 'naive-ui'

import AutoSelectEditor from './auto-select-editor/AutoSelectEditor.vue'
</script>

<style scoped>
@import './automation-styles.css';

.auto-select-editor {
  margin-top: 8px;
  transition: opacity 0.2s;
}
</style>
