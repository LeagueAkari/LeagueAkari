import { getSgpServerId } from '@shared/utils/sgp'
import { useTranslation } from 'i18next-vue'
import { watch } from 'vue'

import { useBackgroundTasksStore } from '../background-tasks/store'
import { LEAGUE_CLIENT_RENDERER_NAMESPACE } from './context'
import { useLeagueClientStore } from './store'

export function watchLeagueClientInitializationProgress() {
  const leagueClientStore = useLeagueClientStore()
  const taskStore = useBackgroundTasksStore()
  const { t } = useTranslation()

  const initTaskId = `${LEAGUE_CLIENT_RENDERER_NAMESPACE}/initialization`

  watch(
    () => leagueClientStore.initialization.progress,
    (progress) => {
      if (!progress) {
        taskStore.removeTask(initTaskId)
        return
      }

      if (!taskStore.hasTask(initTaskId)) {
        taskStore.createTask(initTaskId, {
          name: () => t('leagueClient.tasks.initialization-task.name')
        })
      }

      taskStore.updateTask(initTaskId, {
        description: () =>
          t('leagueClient.tasks.initialization-task.current', {
            finishedCount: progress.finished.length,
            allCount: progress.all.length
          }),
        progress: progress.finished.length / progress.all.length
      })
    },
    { immediate: true }
  )

  const connectTaskId = `${LEAGUE_CLIENT_RENDERER_NAMESPACE}/connection`

  watch(
    () => leagueClientStore.connectingClient,
    (client) => {
      if (!client) {
        taskStore.removeTask(connectTaskId)
        return
      }

      if (!taskStore.hasTask(connectTaskId)) {
        taskStore.createTask(connectTaskId, {
          name: () => t('leagueClient.tasks.connection-task.name'),
          description: () =>
            t('leagueClient.tasks.connection-task.target', {
              target: getSgpServerId(client.region, client.rsoPlatformId)
            })
        })
      }
    },
    { immediate: true }
  )
}
