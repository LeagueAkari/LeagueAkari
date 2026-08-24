import { OpggRenderer } from '@opgg-window/shards/opgg'
import { useOpggStore } from '@opgg-window/shards/opgg/store'
import { useStableComputed } from '@renderer-shared/composables/useStableComputed'
import { useInstance } from '@renderer-shared/shards'
import { useAutoChampConfigStore } from '@renderer-shared/shards/auto-champ-config/store'
import { ChampionDataRenderer } from '@renderer-shared/shards/champion-data'
import { useChampionDataStore } from '@renderer-shared/shards/champion-data/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import type {
  ChampionDataFallbackReason,
  ChampionDataLoadResult,
  ChampionDataMode,
  ChampionDataPosition,
  ChampionDataQuery,
  ChampionDataSourceId
} from '@shared/data-adapter/champion-data'
import {
  CHAMPION_DATA_CAPABILITIES,
  getChampionDataCapability
} from '@shared/data-adapter/champion-data'
import {
  ModeType,
  OpggAramMayhemChampionAugmentsResponse,
  OpggChampionBuildResponse,
  OpggChampionsResponse,
  PositionType,
  RegionType,
  TierType
} from '@shared/types/opgg'
import { QueueKeeper, isAbortError } from '@shared/utils/queue-keeper'
import { watchDebounced } from '@vueuse/core'
import { useTranslation } from 'i18next-vue'
import { useMessage } from 'naive-ui'
import {
  InjectionKey,
  Ref,
  computed,
  inject,
  onMounted,
  provide,
  ref,
  shallowRef,
  watch
} from 'vue'

import {
  toOpggChampionDetailsViewModel,
  toOpggChampionOverviewViewModel,
  toOpggMayhemAugmentsViewModel
} from './champion-data-view-model'
import { hasItemsSets, useLoadout } from './utils/loadout'

// 对齐 auto champ config (暂定)
const AUTO_CHAMP_CONFIG_GAME_MODE_MAP: Record<string, string> = {
  CLASSIC: 'normal',
  URF: 'urf',
  ARAM: 'aram',
  NEXUSBLITZ: 'nexusblitz',
  ULTBOOK: 'ultbook'
}

const OPGG_TO_UNIFIED_POSITION: Readonly<Record<string, ChampionDataPosition>> = {
  all: 'all',
  top: 'top',
  jungle: 'jungle',
  mid: 'middle',
  adc: 'bottom',
  support: 'utility',
  none: 'none'
}

const UNIFIED_TO_OPGG_POSITION: Readonly<Record<ChampionDataPosition, PositionType>> = {
  all: 'all',
  top: 'top',
  jungle: 'jungle',
  middle: 'mid',
  bottom: 'adc',
  utility: 'support',
  none: 'none'
}

const OPGG_TO_CHAMPION_DATA_MODE: Readonly<Record<string, ChampionDataMode>> = {
  ranked: 'ranked',
  aram: 'aram',
  aram_mayhem: 'aram_mayhem',
  arena: 'arena',
  nexus_blitz: 'nexus_blitz',
  urf: 'urf'
}

function toChampionDataMode(mode: ModeType): ChampionDataMode {
  const unifiedMode = OPGG_TO_CHAMPION_DATA_MODE[mode]
  if (unifiedMode) return unifiedMode
  throw new Error(`Unsupported champion data mode: ${mode}`)
}

function toChampionDataPosition(position: PositionType) {
  return OPGG_TO_UNIFIED_POSITION[position] ?? 'none'
}

function resolveSupportedMode(source: ChampionDataSourceId, requestedMode: ModeType): ModeType {
  const supportedModes = CHAMPION_DATA_CAPABILITIES[source]
  return supportedModes.some((item) => item.mode === requestedMode)
    ? requestedMode
    : (supportedModes[0]?.mode ?? 'ranked')
}

export const OpggContextKey: InjectionKey<OpggContext> = Symbol('OpggContext')

export type OpggContext = {
  currentTab: Ref<'champions' | 'champion'>

  setTab: (tab: 'champions' | 'champion', championId?: number) => void

  flashPosition: Ref<'auto' | 'd' | 'f'>

  preferredSource: Readonly<Ref<ChampionDataSourceId>>
  championId: Ref<number | null>
  mode: Ref<ModeType>
  position: Ref<PositionType>
  region: Ref<RegionType>
  tier: Ref<TierType>
  version: Ref<string | null>
  queueKeeper: Readonly<QueueKeeper>

  versions: Ref<string[]>
  champions: Ref<OpggChampionsResponse | null>
  champion: Ref<OpggChampionBuildResponse | null>

  kiwiAugments: Ref<OpggAramMayhemChampionAugmentsResponse | null>

  effectiveSource: Ref<ChampionDataSourceId | null>
  fallbackReason: Ref<ChampionDataFallbackReason | null>
  isDataUnavailable: Ref<boolean>

  isLoading: Ref<boolean>

  setFlashPosition: (flashPosition: 'auto' | 'd' | 'f') => void

  changeSource: (source: ChampionDataSourceId) => Promise<void>
  changeMode: (mode: ModeType) => Promise<void>
  changePosition: (position: PositionType) => Promise<void>
  changeRegion: (region: RegionType) => Promise<void>
  changeTier: (tier: TierType) => Promise<void>
  changeVersion: (version: string) => Promise<void>
  changeChampion: (championId: number) => Promise<void>

  refresh: () => Promise<void>

  cancel: () => void
}

type AutoChampConfigCheckOptions = {
  championId: number | null
  gameMode: string
  queueType: string
  assignedPosition?: string | null
}

type AutoChampConfigCheckResult = {
  hasRunesConfig: boolean
  hasSummonerSpellsConfig: boolean
}

type AutoChampConfigCheckFn = (options: AutoChampConfigCheckOptions) => AutoChampConfigCheckResult

class ChampionDataUnavailableError extends Error {
  constructor(readonly hasRequestFailure: boolean) {
    super('Champion data is unavailable')
  }
}

function useHasAutoChampConfig(): AutoChampConfigCheckFn {
  const acs = useAutoChampConfigStore()

  const resolveConfigKeys = (options: AutoChampConfigCheckOptions): string[] => {
    if (options.gameMode === 'CLASSIC') {
      if (options.queueType.startsWith('RANKED_')) {
        const rankedKey = `ranked-${options.assignedPosition ?? 'undefined'}`
        return [rankedKey, 'ranked-default']
      }

      return ['normal']
    }

    const mappedKey = AUTO_CHAMP_CONFIG_GAME_MODE_MAP[options.gameMode]
    return mappedKey ? [mappedKey] : []
  }

  return (options) => {
    if (!options.championId) {
      return {
        hasRunesConfig: false,
        hasSummonerSpellsConfig: false
      }
    }

    const configKeys = resolveConfigKeys(options)
    if (configKeys.length === 0) {
      return {
        hasRunesConfig: false,
        hasSummonerSpellsConfig: false
      }
    }

    const runesConfig = acs.settings.runesV2[options.championId]
    const spellsConfig = acs.settings.summonerSpells[options.championId]

    return {
      hasRunesConfig: configKeys.some((key) => Boolean(runesConfig?.[key])),
      hasSummonerSpellsConfig: configKeys.some((key) => Boolean(spellsConfig?.[key]))
    }
  }
}

export function provideOpgg() {
  const og = useInstance(OpggRenderer)
  const championData = useInstance(ChampionDataRenderer)

  const lcs = useLeagueClientStore()
  const ogs = useOpggStore()
  const championDataStore = useChampionDataStore()
  const resolveAutoChampConfig = useHasAutoChampConfig()

  const message = useMessage()

  const { setSummonerSpells, setRunes, writeItemSets } = useLoadout()

  const { t } = useTranslation()

  const currentTab = ref<'champions' | 'champion'>('champions')

  const flashPosition = ref<'auto' | 'd' | 'f'>(ogs.savedPreferences.flashPosition)

  const setFlashPosition = (flashPosition0: 'auto' | 'd' | 'f') => {
    flashPosition.value = flashPosition0
  }

  const preferredSource = computed(() => championDataStore.settings.preferredSource)
  const savedMode = championDataStore.settings.preferences.mode
  const mode = ref<ModeType>(resolveSupportedMode(preferredSource.value, savedMode))
  const position = ref<PositionType>(
    UNIFIED_TO_OPGG_POSITION[championDataStore.settings.preferences.position]
  )
  const region = ref<RegionType>(championDataStore.settings.preferences.region)
  const tier = ref<TierType>(String(championDataStore.settings.preferences.tier))
  const version = ref<string | null>(null)

  const championId = ref<number | null>(null)
  const versions = shallowRef<string[]>([])
  const champions = shallowRef<OpggChampionsResponse | null>(null)
  const champion = shallowRef<OpggChampionBuildResponse | null>(null)

  const kiwiAugments = shallowRef<OpggAramMayhemChampionAugmentsResponse | null>(null)
  const effectiveSource = ref<ChampionDataSourceId | null>(null)
  const fallbackReason = ref<ChampionDataFallbackReason | null>(null)
  const isDataUnavailable = ref(false)

  const queueKeeper = new QueueKeeper([{ id: 'default' }])

  const isLoading = ref(false)
  let updateGeneration = 0
  let loadedPatchContext: string | null = null
  let sourceChangeInProgress = false

  const unwrapResult = <T>(result: ChampionDataLoadResult<T>, generation: number) => {
    if (generation === updateGeneration) {
      effectiveSource.value = result.effectiveSource
      fallbackReason.value = result.fallbackReason
    }
    if (result.status === 'unavailable') {
      isDataUnavailable.value = true
      champions.value = null
      champion.value = null
      kiwiAugments.value = null
      throw new ChampionDataUnavailableError(
        result.attempts.some((attempt) => attempt.outcome === 'failed')
      )
    }
    isDataUnavailable.value = false
    return result.data
  }

  const ensureVersionFor = async (
    source: ChampionDataSourceId,
    region0: RegionType,
    mode0: ModeType,
    opts: {
      reload: boolean
      preferredVersion?: string | null
    },
    generation: number
  ): Promise<string | null> => {
    const preferred = opts.preferredVersion ?? version.value
    const capability = getChampionDataCapability(source, toChampionDataMode(mode0))
    const patchContext = `${source}:${region0}:${mode0}`

    if (!capability?.filters.includes('patch')) {
      versions.value = []
      loadedPatchContext = patchContext
      return null
    }

    if (opts.reload || loadedPatchContext !== patchContext) {
      const result = await queueKeeper.add(
        'default',
        'champion-data-load-patches',
        ({ signal }) =>
          championData.loadPatches(
            {
              source,
              mode: toChampionDataMode(mode0),
              ...(capability.filters.includes('region') ? { region: region0 } : {})
            },
            { signal }
          ),
        { tags: ['opgg-group'] }
      )

      const patches = unwrapResult(result, generation)
      if (generation !== updateGeneration) return null
      versions.value = patches
      loadedPatchContext = patchContext
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

  const update = async (opts: {
    source?: ChampionDataSourceId
    region?: RegionType
    mode?: ModeType
    tier?: TierType
    version?: string
    championId?: number
    position?: PositionType
    force?: boolean
  }) => {
    const generation = ++updateGeneration
    queueKeeper.cancelAll()

    isLoading.value = true

    try {
      const targetSource = opts.source ?? preferredSource.value
      const targetMode = opts.mode ?? mode.value
      const targetRegion = opts.region ?? region.value
      const targetTier = opts.tier ?? tier.value
      const targetChampionId = opts.championId ?? championId.value
      let targetPosition = opts.position ?? position.value
      const capability = getChampionDataCapability(targetSource, toChampionDataMode(targetMode))

      if (!capability) {
        effectiveSource.value = null
        fallbackReason.value = 'mode-unsupported'
        isDataUnavailable.value = true
        champions.value = null
        champion.value = null
        kiwiAugments.value = null
        return false
      }

      const nextVersion = await ensureVersionFor(
        targetSource,
        targetRegion,
        targetMode,
        {
          // version 和 mode 需要刷新 version
          // 但也没那么强制，但 mode 变化必须刷新 version
          reload: opts.force || opts.mode !== undefined || opts.version !== undefined,
          preferredVersion: opts.version ?? version.value
        },
        generation
      )

      if (generation !== updateGeneration) return false

      if (capability.filters.includes('patch') && !nextVersion) {
        message.warning(() => t('opgg.view.noVersionFound'))
        return false
      }

      // 只有声明了位置筛选能力的模式才保留位置，其余模式统一为 none
      if (capability.filters.includes('position')) {
        if (targetPosition === 'none') {
          targetPosition = 'mid'
        }
      } else {
        targetPosition = 'none'
      }

      const query: ChampionDataQuery = {
        source: targetSource,
        mode: toChampionDataMode(targetMode),
        ...(capability.filters.includes('region') ? { region: targetRegion } : {}),
        ...(capability.filters.includes('position')
          ? { position: toChampionDataPosition(targetPosition) }
          : {}),
        ...(capability.filters.includes('tier') ? { tier: targetTier } : {}),
        ...(capability.filters.includes('patch') && nextVersion ? { patch: nextVersion } : {})
      }

      let updatedChampionsData: OpggChampionsResponse | null = null

      if (
        opts.force ||
        opts.source ||
        opts.region ||
        opts.mode ||
        opts.version ||
        opts.tier ||
        opts.position
      ) {
        const result = await queueKeeper.add(
          'default',
          'champion-data-load-overview',
          ({ signal }) => championData.loadOverview(query, { signal }),
          { tags: ['opgg-group'] }
        )

        updatedChampionsData = toOpggChampionOverviewViewModel(unwrapResult(result, generation))
      }

      let updatedChampionData: OpggChampionBuildResponse | null = null
      let updatedKiwiAugmentsData: OpggAramMayhemChampionAugmentsResponse | null = null

      if (targetChampionId) {
        const result = await queueKeeper.add(
          'default',
          'champion-data-load-details',
          ({ signal }) => championData.loadDetails(query, targetChampionId, { signal }),
          { tags: ['opgg-group'] }
        )
        const details = unwrapResult(result, generation)
        updatedChampionData = toOpggChampionDetailsViewModel(details)
        updatedKiwiAugmentsData = toOpggMayhemAugmentsViewModel(
          details,
          toChampionDataMode(targetMode)
        )
      }

      if (generation !== updateGeneration) return false

      // commit
      version.value = nextVersion
      region.value = targetRegion
      mode.value = targetMode
      tier.value = targetTier
      position.value = targetPosition
      championId.value = targetChampionId

      if (updatedChampionsData) {
        champions.value = updatedChampionsData
      }

      if (updatedChampionData) {
        champion.value = updatedChampionData
      }

      // 会在模式不匹配时主动清空
      kiwiAugments.value = updatedKiwiAugmentsData
      return true
    } catch (error) {
      if (generation !== updateGeneration || isAbortError(error)) {
        return false
      }

      if (error instanceof ChampionDataUnavailableError) {
        if (error.hasRequestFailure) message.error(() => t('opgg.view.dataUnavailable'))
        return false
      }

      const err = error as Error
      message.error(err.message || String(error))
      return false
    } finally {
      if (generation === updateGeneration) isLoading.value = false
    }
  }

  const changeSource = async (source: ChampionDataSourceId) => {
    if (
      source === preferredSource.value ||
      !championDataStore.availability.sources[source].enabled
    ) {
      return
    }

    const nextMode = resolveSupportedMode(source, mode.value)
    mode.value = nextMode
    sourceChangeInProgress = true
    try {
      await championData.setPreferredSource(source)
      loadedPatchContext = null
      await update({ source, mode: nextMode, force: true })
    } finally {
      sourceChangeInProgress = false
    }
  }

  const changeMode = async (mode0: ModeType) => {
    if (!getChampionDataCapability(preferredSource.value, toChampionDataMode(mode0))) {
      return
    }

    await update({ mode: mode0 })
  }

  const changePosition = async (position0: PositionType) => {
    if (mode.value !== 'ranked') {
      return
    }

    await update({ position: position0 })
  }

  const changeRegion = async (region0: RegionType) => {
    await update({ region: region0 })
  }

  const changeTier = async (tier0: TierType) => {
    await update({ tier: tier0 })
  }

  const changeVersion = async (version0: string) => {
    await update({ version: version0 })
  }

  const changeChampion = async (championId0: number) => {
    await update({ championId: championId0 })
  }

  const cancel = () => {
    updateGeneration++
    queueKeeper.cancelAll()
    isLoading.value = false
  }

  const setTab = (tab: 'champions' | 'champion', championId0?: number) => {
    currentTab.value = tab

    if (championId0) {
      championId.value = championId0
      changeChampion(championId0)
    }
  }

  const refresh = async () => {
    await update({ force: true })
  }

  onMounted(() => {
    if (mode.value !== savedMode) {
      void championData.setPreferences({ mode: toChampionDataMode(mode.value) })
    }
    refresh()
  })

  // persistent
  watch(
    [flashPosition, mode, position, region, tier],
    ([flashPosition, mode, position, region, tier]) => {
      void og.updatePreferences({
        flashPosition,
        mode,
        position,
        region,
        tier
      })
      void championData.setPreferences({
        mode: toChampionDataMode(mode),
        position: toChampionDataPosition(position),
        region,
        tier
      })
    }
  )

  watch(
    () =>
      [
        championDataStore.settings.preferredSource,
        championDataStore.availability.sources.opgg.enabled,
        championDataStore.availability.sources.qq101.enabled
      ] as const,
    ([source], [previousSource]) => {
      if (sourceChangeInProgress) return

      loadedPatchContext = null
      if (source !== previousSource) {
        const nextMode = resolveSupportedMode(source, mode.value)
        mode.value = nextMode
        void update({ mode: nextMode, force: true })
      } else {
        void refresh()
      }
    }
  )

  // sync game
  const activeSession = useStableComputed(() => {
    if (!lcs.champSelect.session || !lcs.gameflow.session) {
      return null
    }

    const selfCellId = lcs.champSelect.session.localPlayerCellId
    const self = lcs.champSelect.session.myTeam.find((p) => p.cellId === selfCellId)
    const selfActionChampionId = lcs.champSelect.session.actions
      .flat(1)
      .find((a) => a.actorCellId === selfCellId && a.type === 'pick' && a.championId)?.championId

    if (!self) {
      return null
    }

    const championId = selfActionChampionId ?? self.championId // 可能是 0

    if (!championId) {
      return null
    }

    // 避免和 auto champ config 冲突，优先按照那边的来
    const queue = lcs.gameflow.session.gameData.queue
    const autoChampConfig = resolveAutoChampConfig({
      championId,
      gameMode: queue.gameMode,
      queueType: queue.type,
      assignedPosition: self.assignedPosition
    })

    return {
      championId,
      assignedPosition: self.assignedPosition,
      gameMode: queue.gameMode,
      hasAutoRunesConfig: autoChampConfig.hasRunesConfig,
      hasAutoSpellsConfig: autoChampConfig.hasSummonerSpellsConfig
    }
  })

  // handle to champion (if supported)
  // and auto
  watchDebounced(
    activeSession,
    async (active) => {
      if (!active) {
        return
      }

      let mode0 = mode.value
      let isUnsupportedMode = false
      let isMayhem = false

      switch (active.gameMode) {
        case 'CLASSIC':
          mode0 = 'ranked'
          break
        case 'ARAM':
          mode0 = 'aram'
          position.value = 'none'
          break
        case 'KIWI':
          isMayhem = true
          mode0 = 'aram_mayhem'
          position.value = 'none'
          break
        case 'CHERRY':
          mode0 = 'arena'
          break
        case 'NEXUSBLITZ':
          mode0 = 'nexus_blitz'
          break
        case 'URF':
        case 'ARURF':
          mode0 = 'urf'
          break
        default:
          isUnsupportedMode = true
          break
      }

      if (isUnsupportedMode) {
        return
      }

      let position0 = position.value

      if (active.assignedPosition) {
        switch (active.assignedPosition.toLowerCase()) {
          case 'top':
            position0 = 'top'
            break
          case 'jungle':
            position0 = 'jungle'
            break
          case 'middle':
            position0 = 'mid'
            break
          case 'bottom':
            position0 = 'adc'
            break
          case 'utility':
            position0 = 'support'
            break
        }
      }

      if (
        active.championId &&
        active.championId !== -3 /* cherry bravery */ &&
        !lcs.champSelect.disabledChampionIds.has(active.championId)
      ) {
        currentTab.value = 'champion'
        championId.value = active.championId

        const updated = await update({
          championId: active.championId,
          mode: mode0,
          position: position0
        })

        if (!updated) return

        // 处理自动化
        const summonerSpells = champion.value?.data.summoner_spells
        const runes = champion.value?.data.runes

        if (
          !isMayhem &&
          !active.hasAutoSpellsConfig &&
          summonerSpells &&
          summonerSpells[0] &&
          ogs.frontendSettings.autoApplySpells
        ) {
          setSummonerSpells(summonerSpells[0].ids, flashPosition.value)
        }

        if (
          !isMayhem &&
          !active.hasAutoRunesConfig &&
          runes &&
          runes[0] &&
          ogs.frontendSettings.autoApplyRunes
        ) {
          setRunes(runes[0], { championId: active.championId, position: position0 })
        }

        if (champion.value && hasItemsSets(champion.value) && ogs.frontendSettings.autoApplyItems) {
          writeItemSets(champion.value, {
            position: position0,
            mode: mode0,
            region: region.value,
            tier: tier.value
          })
        }
      }
    },
    { immediate: true, debounce: 500 }
  )

  provide(OpggContextKey, {
    currentTab,

    setTab,

    flashPosition,
    setFlashPosition,

    preferredSource,
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

    kiwiAugments,

    effectiveSource,
    fallbackReason,
    isDataUnavailable,

    isLoading,

    changeSource,
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
