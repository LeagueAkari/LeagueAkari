import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { Friend } from '@shared/types/league-client/chat'
import { useTranslation } from 'i18next-vue'
import { useMessage } from 'naive-ui'
import { computed, readonly, shallowRef } from 'vue'

const FRIEND_PRIORITY = {
  chat: 2,
  dnd: 3,
  away: 1,
  offline: 0
}

export function useSearchPaneFriends() {
  const { t } = useTranslation()
  const message = useMessage()
  const lc = useInstance(LeagueClientRenderer)

  const friends = shallowRef<Friend[]>([])

  lc.onLcuEventVue<Friend[]>('/lol-chat/v1/friends', ({ eventType, data }) => {
    if (eventType === 'Update') {
      friends.value = data
    } else if (eventType === 'Delete') {
      friends.value = []
    }
  })

  const updateFriends = async () => {
    try {
      const { data } = await lc.api.chat.getFriends()
      friends.value = data
    } catch (error) {
      message.error(() => t('SearchPane.getFriendsFailed'))
    }
  }

  const sortedFriends = computed(() => {
    return friends.value.toSorted((a, b) => {
      const av = FRIEND_PRIORITY[a.availability] || 0
      const bv = FRIEND_PRIORITY[b.availability] || 0

      return bv - av
    })
  })

  return {
    friends: readonly(friends),
    sortedFriends,
    updateFriends
  }
}
