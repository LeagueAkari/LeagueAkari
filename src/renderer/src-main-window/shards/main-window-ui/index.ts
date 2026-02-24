import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { useOngoingGameStore } from '@renderer-shared/shards/ongoing-game/store'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { SetupInAppScopeRenderer } from '@renderer-shared/shards/setup-in-app-scope'
import { Dep, IAkariShardInitDispose, Shard } from '@shared/akari-shard'
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useMicaAvailability } from '@main-window/composables/useMicaAvailability'
import { router } from '@main-window/routes'

import { usePlayerTabsStore } from '../player-tabs/store'
import { useMainWindowUiStore } from './store'

@Shard(MainWindowUiRenderer.id)
export class MainWindowUiRenderer implements IAkariShardInitDispose {
  static id = 'main-window-ui-renderer'

  private readonly _urlCache = new Map<number, string>()

  constructor(
    @Dep(SettingUtilsRenderer) private readonly _setting: SettingUtilsRenderer,
    @Dep(LeagueClientRenderer) private readonly _lc: LeagueClientRenderer,
    @Dep(LoggerRenderer) private readonly _log: LoggerRenderer,
    @Dep(SetupInAppScopeRenderer) private readonly _setupInAppScope: SetupInAppScopeRenderer
  ) {}

  async onInit() {
    await this._handleSettings()
    this._setupInAppScope.addSetupFn(() => {
      this._handleSyncProfileSkinUrl()
      this._setupAutoRouteWhenGameStarts()
    })
  }

  async onDispose() {}

  private _setupAutoRouteWhenGameStarts() {
    const router = useRouter()
    const store = useOngoingGameStore()

    const shouldRoute = computed(() => {
      return store.queryStage.phase !== 'unavailable' && store.queryStage.phase !== 'lobby'
    })

    watch(
      () => shouldRoute.value,
      (value) => {
        if (value && store.settings.autoRouteWhenGameStarts) {
          router.replace({ name: 'ongoing-game' })
        }
      },
      { immediate: true }
    )
  }

  private _handleSyncProfileSkinUrl() {
    const lcs = useLeagueClientStore()
    const mui = useMainWindowUiStore()
    const pts = usePlayerTabsStore()

    const preferMica = useMicaAvailability()
    let selfBackgroundRequestId = 0
    let tabBackgroundRequestId = 0

    watch(
      [
        () => lcs.summoner.me?.puuid,
        () => lcs.summoner.profile?.backgroundSkinId,
        () => mui.frontendSettings.useProfileSkinAsBackground,
        () => preferMica.value
      ],
      async ([puuid, backgroundSkinId, enabled, preferMica]) => {
        const requestId = ++selfBackgroundRequestId

        if (!enabled || preferMica) {
          mui.backgroundSkinUrl = null
          return
        }

        const url = await this._resolveSummonerBackgroundUrl(
          puuid ?? null,
          backgroundSkinId ?? null,
          'main'
        )

        if (requestId === selfBackgroundRequestId) {
          mui.backgroundSkinUrl = url
        }
      },
      { immediate: true }
    )

    const currentTabBackgroundInfo = computed(() => {
      if (
        router.currentRoute.value.name === 'player-tabs' &&
        pts.currentTab &&
        pts.currentTab.summonerProfile
      ) {
        return {
          puuid: pts.currentTab.puuid,
          backgroundSkinId: pts.currentTab.summonerProfile.backgroundSkinId
        }
      }

      return null
    })

    watch(
      [() => currentTabBackgroundInfo.value, () => mui.frontendSettings.useProfileSkinAsBackground],
      async ([info, enabled]) => {
        const requestId = ++tabBackgroundRequestId

        if (!enabled || !info) {
          mui.tabBackgroundSkinUrl = null
          return
        }

        const url = await this._resolveSummonerBackgroundUrl(
          info.puuid,
          info.backgroundSkinId ?? null,
          'tab'
        )

        if (requestId === tabBackgroundRequestId) {
          mui.tabBackgroundSkinUrl = url
        }
      },
      { immediate: true }
    )
  }

  private async _resolveSummonerBackgroundUrl(
    puuid: string | null,
    backgroundSkinId: number | null,
    scope: 'main' | 'tab'
  ) {
    if (backgroundSkinId) {
      try {
        const url = await this._getChampionSkinUrl(backgroundSkinId)

        if (url === null) {
          this._log.warn(MainWindowUiRenderer.id, `Skin ${backgroundSkinId} not found`)
        }

        return url
      } catch (error) {
        this._log.warn(MainWindowUiRenderer.id, 'Failed to get skin details', error)
        return null
      }
    }

    if (!puuid) {
      return null
    }

    try {
      const { data } = await this._lc.api.championMastery.getPlayerChampionMasteryTopN(puuid, 1)
      const topChampionId = data.masteries[0]?.championId

      if (!topChampionId || topChampionId <= 0) {
        return null
      }

      return await this._getChampionDefaultSkinUrl(topChampionId)
    } catch (error) {
      this._log.warn(MainWindowUiRenderer.id, `Failed to get fallback mastery skin (${scope})`, error)
      return null
    }
  }

  private async _getChampionDefaultSkinUrl(championId: number) {
    const { data } = await this._lc.api.gameData.getChampDetails(championId)

    const skin = data.skins.find((s) => s.id === championId * 1000) || data.skins[0]

    if (!skin) {
      return null
    }

    this._urlCache.set(skin.id, skin.splashPath)
    return LeagueClientRenderer.url(skin.splashPath)
  }

  private async _getChampionSkinUrl(skinId: number) {
    if (this._urlCache.has(skinId)) {
      return LeagueClientRenderer.url(this._urlCache.get(skinId)!)
    }

    const championId = skinId.toString().slice(0, -3)
    const { data } = await this._lc.api.gameData.getChampDetails(Number(championId))

    for (const skin of data.skins) {
      if (skin.id === skinId) {
        this._urlCache.set(skinId, skin.splashPath)
        return LeagueClientRenderer.url(skin.splashPath)
      }

      if (skin.questSkinInfo) {
        for (const tier of skin.questSkinInfo.tiers) {
          if (tier.id === skinId) {
            this._urlCache.set(skinId, tier.splashPath)
            return LeagueClientRenderer.url(tier.splashPath)
          }
        }
      }
    }

    return null
  }

  private async _handleSettings() {
    const store = useMainWindowUiStore()

    await this._setting.savedPropVue(
      MainWindowUiRenderer.id,
      store.frontendSettings,
      'useProfileSkinAsBackground'
    )

    await this._setting.savedPropVue(
      MainWindowUiRenderer.id,
      store.frontendSettings,
      'sidebarCollapsed'
    )

    await this._setting.savedPropVue(
      MainWindowUiRenderer.id,
      store.frontendSettings,
      'showTestPage'
    )
  }

  usePreferredBackgroundImageUrl() {
    const store = useMainWindowUiStore()

    const backgroundImageUrl = computed(() => {
      if (store.frontendSettings.useProfileSkinAsBackground) {
        if (store.tabBackgroundSkinUrl) {
          return LeagueClientRenderer.url(store.tabBackgroundSkinUrl)
        }

        if (store.backgroundSkinUrl) {
          return LeagueClientRenderer.url(store.backgroundSkinUrl)
        }
      }

      return null
    })

    return backgroundImageUrl
  }
}
