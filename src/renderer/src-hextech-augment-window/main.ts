import 'reflect-metadata'

import '@renderer-shared/assets/css/tailwind.css'

import '@renderer-shared/assets/css/theme-system.css'
import { i18next } from '@renderer-shared/i18n'
import { createManager } from '@renderer-shared/shards'
import { AppCommonRenderer } from '@renderer-shared/shards/app-common'
import { HextechAugmentRenderer } from '@renderer-shared/shards/hextech-augment'
import { AkariIpcRenderer } from '@renderer-shared/shards/ipc'
import { PiniaMobxUtilsRenderer } from '@renderer-shared/shards/pinia-mobx-utils'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import I18nextVue from 'i18next-vue'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'

const manager = createManager()
manager.use(AkariIpcRenderer)
manager.use(PiniaMobxUtilsRenderer)
manager.use(SettingUtilsRenderer)
manager.use(SetupInAppScopeRenderer)
manager.use(AppCommonRenderer)
manager.use(HextechAugmentRenderer)
const app = createApp(App).use(createPinia()).use(I18nextVue, { i18next }).use(manager)
await manager.setup()
app.mount('#app')
