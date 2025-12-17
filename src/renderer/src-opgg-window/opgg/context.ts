import { OpggRenderer } from '@opgg-window/shards/opgg'
import { useOpggStore } from '@opgg-window/shards/opgg/store'
import { useInstance } from '@renderer-shared/shards'
import {
  ModeType,
  OpggChampionBuildResponse,
  OpggChampionsResponse,
  PositionType,
  RegionType,
  TierType
} from '@shared/types/opgg'
import { QueueKeeper, isAbortError } from '@shared/utils/queue-keeper'
import { useMessage } from 'naive-ui'
import { InjectionKey, Ref, inject, provide, ref, shallowRef, watch } from 'vue'

export const OpggContextKey: InjectionKey<OpggContext> = Symbol('OpggContext')

export type OpggContext = {
  currentTab: Readonly<Ref<'champions' | 'champion'>>

  setTab: (tab: 'champions' | 'champion', championId?: number) => void

  flashPosition: Readonly<Ref<'auto' | 'd' | 'f'>>

  championId: Readonly<Ref<number | null>>
  mode: Readonly<Ref<ModeType>>
  position: Readonly<Ref<PositionType>>
  region: Readonly<Ref<RegionType>>
  tier: Readonly<Ref<TierType>>
  version: Readonly<Ref<string | null>>
  queueKeeper: Readonly<QueueKeeper>

  versions: Readonly<Ref<string[]>>
  champions: Readonly<Ref<OpggChampionsResponse | null>>
  champion: Readonly<Ref<OpggChampionBuildResponse | null>>

  isLoading: Readonly<Ref<boolean>>

  setFlashPosition: (flashPosition: 'auto' | 'd' | 'f') => void

  changeMode: (mode: ModeType) => Promise<void>
  changePosition: (position: PositionType) => Promise<void>
  changeRegion: (region: RegionType) => Promise<void>
  changeTier: (tier: TierType) => Promise<void>
  changeVersion: (version: string) => Promise<void>
  changeChampion: (championId: number) => Promise<void>

  refresh: () => Promise<void>

  cancel: () => void
}

export function provideOpgg() {
  const og = useInstance(OpggRenderer)
  const ogs = useOpggStore()
  const message = useMessage()

  const currentTab = ref<'champions' | 'champion'>('champions')

  const flashPosition = ref<'auto' | 'd' | 'f'>(ogs.savedPreferences.flashPosition)

  const setFlashPosition = (flashPosition0: 'auto' | 'd' | 'f') => {
    flashPosition.value = flashPosition0
  }

  const mode = ref<ModeType>(ogs.savedPreferences.mode)
  const position = ref<PositionType>(ogs.savedPreferences.position)
  const region = ref<RegionType>(ogs.savedPreferences.region)
  const tier = ref<TierType>(ogs.savedPreferences.tier)
  const version = ref<string | null>(null)

  const championId = ref<number | null>(null)
  const versions = shallowRef<string[]>([])
  const champions = shallowRef<OpggChampionsResponse | null>(null)
  const champion = shallowRef<OpggChampionBuildResponse | null>(null)

  const queueKeeper = new QueueKeeper([{ id: 'default' }])

  const isLoading = ref(false)

  const ensureVersionFor = async (
    region0: RegionType,
    mode0: ModeType,
    opts: {
      reload: boolean
      preferredVersion?: string | null
    }
  ): Promise<string | null> => {
    const preferred = opts.preferredVersion ?? version.value

    if (opts.reload || !version.value || versions.value.length === 0) {
      const {
        data: { data: versions0 }
      } = await queueKeeper.add(
        'default',
        'opgg-load-versions',
        ({ signal }) => og.api.getVersions(region0, mode0, { signal }),
        { tags: ['opgg-group'] }
      )

      versions.value = versions0
    }

    if (versions.value.length === 0) {
      return null
    }

    let nextVersion =
      preferred && versions.value.includes(preferred) ? preferred : versions.value[0]

    if (!versions.value.includes(nextVersion)) {
      nextVersion = versions.value[0]
    }

    return nextVersion
  }

  const changeMode = async (mode0: ModeType) => {
    queueKeeper.cancelAll()
    isLoading.value = true

    try {
      const region0 = region.value
      const tier0 = tier.value
      const newPosition: PositionType = mode0 === 'ranked' ? 'top' : 'none'
      const nextVersion = await ensureVersionFor(region0, mode0, {
        reload: true,
        preferredVersion: version.value
      })

      if (!nextVersion) {
        return
      }

      const { data: championsData } = await queueKeeper.add(
        'default',
        'opgg-load-champions',
        ({ signal }) =>
          og.api.getChampions(region0, mode0, {
            tier: mode0 === 'arena' ? undefined : tier0,
            version: nextVersion,
            signal
          }),
        { tags: ['opgg-group'] }
      )

      let championData: OpggChampionBuildResponse | null = null

      if (championId.value) {
        const { data } = await queueKeeper.add(
          'default',
          'opgg-load-champion',
          ({ signal }) =>
            og.api.getChampion(region0, mode0, championId.value!, newPosition, {
              tier: mode0 === 'arena' ? undefined : tier0,
              version: nextVersion,
              signal
            }),
          { tags: ['opgg-group'] }
        )

        championData = data
      }

      mode.value = mode0
      position.value = newPosition
      version.value = nextVersion
      champions.value = championsData
      champion.value = championData
    } catch (error) {
      if (isAbortError(error)) {
        return
      }

      const err = error as Error
      message.error(err.message || String(error))
    } finally {
      isLoading.value = false
    }
  }

  const changePosition = async (position0: PositionType) => {
    // 目前，只有 ranked 模式可以改 position，这是写在 url 里面的硬性限制
    if (mode.value !== 'ranked') {
      return
    }

    queueKeeper.cancelAll()
    isLoading.value = true

    try {
      const region0 = region.value
      const mode0 = mode.value
      const tier0 = tier.value
      const version0 = version.value

      let championData: OpggChampionBuildResponse | null = null

      if (championId.value) {
        const { data } = await queueKeeper.add(
          'default',
          'opgg-load-champion',
          ({ signal }) =>
            og.api.getChampion(region0, mode0, championId.value!, position0, {
              tier: mode0 === 'arena' ? undefined : tier0,
              version: version0 ?? undefined,
              signal
            }),
          { tags: ['opgg-group'] }
        )

        championData = data
      }

      // champions 列表与 position 无关，不需要刷新；仅提交 position + champion
      position.value = position0
      champion.value = championData
    } catch (error) {
      if (isAbortError(error)) {
        return
      }

      const err = error as Error
      message.error(err.message || String(error))
    } finally {
      isLoading.value = false
    }
  }

  const changeRegion = async (region0: RegionType) => {
    queueKeeper.cancelAll()
    isLoading.value = true

    try {
      const mode0 = mode.value
      const tier0 = tier.value

      let version0 = version.value

      if (!version0) {
        version0 = await ensureVersionFor(region0, mode0, {
          reload: false,
          preferredVersion: null
        })

        if (!version0) {
          return
        }
      }

      const { data: championsData } = await queueKeeper.add(
        'default',
        'opgg-load-champions',
        ({ signal }) =>
          og.api.getChampions(region0, mode0, {
            tier: mode0 === 'arena' ? undefined : tier0,
            version: version0 ?? undefined,
            signal
          }),
        { tags: ['opgg-group'] }
      )

      let championData: OpggChampionBuildResponse | null = null

      if (championId.value) {
        const { data } = await queueKeeper.add(
          'default',
          'opgg-load-champion',
          ({ signal }) =>
            og.api.getChampion(region0, mode0, championId.value!, position.value ?? undefined, {
              tier: mode0 === 'arena' ? undefined : tier0,
              version: version0 ?? undefined,
              signal
            }),
          { tags: ['opgg-group'] }
        )

        championData = data
      }

      region.value = region0
      version.value = version0
      champions.value = championsData
      champion.value = championData
    } catch (error) {
      if (isAbortError(error)) {
        return
      }

      const err = error as Error
      message.error(err.message || String(error))
    } finally {
      isLoading.value = false
    }
  }

  const changeTier = async (tier0: TierType) => {
    queueKeeper.cancelAll()
    isLoading.value = true

    try {
      const region0 = region.value
      const mode0 = mode.value
      const version0 = version.value

      const { data: championsData } = await queueKeeper.add(
        'default',
        'opgg-load-champions',
        ({ signal }) =>
          og.api.getChampions(region0, mode0, {
            tier: mode0 === 'arena' ? undefined : tier0,
            version: version0 ?? undefined,
            signal
          }),
        { tags: ['opgg-group'] }
      )

      let championData: OpggChampionBuildResponse | null = null

      if (championId.value) {
        const { data } = await queueKeeper.add(
          'default',
          'opgg-load-champion',
          ({ signal }) =>
            og.api.getChampion(region0, mode0, championId.value!, position.value ?? undefined, {
              tier: mode0 === 'arena' ? undefined : tier0,
              version: version0 ?? undefined,
              signal
            }),
          { tags: ['opgg-group'] }
        )

        championData = data
      }

      tier.value = tier0
      champions.value = championsData
      champion.value = championData
    } catch (error) {
      if (isAbortError(error)) {
        return
      }

      const err = error as Error
      message.error(err.message || String(error))
    } finally {
      isLoading.value = false
    }
  }

  const changeVersion = async (version0: string) => {
    queueKeeper.cancelAll()
    isLoading.value = true

    try {
      const region0 = region.value
      const mode0 = mode.value
      const tier0 = tier.value

      const nextVersion = await ensureVersionFor(region0, mode0, {
        reload: true,
        preferredVersion: version0
      })

      if (!nextVersion) {
        return
      }

      const { data: championsData } = await queueKeeper.add(
        'default',
        'opgg-load-champions',
        ({ signal }) =>
          og.api.getChampions(region0, mode0, {
            tier: mode0 === 'arena' ? undefined : tier0,
            version: nextVersion,
            signal
          }),
        { tags: ['opgg-group'] }
      )

      let championData: OpggChampionBuildResponse | null = null

      if (championId.value) {
        const { data } = await queueKeeper.add(
          'default',
          'opgg-load-champion',
          ({ signal }) =>
            og.api.getChampion(region0, mode0, championId.value!, position.value ?? undefined, {
              tier: mode0 === 'arena' ? undefined : tier0,
              version: nextVersion,
              signal
            }),
          { tags: ['opgg-group'] }
        )

        championData = data
      }

      version.value = nextVersion
      champions.value = championsData
      champion.value = championData
    } catch (error) {
      if (isAbortError(error)) {
        return
      }

      const err = error as Error
      message.error(err.message || String(error))
    } finally {
      isLoading.value = false
    }
  }

  const changeChampion = async (championId0: number) => {
    // 意图先行：允许 championId/tab 立即变更
    championId.value = championId0
    currentTab.value = 'champion'

    queueKeeper.cancelAll()
    isLoading.value = true

    try {
      const region0 = region.value
      const mode0 = mode.value
      const tier0 = tier.value

      let version0 = version.value

      // 若还没有版本（冷启动时从「单个英雄」入口进来），需要按需拉取一次
      if (!version0) {
        version0 = await ensureVersionFor(region0, mode0, {
          reload: false,
          preferredVersion: null
        })

        if (!version0) {
          return
        }
      }

      const { data: championData } = await queueKeeper.add(
        'default',
        'opgg-load-champion',
        ({ signal }) =>
          og.api.getChampion(region0, mode0, championId0, position.value ?? undefined, {
            tier: mode0 === 'arena' ? undefined : tier0,
            version: version0 ?? undefined,
            signal
          }),
        { tags: ['opgg-group'] }
      )

      version.value = version0
      champion.value = championData
    } catch (error) {
      if (isAbortError(error)) {
        return
      }

      const err = error as Error
      message.error(err.message || String(error))
    } finally {
      isLoading.value = false
    }
  }

  const refresh = async () => {
    queueKeeper.cancelAll()
    isLoading.value = true

    try {
      const region0 = region.value
      const mode0 = mode.value
      const tier0 = tier.value

      // refresh：强制重新拉取 versions 并校准 version
      const nextVersion = await ensureVersionFor(region0, mode0, {
        reload: true,
        preferredVersion: version.value
      })

      if (!nextVersion) {
        return
      }

      const { data: championsData } = await queueKeeper.add(
        'default',
        'opgg-load-champions',
        ({ signal }) =>
          og.api.getChampions(region0, mode0, {
            tier: mode0 === 'arena' ? undefined : tier0,
            version: nextVersion,
            signal
          }),
        { tags: ['opgg-group'] }
      )

      let championData: OpggChampionBuildResponse | null = null

      if (championId.value) {
        const { data } = await queueKeeper.add(
          'default',
          'opgg-load-champion',
          ({ signal }) =>
            og.api.getChampion(region0, mode0, championId.value!, position.value ?? undefined, {
              tier: mode0 === 'arena' ? undefined : tier0,
              version: nextVersion,
              signal
            }),
          { tags: ['opgg-group'] }
        )

        championData = data
      }

      version.value = nextVersion
      champions.value = championsData
      champion.value = championData
    } catch (error) {
      if (isAbortError(error)) {
        return
      }

      const err = error as Error
      message.error(err.message || String(error))
    } finally {
      isLoading.value = false
    }
  }

  const cancel = () => {
    queueKeeper.cancelAll()
  }

  const setTab = (tab: 'champions' | 'champion', championId0?: number) => {
    currentTab.value = tab

    if (championId0) {
      championId.value = championId0
      changeChampion(championId0)
    }
  }

  refresh()

  // sync
  watch(
    [flashPosition, mode, position, region, tier],
    ([flashPosition, mode, position, region, tier]) => {
      console.log('sync', flashPosition, mode, position, region, tier)
      og.updatePreferences({
        flashPosition,
        mode,
        position,
        region,
        tier
      })
    }
  )

  provide(OpggContextKey, {
    currentTab,

    setTab,

    flashPosition,
    setFlashPosition,

    championId,
    mode,
    position,
    region,
    tier,
    version,
    queueKeeper,

    versions,
    champions,
    champion,

    isLoading,

    changeMode,
    changePosition,
    changeRegion,
    changeTier,
    changeVersion,
    changeChampion,
    refresh,

    cancel
  })
}

export function useOpgg() {
  const context = inject(OpggContextKey)

  if (!context) {
    throw new Error('no opgg context found')
  }

  return context
}
