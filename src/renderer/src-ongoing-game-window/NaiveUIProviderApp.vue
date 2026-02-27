<template>
  <NConfigProvider
    :theme-overrides="themeOverrides"
    :theme="naiveUiTheme"
    :locale="naiveUiLocale.locale"
    abstract
    inline-theme-disabled
    :date-locale="naiveUiLocale.dateLocale"
  >
    <NMessageProvider placement="bottom">
      <NNotificationProvider>
        <NDialogProvider>
          <App />
        </NDialogProvider>
      </NNotificationProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { useColorThemeAttr } from '@renderer-shared/composables/useColorThemeAttr'
import { useAppCommonStore } from '@renderer-shared/shards/app-common/store'
import {
  GlobalThemeOverrides,
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  NNotificationProvider,
  darkTheme,
  dateEnUS,
  dateZhCN,
  enUS,
  lightTheme,
  zhCN
} from 'naive-ui'
import { computed } from 'vue'

import App from './App.vue'

const as = useAppCommonStore()

const themeOverrides = computed(() => {
  if (as.colorTheme === 'dark') {
    return {
      Notification: { padding: '12px', color: '#313131fa' },
      Popover: {
        color: '#1f1f1ffa',
        fontSize: '12px'
      },
      Card: {
        colorModal: '#232329'
      },
      Message: {
        colorInfo: 'rgba(45, 45, 55, 1)',
        colorSuccess: 'rgba(45, 45, 55, 1)',
        colorWarning: 'rgba(45, 45, 55, 1)',
        colorError: 'rgba(45, 45, 55, 1)'
      },
      Menu: {
        padding: '1px'
      },
      Scrollbar: {
        width: '6px'
      }
    } as GlobalThemeOverrides
  } else {
    return {
      Popover: {
        fontSize: '12px'
      },
      Card: {
        borderColor: 'rgba(15, 23, 42, 0.10)',
        borderColorModal: 'rgba(15, 23, 42, 0.16)'
      },
      Scrollbar: {
        width: '6px'
      }
    } as GlobalThemeOverrides
  }
})

const NAIVE_UI_LOCALE = {
  'zh-CN': {
    dateLocale: dateZhCN,
    locale: zhCN
  },
  en: {
    dateLocale: dateEnUS,
    locale: enUS
  }
}

const naiveUiLocale = computed(() => {
  return NAIVE_UI_LOCALE[as.settings.locale] || NAIVE_UI_LOCALE['en']
})

const naiveUiTheme = computed(() => {
  return as.colorTheme === 'dark' ? darkTheme : lightTheme
})

useColorThemeAttr(() => as.colorTheme)
</script>

<style></style>
