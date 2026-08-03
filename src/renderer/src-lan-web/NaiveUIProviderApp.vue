<template>
  <NConfigProvider :theme="theme" inline-theme-disabled>
    <NMessageProvider><App :api="api" /></NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { darkTheme, NConfigProvider, NMessageProvider } from 'naive-ui'
import { computed } from 'vue'

import { LanWebApiClient } from './api'
import App from './App.vue'

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light'
document.documentElement.dataset.themeId = prefersDark ? 'dark' : 'light'
document.documentElement.style.colorScheme = prefersDark ? 'dark' : 'light'
const theme = computed(() => (prefersDark ? darkTheme : null))
const api = new LanWebApiClient()
</script>
