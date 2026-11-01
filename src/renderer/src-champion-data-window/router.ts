import { createRouter, createWebHashHistory } from 'vue-router'

import SettingsView from './settings/SettingsView.vue'
import SourcesView from './sources/SourcesView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'sources', component: SourcesView },
    { path: '/settings', name: 'settings', component: SettingsView },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})
