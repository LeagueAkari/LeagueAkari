import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { computed, watch } from 'vue'

import { useMicaAvailability } from '@main-window/composables/useMicaAvailability'
import { router } from '@main-window/routes'

import { usePlayerTabsStore } from '../player-tabs/store'
import type { BackgroundSkinService } from './background-skin-service'
import { useMainWindowUiStore } from './store'

export function watchProfileSkinBackground(backgroundSkinService: BackgroundSkinService) {
  const leagueClientStore = useLeagueClientStore()
  const mainWindowUiStore = useMainWindowUiStore()
  const playerTabsStore = usePlayerTabsStore()

  const preferMica = useMicaAvailability()
  let selfBackgroundRequestId = 0
  let tabBackgroundRequestId = 0

  watch(
    [
      () => leagueClientStore.summoner.me?.puuid,
      () => leagueClientStore.summoner.profile?.backgroundSkinId,
      () => mainWindowUiStore.frontendSettings.useProfileSkinAsBackground,
      () => preferMica.value
    ],
    async ([puuid, backgroundSkinId, enabled, preferMica]) => {
      const requestId = ++selfBackgroundRequestId

      if (!enabled || preferMica) {
        mainWindowUiStore.backgroundSkinUrl = null
        return
      }

      const url = await backgroundSkinService.resolveSummonerBackgroundUrl(
        puuid ?? null,
        backgroundSkinId ?? null,
        'main'
      )

      if (requestId === selfBackgroundRequestId) {
        mainWindowUiStore.backgroundSkinUrl = url
      }
    },
    { immediate: true }
  )

  const currentTabBackgroundInfo = computed(() => {
    if (
      router.currentRoute.value.name === 'player-tabs' &&
      playerTabsStore.currentTab &&
      playerTabsStore.currentTab.summonerProfile
    ) {
      return {
        puuid: playerTabsStore.currentTab.puuid,
        backgroundSkinId: playerTabsStore.currentTab.summonerProfile.backgroundSkinId
      }
    }

    return null
  })

  watch(
    [
      () => currentTabBackgroundInfo.value,
      () => mainWindowUiStore.frontendSettings.useProfileSkinAsBackground
    ],
    async ([info, enabled]) => {
      const requestId = ++tabBackgroundRequestId

      if (!enabled || !info) {
        mainWindowUiStore.tabBackgroundSkinUrl = null
        return
      }

      const url = await backgroundSkinService.resolveSummonerBackgroundUrl(
        info.puuid,
        info.backgroundSkinId ?? null,
        'tab'
      )

      if (requestId === tabBackgroundRequestId) {
        mainWindowUiStore.tabBackgroundSkinUrl = url
      }
    },
    { immediate: true }
  )
}
