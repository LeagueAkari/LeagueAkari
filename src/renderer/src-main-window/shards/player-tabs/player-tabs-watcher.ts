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
    [() => leagueClientStore.summoner.me?.puuid, () => sgpStore.availability.sgpServerId],
    ([mePuuid, sgpServerId]) => {
      if (mePuuid && sgpServerId) {
        playerTabs.createTab(mePuuid, sgpServerId, { setCurrent: true })
      }
    },
    { immediate: true }
  )

  // 在断开连接后删除所有页面
  watch(
    () => leagueClientStore.isDisconnected,
    (isDisconnected) => {
      if (isDisconnected) {
        playerTabsStore.closeAllTabs()
      }
    }
  )
}
