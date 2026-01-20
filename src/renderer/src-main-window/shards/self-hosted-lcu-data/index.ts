import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { Dep, Shard } from '@shared/akari-shard'
import { Friend } from '@shared/types/league-client/chat'
import { GameQueue } from '@shared/types/league-client/game-queues'
import { isAxiosError } from 'axios'
import { useTranslation } from 'i18next-vue'
import { useMessage } from 'naive-ui'
import { watch } from 'vue'

import { useSelfHostedLcuDataStore } from './store'

/**
 * 有一些数据可以仅放在渲染进程托管
 *
 * 但是 FriendTools 里面的逻辑则暂时保持不变 (只要 works 就不要动)
 */
@Shard(SelfHostedLcuDataRenderer.id)
export class SelfHostedLcuDataRenderer {
  static id = 'self-hosted-lcu-data-renderer'

  constructor(@Dep(SetupInAppScopeRenderer) private readonly _setup: SetupInAppScopeRenderer) {
    this._setup.addSetupFn(() => this._handleFriendsUpdate())
    this._setup.addSetupFn(() => this._handleQueuesUpdate())
  }

  private _handleFriendsUpdate = () => {
    const store = useSelfHostedLcuDataStore()

    const lc = useInstance(LeagueClientRenderer)
    const log = useInstance(LoggerRenderer)

    const lcs = useLeagueClientStore()

    const message = useMessage()
    const { t } = useTranslation()

    lc.onLcuEventVue<Friend[]>('/lol-chat/v1/friends', ({ eventType, data }) => {
      if (eventType === 'Delete') {
        store.friends = []
      }

      store.friends = data
    })

    lc.onLcuEventVue<Friend>('/lol-chat/v1/friends/:id', ({ eventType, data }) => {
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
        const { data } = await lc.api.chat.getFriends()
        store.friends = data
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 503) {
          return
        }

        message.error(() => t('self-hosted-lcu-data-renderer.reloadFriendsFailed'))
        log.error(SelfHostedLcuDataRenderer.id, 'Failed to reload friends', error)
      }
    }

    watch(
      () => lcs.isConnected,
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

  private _handleQueuesUpdate = () => {
    const store = useSelfHostedLcuDataStore()

    const lc = useInstance(LeagueClientRenderer)
    const log = useInstance(LoggerRenderer)

    const lcs = useLeagueClientStore()

    lc.onLcuEventVue<GameQueue[]>('/lol-game-queues/v1/queues', ({ eventType, data }) => {
      if (eventType === 'Delete') {
        store.gameQueues = {}
      }

      store.gameQueues = data.reduce((prev, cur) => {
        prev[cur.id] = cur
        return prev
      }, {})
    })

    const reloadQueues = async () => {
      try {
        const { data } = await lc.api.gameQueues.getQueues()
        store.gameQueues = data.reduce((prev, cur) => {
          prev[cur.id] = cur
          return prev
        }, {})
      } catch (error) {
        log.error(SelfHostedLcuDataRenderer.id, 'Failed to reload queues', error)
      }
    }

    watch(
      () => lcs.isConnected,
      (isConnected) => {
        if (isConnected) {
          reloadQueues()
        } else {
          store.gameQueues = {}
        }
      },
      { immediate: true }
    )
  }
}
