import { createRouter, createWebHashHistory } from 'vue-router'

import ActivityView from './activity/ActivityView.vue'
import SettingsView from './settings/SettingsView.vue'
import SourcesView from './sources/SourcesView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/activity' },
    { path: '/activity', name: 'activity', component: ActivityView },
    { path: '/champion-data', name: 'sources', component: SourcesView },
    { path: '/settings', name: 'settings', component: SettingsView },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})
