import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { Friend } from '@shared/types/league-client/chat'
import { isAxiosError } from 'axios'
import { useTranslation } from 'i18next-vue'
import { useMessage } from 'naive-ui'
import { watch } from 'vue'

import { SELF_HOSTED_LCU_DATA_RENDERER_NAMESPACE } from './context'
import { useSelfHostedLcuDataStore } from './store'

export function watchFriendsUpdate() {
  const store = useSelfHostedLcuDataStore()

  const leagueClient = useInstance(LeagueClientRenderer)
  const logger = useInstance(LoggerRenderer)

  const leagueClientStore = useLeagueClientStore()

  const message = useMessage()
  const { t } = useTranslation()

  leagueClient.onLcuEventVue<Friend[]>('/lol-chat/v1/friends', ({ eventType, data }) => {
    if (eventType === 'Delete') {
      store.friends = []
    }

    store.friends = data
  })

  leagueClient.onLcuEventVue<Friend>('/lol-chat/v1/friends/:id', ({ eventType, data }) => {
    if (eventType === 'Delete') {
      store.friends = store.friends.filter((friend) => friend.id !== data.id)
    } else {
      store.friends = store.friends.map((friend) => {
        return friend.id === data.id ? data : friend
      })
    }
  })

  const reloadFriends = async () => {
    try {
      const { data } = await leagueClient.api.chat.getFriends()
      store.friends = data
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 503) {
        return
      }

      message.error(() => t('selfHostedLcuData.reloadFriendsFailed'))
      logger.error(SELF_HOSTED_LCU_DATA_RENDERER_NAMESPACE, 'Failed to reload friends', error)
    }
  }

  watch(
    () => leagueClientStore.isConnected,
    (isConnected) => {
      if (isConnected) {
        reloadFriends()
      } else {
        store.friends = []
      }
    },
    { immediate: true }
  )
}
