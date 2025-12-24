import { OpggRenderer } from '@opgg-window/shards/opgg'
import { useOpggStore } from '@opgg-window/shards/opgg/store'
import { useStableComputed } from '@renderer-shared/composables/useStableComputed'
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import {
  ModeType,
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
import { InjectionKey, Ref, inject, onMounted, provide, ref, shallowRef, watch } from 'vue'

import { hasItemsSets, useLoadout } from './utils/loadout'

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
  const lcs = useLeagueClientStore()
  const og = useInstance(OpggRenderer)
  const ogs = useOpggStore()
  const message = useMessage()

  const { setSummonerSpells, setRunes, writeItemSets } = useLoadout()

  const { t } = useTranslation()

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

  const update = async (opts: {
    region?: RegionType
    mode?: ModeType
    tier?: TierType
    version?: string
    championId?: number
    position?: PositionType
    force?: boolean
  }) => {
    queueKeeper.cancelAll()

    isLoading.value = true

    try {
      const nextVersion = await ensureVersionFor(
        opts.region ?? region.value,
        opts.mode ?? mode.value,
        {
          // version 和 mode 需要刷新 version
          // 但也没那么强制，但 mode 变化必须刷新 version
          reload: opts.force || opts.mode !== undefined || opts.version !== undefined,
          preferredVersion: opts.version ?? version.value
        }
      )

      if (!nextVersion) {
        message.warning(() => t('OpggView.noVersionFound'))
        return
      }

      const targetMode = opts.mode ?? mode.value
      const targetRegion = opts.region ?? region.value
      const targetTier = opts.tier ?? tier.value
      const targetChampionId = opts.championId ?? championId.value
      let targetPosition = opts.position ?? position.value

      // 硬性限制：非 ranked 模式必须为 none
      // ranked 模式下不能为 none
      if (targetMode === 'ranked') {
        if (targetPosition === 'none') {
          targetPosition = 'mid'
        }
      } else {
        targetPosition = 'none'
      }

      let updatedChampionsData: OpggChampionsResponse | null = null

      if (opts.force || opts.region || opts.mode || opts.version || opts.tier) {
        const { data: championsData } = await queueKeeper.add(
          'default',
          'opgg-load-champions',
          ({ signal }) =>
            og.api.getChampions(targetRegion, targetMode, {
              tier: targetMode === 'arena' ? undefined : targetTier,
              version: nextVersion,
              signal
            }),
          { tags: ['opgg-group'] }
        )

        updatedChampionsData = championsData
      }

      let updatedChampionData: OpggChampionBuildResponse | null = null

      if (targetChampionId) {
        const { data: championData } = await queueKeeper.add(
          'default',
          'opgg-load-champion',
          ({ signal }) =>
            og.api.getChampion(targetRegion, targetMode, targetChampionId, targetPosition, {
              tier: targetMode === 'arena' ? undefined : targetTier,
              version: nextVersion,
              signal
            }),
          { tags: ['opgg-group'] }
        )

        updatedChampionData = championData
      }

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

  const changeMode = async (mode0: ModeType) => {
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
    queueKeeper.cancelAll()
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
    refresh()
  })

  // persistent
  watch(
    [flashPosition, mode, position, region, tier],
    ([flashPosition, mode, position, region, tier]) => {
      og.updatePreferences({
        flashPosition,
        mode,
        position,
        region,
        tier
      })
    }
  )

  // sync game
  const activeSession = useStableComputed(() => {
    if (!lcs.champSelect.session || !lcs.gameflow.session) {
      return
    }

    const selfCellId = lcs.champSelect.session.localPlayerCellId
    const self = lcs.champSelect.session.myTeam.find((p) => p.cellId === selfCellId)
    const selfActionChampionId = lcs.champSelect.session.actions
      .flat(1)
      .find((a) => a.actorCellId === selfCellId && a.type === 'pick' && a.championId)?.championId

    if (!self && !selfActionChampionId) {
      return
    }

    return {
      championId: self?.championId || selfActionChampionId,
      assignedPosition: self?.assignedPosition,
      gameMode: lcs.gameflow.session.gameData.queue.gameMode
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
      let justSwitchTab = false

      switch (active.gameMode) {
        case 'CLASSIC':
          mode0 = 'ranked'
          break
        case 'ARAM':
          mode0 = 'aram'
          position.value = 'none'
          break
        case 'KIWI':
          justSwitchTab = true
          mode0 = 'aram'
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
        switch (active.assignedPosition) {
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

        await update({
          championId: active.championId,
          mode: mode0,
          position: position0
        })

        if (justSwitchTab) {
          return
        }

        // 处理自动化
        const summonerSpells = champion.value?.data.summoner_spells
        const runes = champion.value?.data.runes

        if (summonerSpells && summonerSpells[0] && ogs.frontendSettings.autoApplySpells) {
          setSummonerSpells(summonerSpells[0].ids, flashPosition.value)
        }

        if (runes && runes[0] && ogs.frontendSettings.autoApplyRunes) {
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
