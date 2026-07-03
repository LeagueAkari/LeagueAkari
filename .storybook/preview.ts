import '@renderer-shared/assets/css/tailwind.css'

import '@renderer-shared/assets/css/base-styles.css'
import '@renderer-shared/assets/css/github-markdown.css'
import '@renderer-shared/assets/css/lol-view.css'
import '@renderer-shared/assets/css/theme-system.css'
import { i18next } from '@renderer-shared/i18n'
import { GameResourceProvider } from '@renderer-shared/providers/game-resource'
import { createStorybookGameResourceProvider } from '@renderer-shared/providers/game-resource/storybook'
import {
  getNaiveUiLocale,
  getNaiveUiTheme,
  getNaiveUiThemeOverrides
} from '@renderer-shared/theme/naive-ui'
import { type AppThemeId, getThemeColorTheme } from '@shared/types/app-theme'
import { type Preview, setup } from '@storybook/vue3-vite'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import I18nextVue from 'i18next-vue'
import { NConfigProvider, NDialogProvider, NMessageProvider, NNotificationProvider } from 'naive-ui'
import { createPinia } from 'pinia'
import { computed, watchEffect } from 'vue'

import './preview.css'

dayjs.extend(relativeTime)
dayjs.extend(duration)

const THEME_IDS: AppThemeId[] = [
  'light',
  'dark',
  'graphite',
  'cyber',
  'sakura',
  'butter',
  'mint',
  'aurora'
]

setup((app) => {
  app.use(createPinia())
  app.use(I18nextVue, { i18next })
})

const preview: Preview = {
  globalTypes: {
    themeId: {
      description: 'League Akari theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: THEME_IDS.map((value) => ({ value, title: value }))
      }
    },
    locale: {
      description: 'Locale',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'zh-CN', title: 'zh-CN' },
          { value: 'en', title: 'en' }
        ]
      }
    }
  },
  initialGlobals: {
    themeId: 'dark',
    locale: 'zh-CN'
  },
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    (story, context) => ({
      components: {
        Story: story(),
        GameResourceProvider,
        NConfigProvider,
        NDialogProvider,
        NMessageProvider,
        NNotificationProvider
      },
      setup() {
        const themeId = computed(() => {
          const value = context.globals.themeId
          return THEME_IDS.includes(value) ? value : 'dark'
        })
        const colorTheme = computed(() => getThemeColorTheme(themeId.value))
        const locale = computed(() => (context.globals.locale === 'zh-CN' ? 'zh-CN' : 'en'))
        const naiveUiTheme = computed(() => getNaiveUiTheme(colorTheme.value))
        const naiveUiThemeOverrides = computed(() => getNaiveUiThemeOverrides(themeId.value))
        const naiveUiLocale = computed(() => getNaiveUiLocale(locale.value))
        const gameResourceProvider = createStorybookGameResourceProvider({
          locale,
          colorMode: colorTheme
        })

        watchEffect(() => {
          document.documentElement.dataset.theme = colorTheme.value
          document.documentElement.dataset.themeId = themeId.value
          document.documentElement.style.colorScheme = colorTheme.value
          void i18next.changeLanguage(locale.value)
        })

        return {
          naiveUiLocale,
          naiveUiTheme,
          naiveUiThemeOverrides,
          gameResourceProvider
        }
      },
      template: `
        <NConfigProvider
          :theme-overrides="naiveUiThemeOverrides"
          :theme="naiveUiTheme"
          :locale="naiveUiLocale.locale"
          :date-locale="naiveUiLocale.dateLocale"
          abstract
          inline-theme-disabled
        >
          <NMessageProvider placement="top-right">
            <NNotificationProvider placement="bottom-right">
              <NDialogProvider>
                <div class="akari-story-shell">
                  <div class="akari-story-panel">
                    <GameResourceProvider :value="gameResourceProvider">
                      <Story />
                    </GameResourceProvider>
                  </div>
                </div>
              </NDialogProvider>
            </NNotificationProvider>
          </NMessageProvider>
        </NConfigProvider>
      `
    })
  ]
}

export default preview
