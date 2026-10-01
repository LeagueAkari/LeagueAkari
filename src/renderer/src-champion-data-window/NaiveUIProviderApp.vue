<template>
  <NConfigProvider
    :theme-overrides="themeOverrides"
    :theme="naiveUiTheme"
    :locale="naiveUiLocale.locale"
    :date-locale="naiveUiLocale.dateLocale"
    abstract
    inline-theme-disabled
  >
    <NMessageProvider placement="bottom">
      <NNotificationProvider>
        <NDialogProvider>
          <AkariResourceProvider :value="akariResourceProvider">
            <App />
          </AkariResourceProvider>
        </NDialogProvider>
      </NNotificationProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { useColorThemeAttr } from '@renderer-shared/composables/useColorThemeAttr'
import {
  AkariResourceProvider,
  createAkariResourceProvider
} from '@renderer-shared/providers/akari-resource'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import {
  getNaiveUiLocale,
  getNaiveUiTheme,
  getNaiveUiThemeOverrides
} from '@renderer-shared/theme/naive-ui'
import { NConfigProvider, NDialogProvider, NMessageProvider, NNotificationProvider } from 'naive-ui'
import { computed } from 'vue'

import App from './App.vue'

const as = useAppCommonStore()
const akariResourceProvider = createAkariResourceProvider()

const themeOverrides = computed(() => {
  return getNaiveUiThemeOverrides(as.themeId, true)
})

const naiveUiLocale = computed(() => {
  return getNaiveUiLocale(as.settings.locale)
})

const naiveUiTheme = computed(() => {
  return getNaiveUiTheme(as.colorTheme)
})

useColorThemeAttr(
  () => as.colorTheme,
  () => as.themeId
)
</script>

<style></style>
