import '@renderer-shared/assets/css/tailwind.css'

import '@renderer-shared/assets/css/base-styles.css'
import '@renderer-shared/assets/css/theme-system.css'
import { i18next } from '@renderer-shared/i18n'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'
import I18nextVue from 'i18next-vue'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import NaiveUIProviderApp from './NaiveUIProviderApp.vue'
import './styles.css'

const locale = navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
dayjs.extend(relativeTime)
void i18next.changeLanguage(locale)

createApp(NaiveUIProviderApp).use(createPinia()).use(I18nextVue, { i18next }).mount('#app')
