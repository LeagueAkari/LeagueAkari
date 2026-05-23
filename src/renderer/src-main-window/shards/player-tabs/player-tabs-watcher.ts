import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useSgpStore } from '@renderer-shared/shards/sgp/store'
import { watch } from 'vue'

import type { PlayerTabsRenderer } from './index'
import { usePlayerTabsStore } from './store'

export function watchPlayerTabs(playerTabs: PlayerTabsRenderer) {
  const playerTabsStore = usePlayerTabsStore()
  const leagueClientStore = useLeagueClientStore()
  const sgpStore = useSgpStore()

  // 在玩家登录时立即创建一个页面
  watch(
    [() => leagueClientStore.summoner.me, () => sgpStore.availability.sgpServerId],
    ([me, sgpServerId]) => {
      if (me && sgpServerId) {
        playerTabs.createTab(me.puuid, sgpServerId)
      }
    },
    { immediate: true }
  )

  // 在断开连接后删除所有页面
  watch(
    () => leagueClientStore.connectionState,
    (s) => {
      if (s === 'disconnected') {
        playerTabsStore.closeAllTabs()
      }
    }
  )
}
