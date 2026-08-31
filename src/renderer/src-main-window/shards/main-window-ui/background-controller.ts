import { LeagueClientRenderer } from '@renderer-shared/shards/league-client'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useWindowManagerStore } from '@renderer-shared/shards/window-manager/store'
import { computed, nextTick, onScopeDispose, ref, watch, watchEffect } from 'vue'

import { router } from '@main-window/routes'

import { usePlayerTabsStore } from '../player-tabs/store'
import {
  MAIN_WINDOW_UI_MAIN_NAMESPACE,
  MAIN_WINDOW_UI_RENDERER_NAMESPACE,
  type MainWindowUiRendererContext
} from './context'
import { type MainWindowBackgroundImageMode, useMainWindowUiStore } from './store'

export type MainWindowBackgroundMode = MainWindowBackgroundImageMode | 'system'

export type MainWindowBackgroundMediaType = 'image' | 'video'

interface MainWindowProfileBackgroundMediaCandidate {
  type: 'profile-skin'
  mediaType: 'image'
  puuid: string | null
  backgroundSkinId: number | null
  scope: 'main' | 'tab'
}

interface MainWindowCustomBackgroundMediaCandidate {
  type: 'custom-image'
  mediaType: MainWindowBackgroundMediaType
  url: string
}

type MainWindowBackgroundMediaCandidate =
  MainWindowProfileBackgroundMediaCandidate | MainWindowCustomBackgroundMediaCandidate

export class MainWindowBackgroundController {
  private readonly _urlCache = new Map<number, string>()
  private readonly _loadedBackgroundMediaUrl = ref<string | null>(null)
  private readonly _loadedBackgroundMediaType = ref<MainWindowBackgroundMediaType | null>(null)
  private readonly _suppressSystemBackgroundMaterialPresentation = ref(false)
  private _backgroundRequestId = 0

  constructor(private readonly _context: MainWindowUiRendererContext) {}

  setup() {
    const leagueClientStore = useLeagueClientStore()
    const mainWindowUiStore = useMainWindowUiStore()
    const playerTabsStore = usePlayerTabsStore()
    const { isSystemBackgroundMaterialRequested, isSystemBackgroundMaterialActive } =
      this._useSystemBackgroundMaterialState()

    const selfBackgroundCandidate = computed<MainWindowProfileBackgroundMediaCandidate | null>(
      () => {
        const puuid = leagueClientStore.summoner.me?.puuid ?? null
        const backgroundSkinId = leagueClientStore.summoner.profile?.backgroundSkinId ?? null

        if (!puuid && !backgroundSkinId) {
          return null
        }

        return {
          type: 'profile-skin',
          mediaType: 'image',
          puuid,
          backgroundSkinId,
          scope: 'main'
        }
      }
    )

    const tabBackgroundCandidate = computed<MainWindowProfileBackgroundMediaCandidate | null>(
      () => {
        if (
          router.currentRoute.value.name === 'player-tabs' &&
          playerTabsStore.currentTab?.summonerProfile
        ) {
          return {
            type: 'profile-skin',
            mediaType: 'image',
            puuid: playerTabsStore.currentTab.puuid,
            backgroundSkinId: playerTabsStore.currentTab.summonerProfile.backgroundSkinId ?? null,
            scope: 'tab'
          }
        }

        return null
      }
    )

    const customBackgroundCandidate = computed<MainWindowCustomBackgroundMediaCandidate | null>(
      () => {
        const filePath = mainWindowUiStore.frontendSettings.customBackgroundFilePath

        if (!filePath) {
          return null
        }

        return {
          type: 'custom-image',
          mediaType: this._getCustomBackgroundMediaType(filePath),
          url: this._createLocalBackgroundMediaUrl(
            filePath,
            mainWindowUiStore.frontendSettings.customBackgroundRevision
          )
        }
      }
    )

    const backgroundMediaCandidates = computed<MainWindowBackgroundMediaCandidate[]>(() => {
      if (isSystemBackgroundMaterialRequested.value) {
        return []
      }

      if (mainWindowUiStore.frontendSettings.backgroundImageMode === 'custom-image') {
        return customBackgroundCandidate.value ? [customBackgroundCandidate.value] : []
      }

      if (mainWindowUiStore.frontendSettings.backgroundImageMode !== 'profile-skin') {
        return []
      }

      const candidates: MainWindowBackgroundMediaCandidate[] = []
      const tabCandidate = tabBackgroundCandidate.value
      const selfCandidate = selfBackgroundCandidate.value

      if (tabCandidate) {
        candidates.push(tabCandidate)
      }

      if (
        selfCandidate &&
        (!tabCandidate ||
          tabCandidate.puuid !== selfCandidate.puuid ||
          tabCandidate.backgroundSkinId !== selfCandidate.backgroundSkinId)
      ) {
        candidates.push(selfCandidate)
      }

      return candidates
    })

    watch(
      backgroundMediaCandidates,
      (candidates) => {
        void this._loadBackgroundMediaCandidates(candidates)
      },
      { immediate: true }
    )

    watchEffect(() => {
      this._toggleSystemBackgroundMaterialDocumentClass(isSystemBackgroundMaterialActive.value)
    })

    onScopeDispose(() => {
      this._backgroundRequestId++
      this._loadedBackgroundMediaUrl.value = null
      this._loadedBackgroundMediaType.value = null
      this._toggleSystemBackgroundMaterialDocumentClass(false)
    })
  }

  usePresentation() {
    const mainWindowUiStore = useMainWindowUiStore()
    const { isSystemBackgroundMaterialActive } = this._useSystemBackgroundMaterialState()
    const overlayStrength = computed(() => {
      if (!this._loadedBackgroundMediaUrl.value) {
        return 0
      }

      if (mainWindowUiStore.frontendSettings.backgroundImageMode === 'custom-image') {
        return mainWindowUiStore.frontendSettings.customBackgroundOverlayStrength
      }

      return 0.9
    })

    return {
      backgroundMediaUrl: this._loadedBackgroundMediaUrl,
      backgroundMediaType: this._loadedBackgroundMediaType,
      isSystemBackgroundMaterialActive,
      overlayStrength
    }
  }

  useMode() {
    const mainWindowUiStore = useMainWindowUiStore()
    const windowManagerStore = useWindowManagerStore()

    return computed<MainWindowBackgroundMode>(() => {
      if (windowManagerStore.settings.backgroundMaterial === 'system') {
        return 'system'
      }

      return mainWindowUiStore.frontendSettings.backgroundImageMode
    })
  }

  async setMode(mode: MainWindowBackgroundMode) {
    const mainWindowUiStore = useMainWindowUiStore()

    if (mode === 'system') {
      mainWindowUiStore.frontendSettings.backgroundImageMode = 'none'
      await this._context.windowManager.setBackgroundMaterial('system')
      return
    }

    this._suppressSystemBackgroundMaterialPresentation.value = true
    mainWindowUiStore.frontendSettings.backgroundImageMode = mode
    await nextTick()

    try {
      await this._context.windowManager.setBackgroundMaterial('none')
    } finally {
      this._suppressSystemBackgroundMaterialPresentation.value = false
    }
  }

  useCustomBackgroundSettings() {
    const mainWindowUiStore = useMainWindowUiStore()

    return {
      filePath: computed(() => mainWindowUiStore.frontendSettings.customBackgroundFilePath),
      overlayStrength: computed(
        () => mainWindowUiStore.frontendSettings.customBackgroundOverlayStrength
      )
    }
  }

  async selectCustomBackgroundFile() {
    const mainWindowUiStore = useMainWindowUiStore()
    const filePath = await this._context.ipc.call<string | null>(
      MAIN_WINDOW_UI_MAIN_NAMESPACE,
      'selectBackgroundFile',
      mainWindowUiStore.frontendSettings.customBackgroundFilePath || undefined
    )

    if (!filePath) {
      return false
    }

    mainWindowUiStore.frontendSettings.customBackgroundFilePath = filePath
    mainWindowUiStore.frontendSettings.customBackgroundRevision = Date.now()
    return true
  }

  setCustomBackgroundOverlayStrength(strength: number) {
    const mainWindowUiStore = useMainWindowUiStore()
    mainWindowUiStore.frontendSettings.customBackgroundOverlayStrength = Math.min(
      1,
      Math.max(0, strength)
    )
  }

  private _useSystemBackgroundMaterialState() {
    const windowManagerStore = useWindowManagerStore()
    const isSystemBackgroundMaterialRequested = computed(
      () => windowManagerStore.settings.backgroundMaterial === 'system'
    )
    const isSystemBackgroundMaterialActive = computed(
      () =>
        windowManagerStore.supportsSystemBackgroundMaterial &&
        windowManagerStore.systemBackgroundMaterialActive &&
        !this._suppressSystemBackgroundMaterialPresentation.value &&
        isSystemBackgroundMaterialRequested.value
    )

    return {
      isSystemBackgroundMaterialRequested,
      isSystemBackgroundMaterialActive
    }
  }

  private _toggleSystemBackgroundMaterialDocumentClass(enabled: boolean) {
    document.documentElement.classList.toggle('system-background-material-enabled', enabled)
    document.body.classList.toggle('system-background-material-enabled', enabled)
  }

  reportBackgroundMediaLoadFailure(url: string) {
    if (this._loadedBackgroundMediaUrl.value !== url) {
      return
    }

    this._backgroundRequestId++
    this._loadedBackgroundMediaUrl.value = null
    this._loadedBackgroundMediaType.value = null
    this._context.logger.warn(
      MAIN_WINDOW_UI_RENDERER_NAMESPACE,
      'Failed to render background media'
    )
  }

  private async _loadBackgroundMediaCandidates(candidates: MainWindowBackgroundMediaCandidate[]) {
    const requestId = ++this._backgroundRequestId
    this._loadedBackgroundMediaUrl.value = null
    this._loadedBackgroundMediaType.value = null

    if (candidates.length === 0) {
      return
    }

    let url: string | null = null
    let mediaType: MainWindowBackgroundMediaType = 'image'

    for (const candidate of candidates) {
      mediaType = candidate.mediaType
      url =
        candidate.type === 'custom-image'
          ? candidate.url
          : await this._resolveSummonerBackgroundUrl(
              candidate.puuid,
              candidate.backgroundSkinId,
              candidate.scope
            )

      if (requestId !== this._backgroundRequestId) {
        return
      }

      if (url) {
        break
      }
    }

    if (!url) {
      return
    }

    try {
      await this._prepareBackgroundMedia(url, mediaType)
    } catch (error) {
      if (requestId !== this._backgroundRequestId) {
        return
      }

      this._context.logger.warn(
        MAIN_WINDOW_UI_RENDERER_NAMESPACE,
        'Failed to load background media',
        error
      )
      return
    }

    if (requestId !== this._backgroundRequestId) {
      return
    }

    this._loadedBackgroundMediaUrl.value = url
    this._loadedBackgroundMediaType.value = mediaType
  }

  private _prepareBackgroundMedia(url: string, mediaType: MainWindowBackgroundMediaType) {
    if (mediaType === 'video') {
      return this._prepareBackgroundVideo(url)
    }

    const image = new Image()
    image.decoding = 'async'
    image.src = url
    return image.decode()
  }

  private _prepareBackgroundVideo(url: string) {
    return new Promise<void>((resolve, reject) => {
      const video = document.createElement('video')

      const cleanup = () => {
        video.removeEventListener('loadeddata', handleLoaded)
        video.removeEventListener('error', handleError)
      }
      const handleLoaded = () => {
        cleanup()
        resolve()
      }
      const handleError = () => {
        cleanup()
        reject(video.error || new Error('Failed to decode background video'))
      }

      video.preload = 'auto'
      video.muted = true
      video.playsInline = true
      video.addEventListener('loadeddata', handleLoaded)
      video.addEventListener('error', handleError)
      video.src = url
      video.load()
    })
  }

  private _getCustomBackgroundMediaType(filePath: string): MainWindowBackgroundMediaType {
    const extension = filePath.slice(filePath.lastIndexOf('.') + 1).toLowerCase()
    return ['mp4', 'webm', 'mov', 'm4v', 'ogv'].includes(extension) ? 'video' : 'image'
  }

  private _createLocalBackgroundMediaUrl(filePath: string, revision: number) {
    const encodedFilePath = encodeURIComponent(filePath).replace(/[!'()*]/g, (character) => {
      return `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    })

    return `akari://local/${encodedFilePath}?v=${revision}`
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
          this._context.logger.warn(
            MAIN_WINDOW_UI_RENDERER_NAMESPACE,
            `Skin ${backgroundSkinId} not found`
          )
        }

        return url
      } catch (error) {
        this._context.logger.warn(
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
        await this._context.leagueClient.api.championMastery.getPlayerChampionMasteryTopN(puuid, 1)
      const topChampionId = data.masteries[0]?.championId

      if (!topChampionId || topChampionId <= 0) {
        return null
      }

      return await this._getChampionDefaultSkinUrl(topChampionId)
    } catch (error) {
      this._context.logger.warn(
        MAIN_WINDOW_UI_RENDERER_NAMESPACE,
        `Failed to get fallback mastery skin (${scope})`,
        error
      )
      return null
    }
  }

  private async _getChampionDefaultSkinUrl(championId: number) {
    const { data } = await this._context.leagueClient.api.gameData.getChampDetails(championId)
    const skin = data.skins.find((item) => item.id === championId * 1000) || data.skins[0]

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
    const { data } = await this._context.leagueClient.api.gameData.getChampDetails(
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
