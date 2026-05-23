import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'

import { MAIN_WINDOW_UI_RENDERER_NAMESPACE, type MainWindowUiRendererContext } from './context'

export class BackgroundSkinService {
  private readonly _urlCache = new Map<number, string>()

  constructor(private readonly context: MainWindowUiRendererContext) {}

  async resolveSummonerBackgroundUrl(
    puuid: string | null,
    backgroundSkinId: number | null,
    scope: 'main' | 'tab'
  ) {
    if (backgroundSkinId) {
      try {
        const url = await this._getChampionSkinUrl(backgroundSkinId)

        if (url === null) {
          this.context.logger.warn(
            MAIN_WINDOW_UI_RENDERER_NAMESPACE,
            `Skin ${backgroundSkinId} not found`
          )
        }

        return url
      } catch (error) {
        this.context.logger.warn(
          MAIN_WINDOW_UI_RENDERER_NAMESPACE,
          'Failed to get skin details',
          error
        )
        return null
      }
    }

    if (!puuid) {
      return null
    }

    try {
      const { data } =
        await this.context.leagueClient.api.championMastery.getPlayerChampionMasteryTopN(puuid, 1)
      const topChampionId = data.masteries[0]?.championId

      if (!topChampionId || topChampionId <= 0) {
        return null
      }

      return await this._getChampionDefaultSkinUrl(topChampionId)
    } catch (error) {
      this.context.logger.warn(
        MAIN_WINDOW_UI_RENDERER_NAMESPACE,
        `Failed to get fallback mastery skin (${scope})`,
        error
      )
      return null
    }
  }

  private async _getChampionDefaultSkinUrl(championId: number) {
    const { data } = await this.context.leagueClient.api.gameData.getChampDetails(championId)

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
    const { data } = await this.context.leagueClient.api.gameData.getChampDetails(
      Number(championId)
    )

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
}
