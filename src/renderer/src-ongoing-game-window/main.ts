import 'reflect-metadata'

import '@renderer-shared/assets/css/tailwind.css'

import '@renderer-shared/assets/css/base-styles.css'
import '@renderer-shared/assets/css/lol-view.css'
import { i18next } from '@renderer-shared/i18n'
import { initRendererPlatformDataset } from '@renderer-shared/utils/platform-dataset'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import I18nextVue from 'i18next-vue'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import NaiveUIProviderApp from './NaiveUIProviderApp.vue'
import './assets/css/styles.css'
import { manager } from './shards'

try {
  initRendererPlatformDataset()

  dayjs.extend(relativeTime)
  dayjs.extend(duration)

  const app = createApp(NaiveUIProviderApp)
    .use(createPinia())
    .use(I18nextVue, { i18next })
    .use(manager)
  await manager.setup()
  app.mount('#app')
} catch (error) {
  console.error('League Akari 无法正确加载：', error)
  alert(
    'League Akari 无法正确加载，请查看控制台以获取更多信息 / League Akari failed to load correctly, please check the console for more information'
  )
}
