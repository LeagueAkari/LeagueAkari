import { defineComponent } from 'vue'
import { markRaw, watch } from 'vue'

import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

import { usePlayerTab } from './context'
import { useSummoner } from './data/summoner'
import { useSummonerProfile } from './data/summoner-profile'
import { useRefresh } from './utils/refresh'

export default defineComponent({
  name: '__GlobalStateTracker',
  setup() {
    const { id } = usePlayerTab()
    const { summoner } = useSummoner()
    const { profile } = useSummonerProfile()

    const pts = usePlayerTabsStore()

    const { refresh, isSomethingLoading } = useRefresh()

    watch(
      [id, isSomethingLoading],
      ([id, isSomethingLoading]) => {
        pts.updateTabData(id, { isLoading: isSomethingLoading })
      },
      { immediate: true }
    )

    watch(
      [id, summoner],
      ([id, summoner]) => {
        pts.updateTabData(id, { summoner: summoner ? markRaw(summoner) : null })
      },
      { immediate: true }
    )

    watch(
      [id, profile],
      ([id, summonerProfile]) => {
        pts.updateTabData(id, {
          summonerProfile: summonerProfile ? markRaw(summonerProfile) : null
        })
      },
      { immediate: true }
    )

    watch(
      id,
      (id) => {
        pts.updateTabData(id, { refresh: refresh })
      },
      { immediate: true }
    )
  },
  render() {}
})
