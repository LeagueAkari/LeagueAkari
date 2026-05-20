import LeagueAkariSpan from '@renderer-shared/components/LeagueAkariSpan.vue'
import { useKeyboardCombo } from '@renderer-shared/composables/useKeyboardCombo'
import { useMessage } from 'naive-ui'

import { useSimpleNotificationsStore } from './store'

export function watchSpecialKeyboardCombo() {
  const message = useMessage()
  const simpleNotificationsStore = useSimpleNotificationsStore()

  useKeyboardCombo('AKARI', {
    onFinish: () => {
      if (simpleNotificationsStore.showDeclarationModal) {
        simpleNotificationsStore.showDeclarationModal = false
      } else {
        message.success(() => <LeagueAkariSpan bold />)
      }
    },
    requireSameEl: true,
    caseSensitive: false,
    timeout: 250
  })
}
