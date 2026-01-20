import { useInstance } from '@renderer-shared/shards'
import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { GameMapAsset } from '@shared/types/league-client/game-data'
import { readonly, shallowRef, watch } from 'vue'

let cachedData: GameMapAsset | null = null

export function useMapAssets() {
  const lcs = useLeagueClientStore()
  const lc = useInstance(LeagueClientRenderer)

  const data = shallowRef<GameMapAsset | null>(cachedData)

  watch(
    () => lcs.isConnected,
    async (isConnected) => {
      if (isConnected) {
        if (cachedData) {
          data.value = cachedData
          return
        }

        const result = (await lc.api.gameData.getMapAssets()).data
        cachedData = result
        data.value = cachedData
      } else {
        cachedData = null
        data.value = null
      }
    },
    { immediate: true }
  )

  return readonly(data)
}
