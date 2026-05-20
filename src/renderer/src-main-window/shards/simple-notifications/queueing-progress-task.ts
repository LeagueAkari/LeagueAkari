import { useBackgroundTasksStore } from '@renderer-shared/shards/background-tasks/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { formatSeconds } from '@shared/utils/format'
import { useTranslation } from 'i18next-vue'
import { watch } from 'vue'

import { SIMPLE_NOTIFICATIONS_RENDERER_ID } from './context'

export function watchQueueingProgress() {
  const leagueClientStore = useLeagueClientStore()
  const backgroundTasksStore = useBackgroundTasksStore()
  const { t } = useTranslation(undefined, {
    keyPrefix: 'simple-notifications-renderer.login-queue-task'
  })

  const taskId = `${SIMPLE_NOTIFICATIONS_RENDERER_ID}/queueing`

  watch(
    () => leagueClientStore.login.loginQueueState,
    (state) => {
      if (!state) {
        backgroundTasksStore.removeTask(taskId)
        return
      }

      if (!backgroundTasksStore.hasTask(taskId)) {
        backgroundTasksStore.createTask(taskId, {
          name: () => t('name')
        })
      }

      backgroundTasksStore.updateTask(taskId, {
        description: () =>
          t('description', {
            position: state.estimatedPositionInQueue,
            maxPosition: state.maxDisplayedPosition,
            waitTime: formatSeconds(state.approximateWaitTimeSeconds)
          }),
        progress: Math.max(1 - state.estimatedPositionInQueue / state.maxDisplayedPosition, 0)
      })
    },
    {
      immediate: true
    }
  )
}
