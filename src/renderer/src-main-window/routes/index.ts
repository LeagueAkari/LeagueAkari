import { createRouter, createWebHashHistory } from 'vue-router'

import Automation from '@main-window/views/automation/Automation.vue'
import MatchHistoryTabs from '@main-window/views/match-history/MatchHistoryTabs.vue'
import OngoingGame from '@main-window/views/ongoing-game/OngoingGame.vue'
import Test from '@main-window/views/test/Test.vue'
import Toolkit from '@main-window/views/toolkit/Toolkit.vue'

// console.log(import.meta.env.BASE_URL)
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'root',
      redirect: { name: 'match-history' }
    },
    {
      name: 'match-history',
      path: '/match-history/:sgpServerId?/:puuid?',
      component: MatchHistoryTabs
    },
    {
      name: 'ongoing-game',
      path: '/ongoing-game',
      component: OngoingGame
    },
    {
      name: 'toolkit',
      path: '/toolkit/:section?',
      component: Toolkit
    },
    {
      name: 'automation',
      path: '/automation/:section?',
      component: Automation
    },
    {
      name: 'test',
      path: '/test',
      component: Test
    }
  ]
})

export { router }
