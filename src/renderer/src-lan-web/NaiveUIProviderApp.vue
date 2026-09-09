<template>
  <NConfigProvider :theme="theme" inline-theme-disabled>
    <NMessageProvider>
      <AkariResourceProvider :value="resourceProvider">
        <App :api="api" />
      </AkariResourceProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { darkTheme, NConfigProvider, NMessageProvider } from 'naive-ui'
import { AkariResourceProvider } from '@renderer-shared/providers/akari-resource'
import { computed } from 'vue'

import { LanWebApiClient } from './api'
import App from './App.vue'
import { getLabels } from './labels'
import { createLanWebResourceProvider } from './resource-provider'

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light'
document.documentElement.dataset.themeId = prefersDark ? 'dark' : 'light'
document.documentElement.style.colorScheme = prefersDark ? 'dark' : 'light'
const theme = computed(() => (prefersDark ? darkTheme : null))
const api = new LanWebApiClient()
const { locale } = getLabels()
const resourceProvider = createLanWebResourceProvider(api, {
  locale: () => locale,
  colorMode: () => (prefersDark ? 'dark' : 'light')
})
</script>
