import { createRouter, createWebHashHistory } from 'vue-router'

import Automation from '@main-window/views/automation/Automation.vue'
import OngoingGame from '@main-window/views/ongoing-game/OngoingGame.vue'
import PlayerTabs from '@main-window/views/player-tabs/PlayerTabs.vue'
import Test from '@main-window/views/test/Test.vue'
import Toolkit from '@main-window/views/toolkit/Toolkit.vue'

// console.log(import.meta.env.BASE_URL)
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'root',
      redirect: { name: 'player-tabs' }
    },
    {
      name: 'player-tabs',
      path: '/player-tabs/:sgpServerId?/:puuid?',
      component: PlayerTabs
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
