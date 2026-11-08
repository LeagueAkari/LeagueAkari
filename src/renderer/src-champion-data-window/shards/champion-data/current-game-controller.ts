import { useStableComputed } from '@renderer-shared/composables/useStableComputed'
import { i18next } from '@renderer-shared/i18n'
import { useAutoChampConfigStore } from '@renderer-shared/shards/auto-champ-config/store'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { useChampionDataWindowStore } from '@renderer-shared/shards/window-manager/store'
import type { ChampionRunesConfig } from '@shared/shards/auto-champ-config'
import { resolveChampionPresetKey } from '@shared/shards/auto-champ-config/preset'
import { CHAMPION_DATA_SOURCE_ORDER, type ChampionDataSourceId } from '@shared/types/champion-data'
import { formatError } from '@shared/utils/errors'
import { isAbortError } from '@shared/utils/queue-keeper'
import _ from 'lodash'
import { type ComputedRef, computed, onScopeDispose, watch, watchEffect } from 'vue'

import type { ChampionDataRendererContext, RuneAutomationStatus, RuneTask } from './context'
import { LoadoutExecutor, type RuneWriteProgress } from './loadout-executor'
import {
  type BindCurrentGameSource,
  type CurrentGameInput,
  type Recommendation,
  loadoutStatus
} from './source-contract'
import { useChampionDataStore } from './store'

const RETAIN_PHASES = new Set(['ChampSelect', 'GameStart', 'InProgress', 'Reconnect'])

interface SelectionState {
  target: CurrentGameInput
  locked: boolean
}

interface GameState {
  phase: 'paused' | 'ended' | 'champSelect' | 'inGame'
  target: CurrentGameInput | null
}

interface ApplicationState {
  status: RuneAutomationStatus
  error?: string
  task?: RuneTask
  progress?: RuneWriteProgress
}

export class CurrentGameController {
  constructor(
    private readonly _context: ChampionDataRendererContext,
    private readonly _sources: Record<ChampionDataSourceId, BindCurrentGameSource>,
    private readonly _executor: LoadoutExecutor
  ) {}

  private get _game() {
    return useChampionDataStore().currentGame
  }

  setup() {
    const store = useChampionDataStore()
    const client = useLeagueClientStore()

    // A missing snapshot retains the last input. An explicit end or empty pick clears it.
    const selection = computed(() =>
      client.gameflow.phase === 'ChampSelect' ? this._selection() : null
    )

    const game = computed(() => this._readGame(selection.value?.target ?? null))

    watch(game, (state) => this._syncGame(state), { immediate: true })

    const input = computed(() => {
      const { target } = store.currentGame
      return target && target.championId > 0 ? target : null
    })

    for (const id of CHAMPION_DATA_SOURCE_ORDER) {
      this._bindSource(id, input)
    }

    const defaultSource = computed(() => store.settings.sourcePreferences.defaultSource)
    const loadout = computed(() => defaultSource.value && store.loadouts[defaultSource.value])
    const recommendation = computed<Recommendation<ChampionRunesConfig>>(
      () => loadout.value?.runes ?? { status: 'sourceUnavailable' }
    )

    const blockedReason = computed(() =>
      this._baseStatus(selection.value, recommendation.value.status)
    )

    const decision = useStableComputed<ApplicationState>(
      () => {
        if (blockedReason.value) {
          return { status: blockedReason.value }
        }

        const source = defaultSource.value
        if (!source) {
          return { status: 'sourceUnavailable' }
        }

        const result = recommendation.value
        if (result.status !== 'ready') {
          return result
        }

        const task = {
          cycle: this._game.cycle,
          source,
          queryKey: loadout.value!.queryKey,
          runes: result.value
        }

        return { status: 'applying', task }
      },
      { flush: 'sync' }
    )

    const application = computed<ApplicationState>(() => {
      const { task } = decision.value
      if (!task) {
        return decision.value
      }

      if (this._game.running || store.applying.runes) {
        return { status: 'applying' }
      }

      const failure = this._game.failure
      if (failure && _.isEqual(task, failure.task)) {
        if (failure.message !== null) {
          return { status: 'applyError', error: failure.message }
        }

        return { status: 'applying', task, progress: failure.progress }
      }

      return decision.value
    })

    watch(
      application,
      (state) => {
        store.currentGame.status = state.status
        store.currentGame.error = state.error ?? null

        if (state.task) {
          const task = state.task
          const isCurrent = () =>
            store.currentGame.cycle === task.cycle && decision.value.task === task

          void this._applyRunes(task, isCurrent, state.progress)
        }
      },
      { immediate: true }
    )

    onScopeDispose(() => {
      this._endGame()
      for (const id of CHAMPION_DATA_SOURCE_ORDER) {
        delete store.loadouts[id]
      }
    })
  }

  private _bindSource(id: ChampionDataSourceId, input: ComputedRef<CurrentGameInput | null>) {
    const { loadouts } = useChampionDataStore()

    const failed = (error: unknown) => {
      const message = formatError(error)
      this._context.logger.warn(`Champion Data source ${id} failed`, message)
      return loadoutStatus('loadError', message)
    }

    try {
      const read = this._sources[id](input)

      watchEffect(
        () => {
          try {
            loadouts[id] = read()
          } catch (error) {
            loadouts[id] = failed(error)
          }
        },
        { flush: 'sync' }
      )
    } catch (error) {
      loadouts[id] = failed(error)
    }
  }

  retryApplication() {
    const failure = this._game.failure
    if (failure) {
      this._game.failure = { ...failure, message: null }
    }
  }

  private _selection(): SelectionState | null {
    const client = useLeagueClientStore()
    const session = client.champSelect.session
    const queue = client.gameflow.session?.gameData.queue
    if (!session || !queue || session.isSpectating) {
      return null
    }

    const self = (session.myTeam ?? []).find(
      (player) => player.cellId === session.localPlayerCellId
    )
    if (!self) {
      return null
    }

    const picks = (session.actions ?? [])
      .flat()
      .filter((action) => action.actorCellId === self.cellId && action.type === 'pick')

    // Match the client's pickAction/isDonePicking: unfinished actions take precedence,
    // and an assigned champion with no pick action is already determined by the system.
    const pick =
      picks.find((action) => !action.completed) ?? picks.find((action) => action.completed)

    return {
      target: {
        championId: self.championId,
        assignedPosition: self.assignedPosition?.toLowerCase() ?? '',
        gameMode: queue.gameMode,
        queueType: queue.type,
        queueId: queue.id
      },
      locked: Array.isArray(session.actions) && (pick ? pick.completed : self.championId > 0)
    }
  }

  private _readGame(selection: CurrentGameInput | null): GameState {
    const client = useLeagueClientStore()
    const phase = client.gameflow.phase
    if (!client.isConnected || !phase) {
      return { phase: 'paused', target: null }
    }

    // Only phases delimit the lifecycle: gameflow can retain the previous game's ID
    // until the current champion selection is about to enter GameStart.
    if (!RETAIN_PHASES.has(phase)) {
      return { phase: 'ended', target: null }
    }

    if (phase === 'ChampSelect') {
      return { phase: 'champSelect', target: selection }
    }

    return { phase: 'inGame', target: this._inGameTarget() }
  }

  private _inGameTarget(): CurrentGameInput | null {
    const client = useLeagueClientStore()
    const game = client.gameflow.session?.gameData
    const puuid = client.summoner.me?.puuid
    if (!game?.queue || !puuid) {
      return null
    }

    const isSelf = (player: { puuid: string }) => player.puuid === puuid

    const self = game.teamOne?.find(isSelf) ?? game.teamTwo?.find(isSelf)
    const selection = game.playerChampionSelections?.find(isSelf)
    const championId =
      selection && selection.championId > 0 ? selection.championId : (self?.championId ?? 0)
    if (championId <= 0) {
      return null
    }

    return {
      championId,
      assignedPosition:
        self?.selectedPosition?.toLowerCase() ||
        (this._game.championId === championId ? this._game.position : ''),
      gameMode: game.queue.gameMode,
      queueType: game.queue.type,
      queueId: game.queue.id
    }
  }

  private _syncGame(game: GameState) {
    if (game.phase === 'paused') {
      return
    }

    if (game.phase === 'ended') {
      this._endGame()
      return
    }

    const { target } = game
    if (!target || _.isEqual(target, this._game.target)) {
      return
    }

    const key = (value: CurrentGameInput | null) =>
      value && `${value.championId}:${value.assignedPosition}:${value.gameMode}:${value.queueId}`

    if (key(target) !== key(this._game.target)) {
      this._game.cycle++

      this._game.applied = false
      this._game.manual = false
      this._game.failure = null
    }

    this._game.target = target
  }

  private _endGame() {
    this._game.cycle++
    this._game.target = null

    this._game.applied = false
    this._game.manual = false
    this._game.failure = null

    this._game.status = 'disabled'
    this._game.error = null
  }

  private _baseStatus(
    selection: SelectionState | null,
    dataStatus: Recommendation<ChampionRunesConfig>['status']
  ): RuneAutomationStatus | null {
    const target = this._game.target
    if (!target) {
      return 'disabled'
    }

    const store = useChampionDataStore()
    const client = useLeagueClientStore()
    const window = useChampionDataWindowStore()
    if (!client.isConnected) {
      return 'disconnected'
    }

    if (client.gameflow.phase !== 'ChampSelect') {
      return 'inGame'
    }

    if (target.championId <= 0) {
      return 'waitingChampion'
    }

    if (this._game.manual) {
      return 'manual'
    }

    if (this._game.applied) {
      return 'applied'
    }

    const presetStore = useAutoChampConfigStore()
    if (store.settings.automation.enabled && !presetStore.isReady) {
      return 'loading'
    }

    const presets = presetStore.settings
    const saved = presets.runesV2[target.championId]
    const presetKey = resolveChampionPresetKey(
      saved,
      target.gameMode,
      target.queueType,
      target.assignedPosition
    )
    if (presets.enabled && presetKey && saved?.[presetKey]) {
      return 'preset'
    }

    if (
      dataStatus === 'sourceUnavailable' ||
      dataStatus === 'unsupportedMode' ||
      dataStatus === 'missingPosition'
    ) {
      return dataStatus
    }

    if (!store.settings.automation.enabled) {
      return 'disabled'
    }

    // Minimizing preserves show; an explicit hide clears it even while status is minimized.
    if (!window.show) {
      return 'paused'
    }

    if (
      !selection ||
      selection.target.championId !== target.championId ||
      selection.target.assignedPosition !== target.assignedPosition ||
      selection.target.gameMode !== target.gameMode ||
      selection.target.queueId !== target.queueId ||
      !selection.locked
    ) {
      return 'waitingLock'
    }

    return null
  }

  private async _applyRunes(
    task: RuneTask,
    isCurrent: () => boolean,
    progress: RuneWriteProgress = {}
  ) {
    const name = `[${i18next.t('appName', { ns: 'common' })}] ${useLeagueClientStore().gameData.championName(this._game.target!.championId)}`

    this._game.running = true
    this._game.failure = null

    try {
      await this._executor.setRunes(task.runes, name, progress, isCurrent)

      if (task.cycle === this._game.cycle) {
        this._game.applied = true
      }
    } catch (error) {
      if (!isAbortError(error) && isCurrent()) {
        const message = formatError(error)
        this._game.failure = { task, message, progress }
        this._context.logger.warn('Automatic rune application failed', message)
      }
    } finally {
      this._game.running = false
    }
  }
}
