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

const themeOverrides = computed<GlobalThemeOverrides>(() => {
  if (as.colorTheme === 'dark') {
    return {
      common: {
        popoverColor: '#383838f8'
      },
      Notification: {
        padding: '12px',
        titleFontSize: '13px',
        titleFontWeight: '700',
        descriptionFontSize: '13px',
        avatarSize: '20px',
        color: '#313131fa'
      },
      Card: {
        color: '#0000',
        paddingSmall: '4px 12px'
      },
      Message: {
        padding: '4px 8px',
        fontSize: '12px',
        iconSize: '16px',
        iconMargin: '0 4px 0 0',
        colorInfo: '#2c2c2c',
        colorSuccess: '#2c2c2c',
        colorWarning: '#2c2c2c',
        colorError: '#2c2c2c'
      },
      Popover: {
        color: '#1f1f1ffa',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        arrowColor: '#1f1f1ffa'
      },
      InternalSelectMenu: {
        color: '#383838f8'
      },
      Checkbox: {
        fontSizeSmall: '13px'
      }
    }
  } else {
    return {
      common: {
        popoverColor: '#ffffff'
      },
      Notification: {
        padding: '12px',
        titleFontSize: '13px',
        titleFontWeight: '700',
        descriptionFontSize: '13px',
        avatarSize: '20px'
      },
      Card: {
        borderColor: 'rgba(0, 0, 0, 0.1)',
        color: '#0000',
        paddingSmall: '4px 12px'
      },
      Message: {
        padding: '4px 8px',
        fontSize: '12px',
        iconSize: '16px',
        iconMargin: '0 4px 0 0',
        colorInfo: '#f5f5f5',
        colorSuccess: '#f5f5f5',
        colorWarning: '#f5f5f5',
        colorError: '#f5f5f5'
      },
      Popover: {
        borderColor: 'rgba(0, 0, 0, 0.2)'
      },
      InternalSelectMenu: {
        color: '#ffffff'
      },
      Checkbox: {
        fontSizeSmall: '13px'
      }
    }
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
